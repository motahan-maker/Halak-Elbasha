import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-BQX6rsNh.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DfngpZea.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-DtMp32r9.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var phoneOnly = (p) => p.replace(/[^\d]/g, "");
var staffEmail = (phone) => `${phoneOnly(phone)}@staff.bashapp.local`;
var ADMIN_EMAIL = "admin@bashapp.local";
var ADMIN_DEFAULT_PASSWORD = "admin@123456";
var ensureDefaultAdmin_createServerFn_handler = createServerRpc({
	id: "57b58cf6a8c245d716695288348b07ab31035930bfad688bc9844ed38b06e02e",
	name: "ensureDefaultAdmin",
	filename: "src/lib/admin.functions.ts"
}, (opts) => ensureDefaultAdmin.__executeServer(opts));
var ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(ensureDefaultAdmin_createServerFn_handler, async () => {
	const { supabaseAdmin } = await import("./client.server-Bl14FYsb.mjs");
	const { data: list } = await supabaseAdmin.auth.admin.listUsers({
		page: 1,
		perPage: 200
	});
	let user = list?.users.find((u) => u.email === ADMIN_EMAIL) ?? null;
	if (!user) {
		const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
			email: ADMIN_EMAIL,
			password: ADMIN_DEFAULT_PASSWORD,
			email_confirm: true,
			user_metadata: {
				full_name: "المدير",
				phone: "admin",
				role: "admin"
			}
		});
		if (error || !created.user) throw new Error(error?.message ?? "ADMIN_CREATE_FAILED");
		user = created.user;
	} else await supabaseAdmin.auth.admin.updateUserById(user.id, { password: ADMIN_DEFAULT_PASSWORD });
	await supabaseAdmin.from("profiles").upsert({
		id: user.id,
		full_name: "المدير",
		phone: "admin"
	}, { onConflict: "id" });
	await supabaseAdmin.from("user_roles").upsert({
		user_id: user.id,
		role: "admin"
	}, { onConflict: "user_id,role" });
	await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id).eq("role", "customer");
	return { ok: true };
});
var claimAdminIfFirst_createServerFn_handler = createServerRpc({
	id: "a3ccb93e8665d6db1768fbd2a5d92b31924e354ab917d7fd403fa93b39b20c13",
	name: "claimAdminIfFirst",
	filename: "src/lib/admin.functions.ts"
}, (opts) => claimAdminIfFirst.__executeServer(opts));
var claimAdminIfFirst = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(claimAdminIfFirst_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-Bl14FYsb.mjs");
	const { count } = await supabaseAdmin.from("user_roles").select("*", {
		count: "exact",
		head: true
	}).eq("role", "admin");
	if ((count ?? 0) > 0) return {
		ok: false,
		reason: "ADMIN_EXISTS"
	};
	const { error } = await supabaseAdmin.from("user_roles").upsert({
		user_id: context.userId,
		role: "admin"
	}, { onConflict: "user_id,role" });
	if (error) throw new Error(error.message);
	await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId).eq("role", "customer");
	return { ok: true };
});
var createBarberAccount_createServerFn_handler = createServerRpc({
	id: "b1537e61a656cd0851fe74f4a17c41b7651346b0e8aee195a29575510c7ece6a",
	name: "createBarberAccount",
	filename: "src/lib/admin.functions.ts"
}, (opts) => createBarberAccount.__executeServer(opts));
var createBarberAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	name: stringType().trim().min(2).max(80),
	phone: stringType().trim().min(6).max(20),
	password: stringType().min(6).max(60),
	specialization: stringType().trim().max(120).optional().nullable()
}).parse(d)).handler(createBarberAccount_createServerFn_handler, async ({ context, data }) => {
	const { supabaseAdmin } = await import("./client.server-Bl14FYsb.mjs");
	const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("FORBIDDEN");
	const email = staffEmail(data.phone);
	const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: data.password,
		email_confirm: true,
		user_metadata: {
			full_name: data.name,
			phone: data.phone,
			role: "barber"
		}
	});
	if (createErr || !created.user) throw new Error(createErr?.message ?? "CREATE_FAILED");
	const uid = created.user.id;
	await supabaseAdmin.from("user_roles").upsert({
		user_id: uid,
		role: "barber"
	}, { onConflict: "user_id,role" });
	await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "customer");
	await supabaseAdmin.from("profiles").upsert({
		id: uid,
		full_name: data.name,
		phone: data.phone
	}, { onConflict: "id" });
	const { error: bErr } = await supabaseAdmin.from("barbers").insert({
		user_id: uid,
		name: data.name,
		phone: data.phone,
		specialization: data.specialization ?? null
	});
	if (bErr) throw new Error(bErr.message);
	return {
		ok: true,
		user_id: uid
	};
});
var resetBarberPassword_createServerFn_handler = createServerRpc({
	id: "419d58d00210e2083a03f3ad0e4f314ee990baea6954847361c11c1a7c216311",
	name: "resetBarberPassword",
	filename: "src/lib/admin.functions.ts"
}, (opts) => resetBarberPassword.__executeServer(opts));
var resetBarberPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType().uuid(),
	password: stringType().min(6).max(60)
}).parse(d)).handler(resetBarberPassword_createServerFn_handler, async ({ context, data }) => {
	const { supabaseAdmin } = await import("./client.server-Bl14FYsb.mjs");
	const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("FORBIDDEN");
	const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.password });
	if (error) throw new Error(error.message);
	return { ok: true };
});
var deleteBarberAccount_createServerFn_handler = createServerRpc({
	id: "c22218c9cb6cb29e5c4f7d034cb4f541192d6b10f58ffbaac59a97a303a1b838",
	name: "deleteBarberAccount",
	filename: "src/lib/admin.functions.ts"
}, (opts) => deleteBarberAccount.__executeServer(opts));
var deleteBarberAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ barber_id: stringType().uuid() }).parse(d)).handler(deleteBarberAccount_createServerFn_handler, async ({ context, data }) => {
	const { supabaseAdmin } = await import("./client.server-Bl14FYsb.mjs");
	const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("FORBIDDEN");
	const { data: row } = await supabaseAdmin.from("barbers").select("user_id").eq("id", data.barber_id).maybeSingle();
	await supabaseAdmin.from("barbers").delete().eq("id", data.barber_id);
	if (row?.user_id) await supabaseAdmin.auth.admin.deleteUser(row.user_id).catch(() => {});
	return { ok: true };
});
//#endregion
export { claimAdminIfFirst_createServerFn_handler, createBarberAccount_createServerFn_handler, deleteBarberAccount_createServerFn_handler, ensureDefaultAdmin_createServerFn_handler, resetBarberPassword_createServerFn_handler };
