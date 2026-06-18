import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-EKoJl9CN.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { p as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Scissors, h as Phone, l as ShieldCheck, n as User, x as Lock } from "../_libs/lucide-react.mjs";
import { a as customerEmail, c as ensureDefaultAdmin, d as useAuth, f as useServerFn, n as ADMIN_EMAIL, o as customerPassword, r as ThemeToggle, t as ADMIN_DEFAULT_PASSWORD, u as staffEmail } from "./admin.functions-huyZOYQ7.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-CbzUxr6_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function msg(e) {
	if (!e) return "حدث خطأ";
	if (typeof e === "string") return e;
	if (e instanceof Error) return e.message || "حدث خطأ";
	try {
		return e.message ?? JSON.stringify(e);
	} catch {
		return "حدث خطأ";
	}
}
function AuthPage() {
	const auth = useAuth();
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("customer");
	const ensureAdmin = useServerFn(ensureDefaultAdmin);
	(0, import_react.useEffect)(() => {
		if (!auth.loading && auth.user) navigate({
			to: "/",
			replace: true
		});
	}, [
		auth.loading,
		auth.user,
		navigate
	]);
	const [cName, setCName] = (0, import_react.useState)("");
	const [cPhone, setCPhone] = (0, import_react.useState)("");
	const [cLoading, setCLoading] = (0, import_react.useState)(false);
	const customerSubmit = async (e) => {
		e.preventDefault();
		if (!cName.trim() || !cPhone.trim()) return toast.error("ادخل الاسم والجوال");
		if (cPhone.replace(/[^\d]/g, "").length < 6) return toast.error("رقم جوال غير صالح");
		setCLoading(true);
		try {
			const email = customerEmail(cPhone);
			const password = customerPassword(cPhone);
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) {
				const { error: e2 } = await supabase.auth.signUp({
					email,
					password,
					options: { data: {
						full_name: cName.trim(),
						phone: cPhone.trim(),
						role: "customer"
					} }
				});
				if (e2) throw e2;
				const { error: e3 } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (e3) throw e3;
			}
			navigate({
				to: "/",
				replace: true
			});
		} catch (err) {
			toast.error(msg(err));
		} finally {
			setCLoading(false);
		}
	};
	const [sPhone, setSPhone] = (0, import_react.useState)("");
	const [sPwd, setSPwd] = (0, import_react.useState)("");
	const [sLoading, setSLoading] = (0, import_react.useState)(false);
	const staffSubmit = async (e) => {
		e.preventDefault();
		setSLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: staffEmail(sPhone),
			password: sPwd
		});
		setSLoading(false);
		if (error) return toast.error("بيانات الدخول غير صحيحة");
		navigate({
			to: "/",
			replace: true
		});
	};
	const [aUser, setAUser] = (0, import_react.useState)("admin");
	const [aPwd, setAPwd] = (0, import_react.useState)(ADMIN_DEFAULT_PASSWORD);
	const [aLoading, setALoading] = (0, import_react.useState)(false);
	const adminSubmit = async (e) => {
		e.preventDefault();
		setALoading(true);
		try {
			await ensureAdmin();
			if (aUser.trim().toLowerCase() !== "admin") throw new Error("اسم المستخدم غير صحيح");
			const { error } = await supabase.auth.signInWithPassword({
				email: ADMIN_EMAIL,
				password: aPwd
			});
			if (error) throw new Error("كلمة المرور غير صحيحة");
			navigate({
				to: "/",
				replace: true
			});
		} catch (err) {
			toast.error(msg(err));
		} finally {
			setALoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed top-4 left-4 z-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto grid h-20 w-20 place-items-center rounded-2xl gradient-luxe shadow-luxe",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-10 w-10 text-primary-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 text-3xl font-black text-gradient-gold",
							children: "حلاق الباشا"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "احجز موعدك بضغطة واحدة"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 inline-flex w-full rounded-2xl border border-border bg-card p-1",
					children: [
						["customer", "عميل"],
						["staff", "موظف"],
						["admin", "مدير"]
					].map(([k, lbl]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setTab(k),
						className: `flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === k ? "gradient-luxe text-primary-foreground" : "text-muted-foreground"}`,
						children: lbl
					}, k))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 rounded-2xl border border-border bg-card p-5 shadow-card",
					children: [
						tab === "customer" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: customerSubmit,
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }),
									placeholder: "الاسم بالكامل",
									value: cName,
									onChange: setCName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4" }),
									placeholder: "رقم الجوال",
									type: "tel",
									value: cPhone,
									onChange: setCPhone
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: cLoading,
									className: "w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60",
									children: cLoading ? "..." : "دخول / تسجيل"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-xs text-muted-foreground",
									children: "لا حاجة لكلمة مرور — الرقم هو هويتك"
								})
							]
						}),
						tab === "staff" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: staffSubmit,
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4" }),
									placeholder: "رقم الجوال",
									type: "tel",
									value: sPhone,
									onChange: setSPhone
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }),
									placeholder: "كلمة المرور",
									type: "password",
									value: sPwd,
									onChange: setSPwd
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: sLoading,
									className: "w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60",
									children: sLoading ? "..." : "دخول"
								})
							]
						}),
						tab === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: adminSubmit,
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-primary" }), "دخول المدير الافتراضي"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }),
									placeholder: "اسم المستخدم",
									value: aUser,
									onChange: setAUser
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }),
									placeholder: "كلمة المرور",
									type: "password",
									value: aPwd,
									onChange: setAPwd
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: aLoading,
									className: "w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60",
									children: aLoading ? "..." : "دخول كمدير"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-center text-[11px] text-muted-foreground",
									children: [
										"الافتراضي: ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono",
											children: "admin"
										}),
										" /",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono",
											children: "admin@123456"
										})
									]
								})
							]
						})
					]
				})
			]
		})]
	});
}
function Field({ icon, placeholder, value, onChange, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 rounded-xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-primary/50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder,
			type,
			className: "w-full bg-transparent py-3 text-sm outline-none"
		})]
	});
}
//#endregion
export { AuthPage as component };
