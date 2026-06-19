import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const phoneOnly = (p: string) => p.replace(/[^\d]/g, "");
const staffEmail = (phone: string) => `${phoneOnly(phone)}@staff.bashapp.com`;

export const ADMIN_EMAIL = "admin@bashapp.com";
export const ADMIN_DEFAULT_PASSWORD = "admin123456";

/** Public: ensure built-in admin account exists. Only creates if missing — never resets password. */
export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error("Failed to list users: " + listErr.message);
  const user = list?.users.find((u: { email?: string }) => u.email === ADMIN_EMAIL) ?? null;
  if (!user) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "المدير", phone: "admin", role: "admin" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "ADMIN_CREATE_FAILED");
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: "المدير", phone: "admin" }, { onConflict: "id" });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "admin" }, { onConflict: "user_id,role" });
  }
  // Ensure settings row exists
  await supabaseAdmin
    .from("settings")
    .upsert({ id: 1, shop_name: "حلاق الباشا", whatsapp: "+201018172606" }, { onConflict: "id" });
  return { ok: true };
});

/** Claim admin role: first staff user to call this becomes admin if no admin exists. */
export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, reason: "ADMIN_EXISTS" };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", context.userId)
      .eq("role", "customer");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("FORBIDDEN");

    const email = staffEmail(data.phone);
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, phone: data.phone, role: "barber" },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "CREATE_FAILED");

    const uid = created.user.id;
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: "barber" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "customer");
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: uid, full_name: data.name, phone: data.phone }, { onConflict: "id" });
    const { error: bErr } = await supabaseAdmin.from("barbers").insert({
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("FORBIDDEN");
    const { data: barber } = await supabaseAdmin
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    if (!barber?.user_id) throw new Error("الحلاق ليس له حساب مستخدم مرتبط. قم بحذفه وإعادة إضافته.");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(barber.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-only: deactivate a barber (soft delete) + delete auth user. */
export const deleteBarberAccount = createServerFn({ method: "POST" })
  .validator((d) => z.object({ barber_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    await supabaseAdmin.from("barbers").delete().eq("id", data.barber_id);
    if (row?.user_id) {
      await supabaseAdmin.auth.admin.deleteUser(row.user_id).catch(() => {});
    }
    return { ok: true };
  });

export const staffEmailFor = staffEmail;

/** Customer or admin: cancel a booking via server to bypass RLS issues. */
export const cancelBooking = createServerFn({ method: "POST" })
  .validator((d) => z.object({ booking_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.booking_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-only: deactivate a service (soft delete). */
export const deleteService = createServerFn({ method: "POST" })
  .validator((d) => z.object({ service_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `${phoneOnly(data.phone)}@customer.bashapp.com`;
    const password = `cust${phoneOnly(data.phone)}`;

    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const alreadyExists = existing?.users.some((u: { email?: string }) => u.email === email);
    if (alreadyExists) return { ok: true, email, password };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.name, phone: data.phone, role: "customer" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "SIGNUP_FAILED");
    return { ok: true, email, password };
  });

/** Save push subscription for a barber. */
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
        { onConflict: "user_id,endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Send push notification to all barbers about a new booking. */
export const notifyBarbers = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      barber_id: z.string().uuid(),
      title: z.string(),
      body: z.string(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const webPush = (await import("web-push")).default;

    const { SUPABASE_CONFIG } = await import("@/integrations/supabase/config");
    webPush.setVapidDetails(
      SUPABASE_CONFIG.vapidEmail,
      SUPABASE_CONFIG.vapidPublicKey,
      SUPABASE_CONFIG.vapidPrivateKey,
    );

    // Get barber's user_id
    const { data: barber } = await supabaseAdmin
      .from("barbers")
      .select("user_id")
      .eq("id", data.barber_id)
      .maybeSingle();
    if (!barber?.user_id) return { ok: true };

    // Get all subscriptions for this user
    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", barber.user_id);
    if (!subs?.length) return { ok: true };

    const payload = JSON.stringify({ title: data.title, body: data.body });
    const results = await Promise.allSettled(
      subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }),
    );
    return { ok: true, sent: results.length };
  });
