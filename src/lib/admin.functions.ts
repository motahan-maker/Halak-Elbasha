import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const phoneOnly = (p: string) => p.replace(/[^\d]/g, "");
const staffEmail = (phone: string) => `${phoneOnly(phone)}@staff.bashapp.com`;

export const ADMIN_EMAIL = "admin@bashapp.com";
export const ADMIN_DEFAULT_PASSWORD = "admin123456";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(userId: string) {
  const client = await db();
  const { data } = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("FORBIDDEN");
}

async function isAdmin(userId: string) {
  const client = await db();
  const { data } = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

/** Barber profile of the caller, or null when the caller is not a barber. */
async function barberOf(userId: string) {
  const client = await db();
  const { data } = await client
    .from("barbers")
    .select("id, user_id, name")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

type BookingRef = {
  id: string;
  customer_id: string | null;
  barber_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  status: string;
};

async function loadBooking(bookingId: string): Promise<BookingRef> {
  const client = await db();
  const { data } = await client
    .from("bookings")
    .select("id, customer_id, barber_id, service_name, booking_date, booking_time, customer_name, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!data) throw new Error("BOOKING_NOT_FOUND");
  return data as BookingRef;
}

/** Only the barber who owns the booking or an admin may act on it. */
async function assertBarberOrAdmin(userId: string, barberId: string) {
  if (await isAdmin(userId)) return { admin: true, barber: null };
  const barber = await barberOf(userId);
  if (!barber || barber.id !== barberId) throw new Error("FORBIDDEN");
  return { admin: false, barber };
}

/** Best-effort Web Push to a set of user ids. Never throws. */
async function sendPushToUsers(userIds: string[], title: string, body: string) {
  const ids = userIds.filter(Boolean);
  if (!ids.length) return 0;
  try {
    const client = await db();
    const webPush = (await import("web-push")).default;
    const { SUPABASE_CONFIG } = await import("@/integrations/supabase/config");
    const { SERVER_SECRETS } = await import("@/integrations/supabase/config.server");
    webPush.setVapidDetails(
      SUPABASE_CONFIG.vapidEmail,
      SUPABASE_CONFIG.vapidPublicKey,
      SERVER_SECRETS.vapidPrivateKey,
    );
    const { data: subs } = await client
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", ids);
    if (!subs?.length) return 0;
    const payload = JSON.stringify({ title, body });
    const results = await Promise.allSettled(
      subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await client.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }),
    );
    return results.length;
  } catch {
    return 0;
  }
}

const fmt = (t?: string | null) => (t ? t.slice(0, 5) : "");

/** Public: ensure built-in admin account exists. Only creates if missing — never resets password. */
export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const client = await db();
  const { data: list, error: listErr } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error("Failed to list users: " + listErr.message);
  const user = list?.users.find((u: { email?: string }) => u.email === ADMIN_EMAIL) ?? null;
  if (!user) {
    const { data: created, error } = await client.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "المدير", phone: "admin", role: "admin" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "ADMIN_CREATE_FAILED");
    await client
      .from("profiles")
      .upsert({ id: created.user.id, full_name: "المدير", phone: "admin" }, { onConflict: "id" });
    await client
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });
  }
  // Seed the settings row only when it is missing — never overwrite shop details.
  const { data: settingsRow } = await client.from("settings").select("id").eq("id", 1).maybeSingle();
  if (!settingsRow) {
    await client
      .from("settings")
      .insert({ id: 1, shop_name: "حلاق الباشا", whatsapp: "+201018172606" });
  }
  return { ok: true };
});

/** Claim admin role: first staff user to call this becomes admin if no admin exists. */
export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = await db();
    const { count } = await client
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, reason: "ADMIN_EXISTS" };
    const { error } = await client
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    await client.from("user_roles").delete().eq("user_id", context.userId).eq("role", "customer");
    return { ok: true };
  });

/** Admin-only: create a barber auth account + barbers row. */
export const createBarberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(6).max(20),
        password: z.string().min(6).max(60),
        specialization: z.string().trim().max(120).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const client = await db();

    const email = staffEmail(data.phone);
    const { data: created, error: createErr } = await client.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, phone: data.phone, role: "barber" },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "CREATE_FAILED");

    const uid = created.user.id;
    await client
      .from("user_roles")
      .upsert({ user_id: uid, role: "barber" }, { onConflict: "user_id,role" });
    await client.from("user_roles").delete().eq("user_id", uid).eq("role", "customer");
    await client
      .from("profiles")
      .upsert({ id: uid, full_name: data.name, phone: data.phone }, { onConflict: "id" });
    const { error: bErr } = await client.from("barbers").insert({
      user_id: uid,
      name: data.name,
      phone: data.phone,
      specialization: data.specialization ?? null,
    });
    if (bErr) throw new Error(bErr.message);
    return { ok: true, user_id: uid };
  });

export const resetBarberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({ barber_id: z.string().uuid(), password: z.string().min(6).max(60) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const client = await db();
    const { data: barber } = await client
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    if (!barber?.user_id) throw new Error("الحلاق ليس له حساب مستخدم مرتبط. قم بحذفه وإعادة إضافته.");
    const { error } = await client.auth.admin.updateUserById(barber.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Admin-only: deactivate a barber and revoke login access.
 * The barbers row is kept (bookings/reviews reference it) — the admin can re-activate later.
 */
export const deleteBarberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ barber_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const client = await db();
    const { data: row } = await client
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    const { error } = await client
      .from("barbers")
      .update({ is_active: false, is_working: false } as any)
      .eq("id", data.barber_id);
    if (error) throw new Error(error.message);
    if (row?.user_id) {
      await client.from("push_subscriptions").delete().eq("user_id", row.user_id);
      await client.auth.admin.deleteUser(row.user_id).catch(() => {});
    }
    return { ok: true };
  });

export const staffEmailFor = staffEmail;

/** Customer cancel a booking via server. */
export const cancelBookingByCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = await db();
    const booking = await loadBooking(data.booking_id);
    if (booking.customer_id !== context.userId && !(await isAdmin(context.userId))) {
      throw new Error("FORBIDDEN");
    }

    const { error: rpcErr } = await client.rpc("cancel_booking_by_customer" as any, {
      _booking_id: data.booking_id,
    });
    if (rpcErr) {
      // Fallback direct update
      let { error } = await client
        .from("bookings")
        .update({ status: "cancelled_by_customer" as any })
        .eq("id", data.booking_id);
      if (error && error.message.includes("booking_status")) {
        // Fallback to legacy status 'cancelled'
        const res = await client
          .from("bookings")
          .update({ status: "cancelled" as any })
          .eq("id", data.booking_id);
        error = res.error;
      }
      if (error) throw new Error(error.message);
    }

    // Tell the barber their slot just freed up.
    const { data: barber } = await client
      .from("barbers")
      .select("user_id")
      .eq("id", booking.barber_id)
      .maybeSingle();
    if (barber?.user_id) {
      await sendPushToUsers(
        [barber.user_id],
        "تم إلغاء حجز",
        `${booking.customer_name} — ${booking.service_name} ${fmt(booking.booking_time)}`,
      );
    }
    return { ok: true };
  });

/** Barber or admin cancel a booking via server. */
export const cancelBookingByBarber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = await db();
    const booking = await loadBooking(data.booking_id);
    await assertBarberOrAdmin(context.userId, booking.barber_id);

    const { error: rpcErr } = await client.rpc("cancel_booking_by_barber" as any, {
      _booking_id: data.booking_id,
    });
    if (rpcErr) {
      let { error } = await client
        .from("bookings")
        .update({ status: "cancelled_by_barber" as any })
        .eq("id", data.booking_id);
      if (error && error.message.includes("booking_status")) {
        const res = await client
          .from("bookings")
          .update({ status: "cancelled" as any })
          .eq("id", data.booking_id);
        error = res.error;
      }
      if (error) throw new Error(error.message);
    }

    if (booking.customer_id) {
      await sendPushToUsers(
        [booking.customer_id],
        "تم إلغاء موعدك",
        `${booking.service_name} — ${fmt(booking.booking_time)}. تواصل معنا لإعادة الحجز.`,
      );
    }
    return { ok: true };
  });

/** Update barber working status (working / available). */
export const setBarberWorkingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ barber_id: z.string().uuid(), is_working: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertBarberOrAdmin(context.userId, data.barber_id);
    const client = await db();

    // First try RPC function which auto-creates column and reloads PostgREST schema cache
    const { error: rpcErr } = await client.rpc("set_barber_working_status", {
      _barber_id: data.barber_id,
      _is_working: data.is_working,
    });

    if (!rpcErr) return { ok: true };

    // Fallback: direct table update
    const { error } = await client
      .from("barbers")
      .update({ is_working: data.is_working } as any)
      .eq("id", data.barber_id);

    if (error && !error.message.includes("is_working")) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

/**
 * Barber starts serving a booking: stamps `started_at` so the customer sees
 * "جارٍ الخدمة الآن" live, without touching the booking_status enum.
 */
export const startBookingService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = await db();
    const booking = await loadBooking(data.booking_id);
    await assertBarberOrAdmin(context.userId, booking.barber_id);

    const now = new Date().toISOString();
    const { error: rpcErr } = await client.rpc("start_booking_service" as any, {
      _booking_id: data.booking_id,
    });
    if (rpcErr) {
      const { error } = await client
        .from("bookings")
        .update({ started_at: now } as any)
        .eq("id", data.booking_id);
      if (error) {
        // Column not migrated yet — the global working flag still drives the customer UI.
        return { ok: true, degraded: true };
      }
    }

    if (booking.customer_id) {
      await sendPushToUsers(
        [booking.customer_id],
        "بدأ حلاقك الخدمة",
        `${booking.service_name} — ${fmt(booking.booking_time)}. أهلاً بك!`,
      );
    }
    return { ok: true, degraded: false };
  });

/** Barber finishes a booking: marks it completed + clears the working flag + notifies the customer. */
export const completeBookingService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = await db();
    const booking = await loadBooking(data.booking_id);
    await assertBarberOrAdmin(context.userId, booking.barber_id);

    const { error: rpcErr } = await client.rpc("complete_booking_service" as any, {
      _booking_id: data.booking_id,
    });
    if (rpcErr) {
      const { error } = await client
        .from("bookings")
        .update({ status: "completed" as any, completed_at: new Date().toISOString() } as any)
        .eq("id", data.booking_id);
      if (error) {
        const res = await client
          .from("bookings")
          .update({ status: "completed" as any })
          .eq("id", data.booking_id);
        if (res.error) throw new Error(res.error.message);
      }
    }

    await client
      .from("barbers")
      .update({ is_working: false } as any)
      .eq("id", booking.barber_id);

    if (booking.customer_id) {
      await sendPushToUsers(
        [booking.customer_id],
        "تم إنهاء موعدك",
        `${booking.service_name}. لا تنسَ تقييم الخدمة من تبويب مواعيدي.`,
      );
    }
    return { ok: true };
  });

/** Admin-only: deactivate a service (soft delete). */
export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ service_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const client = await db();
    const { error } = await client
      .from("services")
      .update({ is_active: false })
      .eq("id", data.service_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public: sign up a customer via admin API (bypasses email confirmation). */
export const signUpCustomer = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        name: z.string().trim().min(1),
        phone: z.string().trim().min(6),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const client = await db();
    const phone = phoneOnly(data.phone);
    const email = `${phone}@customer.bashapp.com`;
    const password = `cust${phone}`;

    const { data: profiles } = await client
      .from("profiles")
      .select("id, full_name")
      .eq("phone", data.phone.trim())
      .limit(1);

    if (profiles && profiles.length > 0) {
      const existingName = (profiles[0].full_name || "").trim();
      const newName = data.name.trim();
      if (existingName === newName) {
        return { ok: true, email, password, existing: true };
      }
      throw new Error("هذا الرقم مسجل بحساب آخر بالفعل");
    }

    const { data: created, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.name, phone: data.phone, role: "customer" },
    });
    if (error) throw new Error("حدث خطأ أثناء إنشاء الحساب");
    if (!created?.user) throw new Error("حدث خطأ أثناء إنشاء الحساب");
    return { ok: true, email, password, existing: false };
  });

/** Save push subscription for the signed-in user (barber or customer). */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const client = await db();
    const { error } = await client
      .from("push_subscriptions")
      .upsert(
        { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
        { onConflict: "user_id,endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove a push subscription (used when the user turns notifications off). */
export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ endpoint: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const client = await db();
    const { error } = await client
      .from("push_subscriptions")
      .delete()
      .eq("user_id", context.userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Send a push notification to a barber's devices (new booking created by a customer). */
export const notifyBarbers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      barber_id: z.string().uuid(),
      title: z.string().max(80),
      body: z.string().max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const client = await db();
    const { data: barber } = await client
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    if (!barber?.user_id) return { ok: true, sent: 0 };
    const sent = await sendPushToUsers([barber.user_id], data.title, data.body);
    return { ok: true, sent };
  });
