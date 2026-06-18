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
    z.object({ user_id: z.string().uuid(), password: z.string().min(6).max(60) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("FORBIDDEN");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBarberAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ barber_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("FORBIDDEN");
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
