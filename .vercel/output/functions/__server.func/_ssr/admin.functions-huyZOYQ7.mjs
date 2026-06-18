import { r as __toESM } from "../_runtime.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-BQX6rsNh.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DfngpZea.mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-C3EylygI.mjs";
import { t as supabase } from "./client-EKoJl9CN.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { h as isRedirect, m as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Moon, o as Sun, v as Monitor } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-huyZOYQ7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
function useAuth() {
	const [state, setState] = (0, import_react.useState)({
		loading: true,
		session: null,
		user: null,
		role: null,
		profile: null
	});
	const loadRoleAndProfile = async (user) => {
		if (!user) {
			setState({
				loading: false,
				session: null,
				user: null,
				role: null,
				profile: null
			});
			return;
		}
		const [{ data: roles }, { data: profile }] = await Promise.all([supabase.from("user_roles").select("role").eq("user_id", user.id), supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()]);
		const roleList = (roles ?? []).map((r) => r.role);
		const role = roleList.includes("admin") ? "admin" : roleList.includes("barber") ? "barber" : roleList.includes("customer") ? "customer" : null;
		setState((s) => ({
			...s,
			loading: false,
			user,
			session: s.session,
			role,
			profile: profile ?? null
		}));
	};
	const refresh = async () => {
		const { data } = await supabase.auth.getSession();
		setState((s) => ({
			...s,
			session: data.session,
			user: data.session?.user ?? null
		}));
		await loadRoleAndProfile(data.session?.user ?? null);
	};
	(0, import_react.useEffect)(() => {
		let mounted = true;
		const sub = supabase.auth.onAuthStateChange((_e, session) => {
			if (!mounted) return;
			setState((s) => ({
				...s,
				session,
				user: session?.user ?? null,
				loading: true
			}));
			loadRoleAndProfile(session?.user ?? null);
		});
		refresh();
		return () => {
			mounted = false;
			sub.data.subscription.unsubscribe();
		};
	}, []);
	return {
		...state,
		refresh
	};
}
var customerEmail = (phone) => `${phone.replace(/[^\d]/g, "")}@customer.bashapp.local`;
var staffEmail = (phone) => `${phone.replace(/[^\d]/g, "")}@staff.bashapp.local`;
var customerPassword = (phone) => `pwd_${phone.replace(/[^\d]/g, "")}_bashapp`;
var KEY = "basha-theme";
function applyTheme(mode) {
	if (typeof window === "undefined") return;
	const root = document.documentElement;
	const dark = mode === "dark" || mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
	root.classList.toggle("dark", dark);
}
function useTheme() {
	const [mode, setMode] = (0, import_react.useState)("system");
	(0, import_react.useEffect)(() => {
		const stored = localStorage.getItem(KEY) ?? "system";
		setMode(stored);
		applyTheme(stored);
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => stored === "system" && applyTheme("system");
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);
	const update = (next) => {
		setMode(next);
		localStorage.setItem(KEY, next);
		applyTheme(next);
	};
	return {
		mode,
		setMode: update
	};
}
function ThemeToggle() {
	const { mode, setMode } = useTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "inline-flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 backdrop-blur",
		children: [
			{
				v: "light",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }),
				label: "نهاري"
			},
			{
				v: "dark",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-4 w-4" }),
				label: "ليلي"
			},
			{
				v: "system",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "h-4 w-4" }),
				label: "تلقائي"
			}
		].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => setMode(o.v),
			"aria-label": o.label,
			className: `flex h-8 w-8 items-center justify-center rounded-full transition ${mode === o.v ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`,
			children: o.icon
		}, o.v))
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ADMIN_EMAIL = "admin@bashapp.local";
var ADMIN_DEFAULT_PASSWORD = "admin@123456";
/** Public: ensure built-in admin account exists with the default credentials. Idempotent. */
var ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(createSsrRpc("57b58cf6a8c245d716695288348b07ab31035930bfad688bc9844ed38b06e02e"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("a3ccb93e8665d6db1768fbd2a5d92b31924e354ab917d7fd403fa93b39b20c13"));
/** Admin-only: create a barber auth account + barbers row. */
var createBarberAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	name: stringType().trim().min(2).max(80),
	phone: stringType().trim().min(6).max(20),
	password: stringType().min(6).max(60),
	specialization: stringType().trim().max(120).optional().nullable()
}).parse(d)).handler(createSsrRpc("b1537e61a656cd0851fe74f4a17c41b7651346b0e8aee195a29575510c7ece6a"));
var resetBarberPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType().uuid(),
	password: stringType().min(6).max(60)
}).parse(d)).handler(createSsrRpc("419d58d00210e2083a03f3ad0e4f314ee990baea6954847361c11c1a7c216311"));
var deleteBarberAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ barber_id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c22218c9cb6cb29e5c4f7d034cb4f541192d6b10f58ffbaac59a97a303a1b838"));
//#endregion
export { customerEmail as a, ensureDefaultAdmin as c, useAuth as d, useServerFn as f, createBarberAccount as i, resetBarberPassword as l, ADMIN_EMAIL as n, customerPassword as o, ThemeToggle as r, deleteBarberAccount as s, ADMIN_DEFAULT_PASSWORD as t, staffEmail as u };
