import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-EKoJl9CN.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { p as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as House, D as Calendar, E as Check, O as CalendarDays, S as KeyRound, T as ChevronLeft, a as Tag, b as LogOut, c as Sparkles, d as Search, f as Scissors, g as Pen, h as Phone, i as Trash2, m as Plus, n as User, p as Power, r as TrendingUp, s as Star, t as Users, u as Settings, w as Clock, y as MessageCircle } from "../_libs/lucide-react.mjs";
import { d as useAuth, f as useServerFn, i as createBarberAccount, l as resetBarberPassword, r as ThemeToggle, s as deleteBarberAccount } from "./admin.functions-huyZOYQ7.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CLM4QSCv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var toMin = (t) => {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + m;
};
var fromMin = (n) => {
	const h = Math.floor(n / 60);
	const m = n % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
var arabicHour12 = (t) => {
	const [h, m] = t.split(":").map(Number);
	const period = h >= 12 ? "م" : "ص";
	return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
};
function generateSlots(cfg, bookedTimes = []) {
	const start = toMin(cfg.start_time);
	const end = toMin(cfg.end_time);
	const bs = cfg.break_start ? toMin(cfg.break_start) : null;
	const be = cfg.break_end ? toMin(cfg.break_end) : null;
	const dur = cfg.slot_minutes;
	const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)));
	const slots = [];
	for (let t = start; t + dur <= end + dur; t += dur) {
		if (t >= end) break;
		const time = fromMin(t);
		const isBreak = bs !== null && be !== null && t >= bs && t < be;
		const isBooked = booked.has(time);
		slots.push({
			time,
			label: arabicHour12(time),
			kind: isBreak ? "break" : isBooked ? "booked" : "available"
		});
	}
	return slots;
}
function digitsOnly(phone) {
	return phone.replace(/[^\d]/g, "");
}
function buildWhatsAppLink(phone, message) {
	return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`;
}
function arabicDate(d) {
	const date = typeof d === "string" ? new Date(d) : d;
	return new Intl.DateTimeFormat("ar-EG", {
		year: "numeric",
		month: "long",
		day: "numeric",
		weekday: "long"
	}).format(date);
}
function arabicShortDate(d) {
	const date = typeof d === "string" ? new Date(d) : d;
	return new Intl.DateTimeFormat("ar-EG", {
		month: "short",
		day: "numeric",
		weekday: "short"
	}).format(date);
}
function isoDate(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
var ARABIC_DAYS = [
	"الأحد",
	"الإثنين",
	"الثلاثاء",
	"الأربعاء",
	"الخميس",
	"الجمعة",
	"السبت"
];
function CustomerApp() {
	const auth = useAuth();
	const navigate = useNavigate();
	const [tab, setTab] = (0, import_react.useState)("home");
	const qc = useQueryClient();
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: async () => {
			const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
			return data;
		}
	});
	if (!auth.user) return null;
	const signOut = async () => {
		await supabase.auth.signOut();
		qc.clear();
		navigate({ to: "/auth" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 glass",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe shadow-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-5 w-5 text-primary-foreground" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-sm font-bold",
								children: settings.data?.shop_name ?? "حلاق الباشا"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: ["مرحباً، ", auth.profile?.full_name ?? "صديقنا"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: signOut,
							"aria-label": "خروج",
							className: "grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-2xl flex-1 px-4 pt-4",
				children: [
					tab === "home" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerHome, {
						settings: settings.data,
						onBook: () => setTab("home")
					}),
					tab === "bookings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsList, {}),
					tab === "offers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffersList, {}),
					tab === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileView, { settings: settings.data })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {
				tab,
				onChange: setTab
			})
		]
	});
}
function CustomerHome({ settings, onBook }) {
	const [wizardOpen, setWizardOpen] = (0, import_react.useState)(false);
	const offers = useQuery({
		queryKey: ["offers", "active"],
		queryFn: async () => {
			const { data } = await supabase.from("offers").select("*").eq("is_active", true).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	if (wizardOpen) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingWizard, {
		settings,
		onDone: () => {
			setWizardOpen(false);
			onBook();
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "overflow-hidden rounded-3xl gradient-night p-6 text-primary-foreground shadow-luxe",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), " تجربة فاخرة"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-2 text-3xl font-black leading-tight text-gradient-gold",
						children: ["يسعدنا خدمتك في ", settings?.shop_name ?? "حلاق الباشا"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm opacity-80",
						children: "احجز موعدك بضغطة واحدة. مواعيدنا مرتبة ودقيقة."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setWizardOpen(true),
						className: "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-black text-primary-foreground shadow-luxe transition active:scale-[0.98]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-5 w-5" }), " ابدأ الحجز"]
					})
				]
			}),
			(offers.data?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 px-1 text-sm font-bold text-muted-foreground",
				children: "العروض الحالية"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: offers.data.slice(0, 3).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-bold",
								children: o.title
							}), o.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: o.description
							})]
						}),
						o.discount_percent != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary",
							children: [
								"-",
								o.discount_percent,
								"٪"
							]
						})
					]
				}, o.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarbersShowcase, {})
		]
	});
}
function BarbersShowcase() {
	const barbers = useQuery({
		queryKey: ["barbers", "showcase"],
		queryFn: async () => {
			const { data: list } = await supabase.from("barbers").select("*").eq("is_active", true);
			const ids = (list ?? []).map((b) => b.id);
			const { data: reviews } = await supabase.from("reviews").select("barber_id, rating").in("barber_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
			const stats = {};
			(reviews ?? []).forEach((r) => {
				stats[r.barber_id] ??= {
					sum: 0,
					cnt: 0
				};
				stats[r.barber_id].sum += r.rating;
				stats[r.barber_id].cnt += 1;
			});
			return (list ?? []).map((b) => ({
				...b,
				avg: stats[b.id] ? stats[b.id].sum / stats[b.id].cnt : 0,
				cnt: stats[b.id]?.cnt ?? 0
			}));
		}
	});
	if (!barbers.data?.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "mb-2 px-1 text-sm font-bold text-muted-foreground",
		children: "فريق الحلاقين"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-2",
		children: barbers.data.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-3 shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-12 w-12 place-items-center rounded-xl gradient-luxe text-lg font-black text-primary-foreground",
					children: b.name.charAt(0)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 truncate font-bold",
					children: b.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "truncate text-xs text-muted-foreground",
					children: b.specialization || "حلاق"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex items-center gap-1 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-primary text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold",
							children: b.avg ? b.avg.toFixed(1) : "جديد"
						}),
						b.cnt > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [
								"(",
								b.cnt,
								")"
							]
						})
					]
				})
			]
		}, b.id))
	})] });
}
function BookingWizard({ settings, onDone }) {
	const auth = useAuth();
	const [step, setStep] = (0, import_react.useState)("service");
	const [service, setService] = (0, import_react.useState)(null);
	const [barber, setBarber] = (0, import_react.useState)(null);
	const [date, setDate] = (0, import_react.useState)(null);
	const [time, setTime] = (0, import_react.useState)(null);
	const [created, setCreated] = (0, import_react.useState)(null);
	const services = useQuery({
		queryKey: ["services", "active"],
		queryFn: async () => {
			const { data } = await supabase.from("services").select("*").eq("is_active", true).order("price");
			return data ?? [];
		}
	});
	const barbers = useQuery({
		queryKey: ["barbers", "active"],
		queryFn: async () => {
			const { data } = await supabase.from("barbers").select("*").eq("is_active", true).order("name");
			return data ?? [];
		}
	});
	const workingDays = barber?.working_days ?? settings.working_days;
	const dates = (0, import_react.useMemo)(() => {
		const out = [];
		const today = /* @__PURE__ */ new Date();
		today.setHours(0, 0, 0, 0);
		for (let i = 0; i < 14; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() + i);
			out.push({
				iso: isoDate(d),
				date: d,
				available: (workingDays ?? []).includes(d.getDay())
			});
		}
		return out;
	}, [workingDays]);
	const bookedQ = useQuery({
		queryKey: [
			"booked",
			barber?.id,
			date
		],
		enabled: !!barber && !!date,
		queryFn: async () => {
			const { data } = await supabase.from("bookings").select("booking_time").eq("barber_id", barber.id).eq("booking_date", date).neq("status", "cancelled");
			return (data ?? []).map((r) => r.booking_time);
		}
	});
	const slots = (0, import_react.useMemo)(() => {
		if (!date || !barber) return [];
		return generateSlots({
			start_time: barber.start_time ?? settings.start_time,
			end_time: barber.end_time ?? settings.end_time,
			break_start: barber.break_start ?? settings.break_start,
			break_end: barber.break_end ?? settings.break_end,
			slot_minutes: barber.slot_minutes ?? 40
		}, bookedQ.data ?? []);
	}, [
		date,
		barber,
		settings,
		bookedQ.data
	]);
	const confirm = useMutation({
		mutationFn: async () => {
			const { data, error } = await supabase.rpc("create_booking", {
				_barber_id: barber.id,
				_service_id: service.id,
				_booking_date: date,
				_booking_time: time
			});
			if (error) {
				if (String(error.message).includes("SLOT_TAKEN") || String(error.message).includes("bookings_no_double")) throw new Error("هذا الموعد محجوز بالفعل");
				throw new Error(error.message);
			}
			return data;
		},
		onSuccess: (b) => {
			setCreated(b);
			setStep("success");
		},
		onError: (e) => toast.error(e.message)
	});
	const stepIndex = [
		"service",
		"barber",
		"date",
		"time",
		"confirm"
	].indexOf(step);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							if (step === "service" || step === "success") onDone();
							else if (step === "barber") setStep("service");
							else if (step === "date") setStep("barber");
							else if (step === "time") setStep("date");
							else if (step === "confirm") setStep("time");
						},
						className: "grid h-9 w-9 place-items-center rounded-full border border-border bg-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4 rotate-180" })
					}),
					step !== "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1.5",
						children: [
							0,
							1,
							2,
							3,
							4
						].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-1.5 rounded-full transition-all ${i <= stepIndex ? "w-8 gradient-luxe" : "w-4 bg-muted"}` }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9" })
				]
			}),
			step === "service" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xl font-black",
				children: "اختر الخدمة"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: services.data?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setService(s);
						setStep("barber");
					},
					className: "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right shadow-card transition hover:border-primary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-bold",
								children: s.name
							}), s.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: s.description
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "shrink-0 text-lg font-black text-primary",
							children: [s.price, " ج.م"]
						})
					]
				}, s.id))
			})] }),
			step === "barber" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xl font-black",
					children: "اختر الحلاق"
				}),
				!barbers.data?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground",
					children: "لم يقم المدير بإضافة حلاقين بعد."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: barbers.data?.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setBarber(b);
							setStep("date");
						},
						className: "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right shadow-card transition hover:border-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-luxe text-lg font-black text-primary-foreground",
							children: b.name.charAt(0)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-bold",
								children: b.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: b.specialization || "حلاق"
							})]
						})]
					}, b.id))
				})
			] }),
			step === "date" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xl font-black",
				children: "اختر التاريخ"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2 sm:grid-cols-4",
				children: dates.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					disabled: !d.available,
					onClick: () => {
						setDate(d.iso);
						setStep("time");
					},
					className: `rounded-2xl border p-3 text-center shadow-card transition ${!d.available ? "border-border bg-muted opacity-50" : "border-border bg-card hover:border-primary"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: ARABIC_DAYS[d.date.getDay()]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-lg font-black",
							children: d.date.getDate()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground",
							children: arabicShortDate(d.date).split(" ").slice(-1)[0]
						})
					]
				}, d.iso))
			})] }),
			step === "time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-xl font-black",
				children: "اختر الوقت"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: slots.map((s) => {
					const disabled = s.kind !== "available";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled,
						onClick: () => {
							setTime(s.time);
							setStep("confirm");
						},
						className: `rounded-xl border p-2.5 text-sm font-bold transition ${s.kind === "available" ? "border-success/30 bg-success/10 text-success hover:border-success" : s.kind === "booked" ? "border-destructive/30 bg-destructive/10 text-destructive/70" : "border-border bg-muted text-muted-foreground"} ${disabled ? "cursor-not-allowed opacity-70" : ""}`,
						children: [
							s.label,
							s.kind === "break" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] font-normal",
								children: "استراحة"
							}),
							s.kind === "booked" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] font-normal",
								children: "محجوز"
							})
						]
					}, s.time);
				})
			})] }),
			step === "confirm" && service && barber && date && time && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-black",
						children: "تأكيد الحجز"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "الاسم",
								value: auth.profile?.full_name ?? "",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "الجوال",
								value: auth.profile?.phone ?? "",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "الخدمة",
								value: `${service.name} • ${service.price} ج.م`,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "الحلاق",
								value: barber.name,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "التاريخ",
								value: arabicDate(date),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "الوقت",
								value: slots.find((s) => s.time === time)?.label ?? time,
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => confirm.mutate(),
						disabled: confirm.isPending,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-6 py-4 text-base font-black text-primary-foreground shadow-luxe disabled:opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5" }), confirm.isPending ? "جارٍ التأكيد..." : "تأكيد الحجز"]
					})
				]
			}),
			step === "success" && created && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuccessCard, {
				booking: created,
				settings,
				onDone
			})
		]
	});
}
function Row({ label, value, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm text-muted-foreground",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "truncate text-sm font-bold",
			children: value
		})]
	});
}
function SuccessCard({ booking, settings, onDone }) {
	const auth = useAuth();
	const waMessage = `مرحباً ${settings.shop_name}،
أكد لكم حجزي:
رقم الحجز: ${booking.booking_number}
الاسم: ${auth.profile?.full_name}
الخدمة: ${booking.service_name}
التاريخ: ${arabicDate(booking.booking_date)}
الوقت: ${booking.booking_time}`;
	const wa = buildWhatsAppLink(settings.whatsapp, waMessage);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid h-20 w-20 place-items-center rounded-full gradient-luxe shadow-luxe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-10 w-10 text-primary-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-black",
				children: "تم الحجز بنجاح"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-5 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "رقم الحجز"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-3xl font-black text-gradient-gold",
					children: booking.booking_number
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"يرجى الحضور قبل موعدك بـ ٥ دقائق.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"في حالة التأخير أكثر من ١٠ دقائق قد يتم إلغاء الموعد."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: wa,
				target: "_blank",
				rel: "noopener",
				className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-6 py-3.5 font-black text-success-foreground shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-5 w-5" }), " تأكيد عبر واتساب"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onDone,
				className: "text-sm font-bold text-muted-foreground underline",
				children: "العودة للرئيسية"
			})
		]
	});
}
function BookingsList() {
	const auth = useAuth();
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ["my-bookings", auth.user?.id],
		enabled: !!auth.user,
		queryFn: async () => {
			const { data } = await supabase.from("bookings").select("*").eq("customer_id", auth.user.id).order("booking_date", { ascending: false }).order("booking_time", { ascending: false });
			return data ?? [];
		}
	});
	const cancel = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم إلغاء الحجز");
			qc.invalidateQueries({ queryKey: ["my-bookings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const reviewMut = useMutation({
		mutationFn: async (vars) => {
			const { error } = await supabase.from("reviews").insert({
				booking_id: vars.booking_id,
				barber_id: vars.barber_id,
				customer_id: auth.user.id,
				customer_name: auth.profile?.full_name ?? "",
				rating: vars.rating,
				comment: vars.comment
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: () => toast.success("شكراً لتقييمك!"),
		onError: (e) => toast.error(e.message)
	});
	if (!list.data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty$1, {
		title: "لا توجد حجوزات",
		subtitle: "ابدأ بحجز موعدك الأول"
	});
	const upcoming = list.data.filter((b) => b.status === "booked");
	const past = list.data.filter((b) => b.status !== "booked");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [upcoming.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-sm font-bold text-muted-foreground",
			children: "القادمة"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: upcoming.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingCard, {
				b,
				onCancel: () => cancel.mutate(b.id)
			}, b.id))
		})] }), past.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-sm font-bold text-muted-foreground",
			children: "السابقة"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: past.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingCard, {
				b,
				onReview: (r, c) => reviewMut.mutate({
					booking_id: b.id,
					barber_id: b.barber_id,
					rating: r,
					comment: c
				})
			}, b.id))
		})] })]
	});
}
function BookingCard({ b, onCancel, onReview }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [rating, setRating] = (0, import_react.useState)(5);
	const [comment, setComment] = (0, import_react.useState)("");
	const status = b.status === "booked" ? "محجوز" : b.status === "completed" ? "مكتمل" : "ملغي";
	const statusClass = b.status === "booked" ? "bg-primary/15 text-primary" : b.status === "completed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate font-bold",
						children: b.service_name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-3.5 w-3.5" }),
							arabicDate(b.booking_date),
							" • ",
							b.booking_time.slice(0, 5)
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`,
						children: status
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-bold text-muted-foreground",
						children: b.booking_number
					})]
				})]
			}),
			onCancel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onCancel,
				className: "mt-3 w-full rounded-xl border border-destructive/40 px-4 py-2 text-sm font-bold text-destructive",
				children: "إلغاء الحجز"
			}),
			onReview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: !open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setOpen(true),
					className: "w-full rounded-xl border border-border px-4 py-2 text-sm font-bold",
					children: "تقييم الخدمة"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center gap-1",
							children: [
								1,
								2,
								3,
								4,
								5
							].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setRating(n),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted"}` })
							}, n))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: comment,
							onChange: (e) => setComment(e.target.value.slice(0, 300)),
							placeholder: "رأيك يهمنا...",
							className: "w-full rounded-xl border border-input bg-background p-2 text-sm",
							rows: 2
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								onReview(rating, comment);
								setOpen(false);
								setComment("");
							},
							className: "w-full rounded-xl gradient-luxe px-4 py-2 text-sm font-bold text-primary-foreground",
							children: "إرسال التقييم"
						})
					]
				})
			})
		]
	});
}
function OffersList() {
	const offers = useQuery({
		queryKey: ["offers", "all-active"],
		queryFn: async () => {
			const { data } = await supabase.from("offers").select("*").eq("is_active", true);
			return data ?? [];
		}
	});
	if (!offers.data?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty$1, {
		title: "لا توجد عروض",
		subtitle: "تابعنا للجديد"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children: offers.data.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border gradient-night p-5 text-primary-foreground shadow-luxe",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-6 w-6 text-primary" }), o.discount_percent != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground",
						children: [
							"خصم ",
							o.discount_percent,
							"٪"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 text-xl font-black text-gradient-gold",
					children: o.title
				}),
				o.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-sm opacity-80",
					children: o.description
				})
			]
		}, o.id))
	});
}
function ProfileView({ settings }) {
	const auth = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-5 text-center shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-20 w-20 place-items-center rounded-full gradient-luxe text-3xl font-black text-primary-foreground shadow-luxe",
					children: auth.profile?.full_name?.charAt(0) ?? "?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 text-lg font-black",
					children: auth.profile?.full_name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-muted-foreground",
					children: auth.profile?.phone
				})
			]
		}), settings && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border bg-card p-5 shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-bold",
					children: settings.shop_name
				}),
				settings.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-sm text-muted-foreground",
					children: settings.address
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [
						settings.whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `tel:${settings.whatsapp}`,
							className: "rounded-xl border border-border px-3 py-1.5 text-sm",
							children: settings.whatsapp
						}),
						settings.facebook && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialBtn, {
							href: settings.facebook,
							label: "فيسبوك"
						}),
						settings.instagram && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialBtn, {
							href: settings.instagram,
							label: "انستجرام"
						}),
						settings.tiktok && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialBtn, {
							href: settings.tiktok,
							label: "تيك توك"
						})
					]
				})
			]
		})]
	});
}
function SocialBtn({ href, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href,
		target: "_blank",
		rel: "noopener",
		className: "rounded-xl border border-border px-3 py-1.5 text-sm",
		children: label
	});
}
function Empty$1({ title, subtitle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-lg font-bold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-sm text-muted-foreground",
			children: subtitle
		})]
	});
}
function BottomNav({ tab, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border glass",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto grid max-w-2xl grid-cols-4",
			children: [
				{
					t: "home",
					label: "الرئيسية",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-5 w-5" })
				},
				{
					t: "bookings",
					label: "حجوزاتي",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-5 w-5" })
				},
				{
					t: "offers",
					label: "العروض",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-5 w-5" })
				},
				{
					t: "profile",
					label: "حسابي",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5" })
				}
			].map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => onChange(it.t),
				className: `flex flex-col items-center gap-1 py-3 text-xs font-bold transition ${tab === it.t ? "text-primary" : "text-muted-foreground"}`,
				children: [it.icon, it.label]
			}, it.t))
		})
	});
}
function BarberApp() {
	const auth = useAuth();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const notifiedBookings = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const myBarber = useQuery({
		queryKey: ["my-barber", auth.user?.id],
		enabled: !!auth.user,
		queryFn: async () => {
			const { data } = await supabase.from("barbers").select("*").eq("user_id", auth.user.id).maybeSingle();
			return data;
		}
	});
	const bookings = useQuery({
		queryKey: ["barber-bookings", myBarber.data?.id],
		enabled: !!myBarber.data?.id,
		queryFn: async () => {
			const { data } = await supabase.from("bookings").select("*").eq("barber_id", myBarber.data.id).order("booking_date", { ascending: true }).order("booking_time", { ascending: true });
			return data ?? [];
		}
	});
	const reviews = useQuery({
		queryKey: ["barber-reviews", myBarber.data?.id],
		enabled: !!myBarber.data?.id,
		queryFn: async () => {
			const { data } = await supabase.from("reviews").select("*").eq("barber_id", myBarber.data.id).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const complete = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم إنهاء الموعد");
			qc.invalidateQueries({ queryKey: ["barber-bookings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	(0, import_react.useEffect)(() => {
		if (!myBarber.data?.id) return;
		const channel = supabase.channel("new-bookings").on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "bookings",
			filter: `barber_id=eq.${myBarber.data.id}`
		}, (payload) => {
			const bookingId = payload.new.id;
			if (notifiedBookings.current.has(bookingId)) return;
			notifiedBookings.current.add(bookingId);
			new Audio("/notification.mp3").play().catch((e) => console.error("Error playing sound:", e));
			toast.success("تم استلام حجز جديد! 🛎️", {
				description: `لديك حجز جديد من ${payload.new.customer_name || "عميل"}`,
				duration: 6e3
			});
			qc.invalidateQueries({ queryKey: ["barber-bookings"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [myBarber.data?.id, qc]);
	const signOut = async () => {
		await supabase.auth.signOut();
		qc.clear();
		navigate({ to: "/auth" });
	};
	const today = isoDate(/* @__PURE__ */ new Date());
	const todays = (bookings.data ?? []).filter((b) => b.booking_date === today && b.status !== "cancelled");
	const upcoming = (bookings.data ?? []).filter((b) => b.booking_date > today && b.status === "booked");
	const completed = (bookings.data ?? []).filter((b) => b.status === "completed");
	const avg = reviews.data?.length ? reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length : 0;
	if (myBarber.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-10 text-center",
		children: "جارٍ التحميل..."
	});
	if (!myBarber.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md p-6 text-center",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "لم يتم ربط حسابك بأي حلاق. تواصل مع المدير." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: signOut,
			className: "mt-4 rounded-xl gradient-luxe px-5 py-2 font-bold text-primary-foreground",
			children: "خروج"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 glass",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground shadow-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate text-sm font-bold",
							children: myBarber.data.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate text-xs text-muted-foreground",
							children: "حلاق"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: signOut,
						className: "grid h-9 w-9 place-items-center rounded-full border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-2xl space-y-5 px-4 pt-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid grid-cols-3 gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "اليوم",
							value: todays.length
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "مكتملة",
							value: completed.length
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "التقييم",
							value: avg ? avg.toFixed(1) : "—",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-primary text-primary" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "مواعيد اليوم",
					children: [todays.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { msg: "لا توجد مواعيد اليوم" }), todays.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card$1, {
						b,
						onComplete: () => complete.mutate(b.id)
					}, b.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "المواعيد القادمة",
					children: [upcoming.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { msg: "لا توجد مواعيد قادمة" }), upcoming.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card$1, {
						b,
						onComplete: () => complete.mutate(b.id)
					}, b.id))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "المكتملة",
					children: [completed.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { msg: "لا يوجد سجل" }), completed.slice(0, 10).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card$1, { b }, b.id))]
				})
			]
		})]
	});
}
function Stat({ label, value, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-3 text-center shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-center gap-1 text-2xl font-black text-gradient-gold",
			children: [value, icon]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-xs text-muted-foreground",
			children: label
		})]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "mb-2 px-1 text-sm font-bold text-muted-foreground",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2",
		children
	})] });
}
function Card$1({ b, onComplete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate font-bold",
						children: b.customer_name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "truncate text-xs text-muted-foreground",
						children: [
							b.service_name,
							" • ",
							b.booking_time.slice(0, 5)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3 w-3" }), arabicDate(b.booking_date)]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary",
				children: b.booking_number
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: `tel:${b.customer_phone}`,
				className: "flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-3.5 w-3.5" }), " اتصال"]
			}), onComplete && b.status === "booked" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onComplete,
				className: "flex flex-1 items-center justify-center gap-1 rounded-xl gradient-luxe px-3 py-2 text-xs font-bold text-primary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), " إنهاء"]
			})]
		})]
	});
}
function Empty({ msg }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground",
		children: msg
	});
}
function AdminApp() {
	const auth = useAuth();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("overview");
	const signOut = async () => {
		await supabase.auth.signOut();
		qc.clear();
		navigate({ to: "/auth" });
	};
	const tabs = [
		{
			k: "overview",
			label: "نظرة عامة",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4" })
		},
		{
			k: "barbers",
			label: "الحلاقون",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" })
		},
		{
			k: "services",
			label: "الخدمات",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-4 w-4" })
		},
		{
			k: "bookings",
			label: "الحجوزات",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-4 w-4" })
		},
		{
			k: "offers",
			label: "العروض",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4" })
		},
		{
			k: "reviews",
			label: "التقييمات",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4" })
		},
		{
			k: "settings",
			label: "الإعدادات",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" })
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background pb-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 glass",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-4xl px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground shadow-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-sm font-bold",
								children: "لوحة المدير"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: auth.profile?.full_name
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: signOut,
							className: "grid h-9 w-9 place-items-center rounded-full border border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "-mx-4 mt-3 overflow-x-auto px-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 pb-1",
						children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTab(t.k),
							className: `flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.k ? "gradient-luxe text-primary-foreground shadow-card" : "border border-border bg-card text-muted-foreground"}`,
							children: [t.icon, t.label]
						}, t.k))
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-4xl space-y-4 px-4 pt-5",
			children: [
				tab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {}),
				tab === "barbers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarbersAdmin, {}),
				tab === "services" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServicesAdmin, {}),
				tab === "bookings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsAdmin, {}),
				tab === "offers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OffersAdmin, {}),
				tab === "reviews" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewsAdmin, {}),
				tab === "settings" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsAdmin, {})
			]
		})]
	});
}
function Overview() {
	const today = isoDate(/* @__PURE__ */ new Date());
	const d = useQuery({
		queryKey: ["admin-overview"],
		queryFn: async () => {
			const [b, c, s, r] = await Promise.all([
				supabase.from("bookings").select("status, booking_date, service_price, service_name, barber_id"),
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("services").select("id", {
					count: "exact",
					head: true
				}),
				supabase.from("barbers").select("id, name")
			]);
			const bookings = b.data ?? [];
			const todayBookings = bookings.filter((x) => x.booking_date === today);
			const completed = bookings.filter((x) => x.status === "completed");
			const cancelled = bookings.filter((x) => x.status === "cancelled");
			const now = /* @__PURE__ */ new Date();
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - 7);
			const monthStart = new Date(now);
			monthStart.setMonth(now.getMonth() - 1);
			const revDay = completed.filter((x) => x.booking_date === today).reduce((a, x) => a + Number(x.service_price), 0);
			const revWeek = completed.filter((x) => new Date(x.booking_date) >= weekStart).reduce((a, x) => a + Number(x.service_price), 0);
			const revMonth = completed.filter((x) => new Date(x.booking_date) >= monthStart).reduce((a, x) => a + Number(x.service_price), 0);
			const svcCount = {};
			completed.forEach((x) => svcCount[x.service_name] = (svcCount[x.service_name] ?? 0) + 1);
			const topService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
			const { data: reviewAgg } = await supabase.from("reviews").select("barber_id, rating");
			const ratings = {};
			(reviewAgg ?? []).forEach((r) => {
				ratings[r.barber_id] ??= {
					s: 0,
					c: 0
				};
				ratings[r.barber_id].s += r.rating;
				ratings[r.barber_id].c += 1;
			});
			let topBarber = "—";
			let topAvg = 0;
			Object.entries(ratings).forEach(([id, v]) => {
				const a = v.s / v.c;
				if (a > topAvg) {
					topAvg = a;
					topBarber = (r.data ?? []).find((x) => x.id === id)?.name ?? "—";
				}
			});
			return {
				todayCount: todayBookings.length,
				completedCount: completed.length,
				cancelledCount: cancelled.length,
				customers: c.count ?? 0,
				services: s.count ?? 0,
				barbers: (r.data ?? []).length,
				revDay,
				revWeek,
				revMonth,
				topService,
				topBarber
			};
		}
	}).data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "حجوزات اليوم",
						value: d?.todayCount ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "مكتملة",
						value: d?.completedCount ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "ملغية",
						value: d?.cancelledCount ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "العملاء",
						value: d?.customers ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "الحلاقون",
						value: d?.barbers ?? "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "الخدمات",
						value: d?.services ?? "—"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "px-1 pt-2 text-sm font-bold text-muted-foreground",
				children: "الإيرادات"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "اليوم",
						value: `${d?.revDay ?? 0} ج.م`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "الأسبوع",
						value: `${d?.revWeek ?? 0} ج.م`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KPI, {
						label: "الشهر",
						value: `${d?.revMonth ?? 0} ج.م`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "الأكثر طلباً",
					value: d?.topService ?? "—",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "أفضل حلاق تقييماً",
					value: d?.topBarber ?? "—",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-5 w-5" })
				})]
			})
		]
	});
}
function KPI({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-3 text-center shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xl font-black text-gradient-gold",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-[11px] text-muted-foreground",
			children: label
		})]
	});
}
function Card({ title, value, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-bold",
			children: value
		})] })]
	});
}
function BarbersAdmin() {
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const list = useQuery({
		queryKey: ["admin-barbers"],
		queryFn: async () => (await supabase.from("barbers").select("*").order("name")).data ?? []
	});
	const create = useServerFn(createBarberAccount);
	const reset = useServerFn(resetBarberPassword);
	const del = useServerFn(deleteBarberAccount);
	const createMut = useMutation({
		mutationFn: (data) => create({ data }),
		onSuccess: () => {
			toast.success("تمت إضافة الحلاق");
			setOpen(false);
			qc.invalidateQueries({ queryKey: ["admin-barbers"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const toggle = useMutation({
		mutationFn: async (b) => {
			const { error } = await supabase.from("barbers").update({ is_active: !b.is_active }).eq("id", b.id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-barbers"] })
	});
	const update = useMutation({
		mutationFn: async (b) => {
			const { id, ...rest } = b;
			const allowed = {};
			[
				"name",
				"specialization",
				"working_days",
				"start_time",
				"end_time",
				"break_start",
				"break_end",
				"slot_minutes"
			].forEach((k) => {
				if (k in rest) allowed[k] = rest[k];
			});
			const { error } = await supabase.from("barbers").update(allowed).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم الحفظ");
			qc.invalidateQueries({ queryKey: ["admin-barbers"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setOpen(true),
				className: "flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " إضافة حلاق"]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewBarberForm, {
				onCancel: () => setOpen(false),
				onSave: (d) => createMut.mutate(d),
				loading: createMut.isPending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: list.data?.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarberRow, {
					b,
					onToggle: () => toggle.mutate(b),
					onSave: (d) => update.mutate({
						...b,
						...d
					}),
					onReset: async (pwd) => {
						try {
							await reset({ data: {
								user_id: b.user_id,
								password: pwd
							} });
							toast.success("تم إعادة التعيين");
						} catch (e) {
							toast.error(e.message);
						}
					},
					onDelete: async () => {
						if (!confirm(`حذف ${b.name}؟`)) return;
						try {
							await del({ data: { barber_id: b.id } });
							toast.success("تم الحذف");
							qc.invalidateQueries({ queryKey: ["admin-barbers"] });
						} catch (e) {
							toast.error(e.message);
						}
					}
				}, b.id))
			})
		]
	});
}
function NewBarberForm({ onCancel, onSave, loading }) {
	const [name, setName] = (0, import_react.useState)(""), [phone, setPhone] = (0, import_react.useState)(""), [password, setPassword] = (0, import_react.useState)(""), [spec, setSpec] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "الاسم",
				value: name,
				onChange: setName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "رقم الجوال",
				value: phone,
				onChange: setPhone,
				type: "tel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "كلمة المرور",
				value: password,
				onChange: setPassword,
				type: "password"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "التخصص",
				value: spec,
				onChange: setSpec
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSave({
						name,
						phone,
						password,
						specialization: spec
					}),
					disabled: loading || !name || !phone || password.length < 6,
					className: "flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50",
					children: loading ? "..." : "حفظ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onCancel,
					className: "rounded-xl border border-border px-4 py-2 font-bold",
					children: "إلغاء"
				})]
			})
		]
	});
}
function BarberRow({ b, onToggle, onSave, onReset, onDelete }) {
	const [edit, setEdit] = (0, import_react.useState)(false);
	const [resetting, setResetting] = (0, import_react.useState)(false);
	const [scheduling, setScheduling] = (0, import_react.useState)(false);
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)(b.name), [spec, setSpec] = (0, import_react.useState)(b.specialization ?? "");
	const days = [
		"أحد",
		"إثنين",
		"ثلاثاء",
		"أربعاء",
		"خميس",
		"جمعة",
		"سبت"
	];
	const [sched, setSched] = (0, import_react.useState)({
		working_days: b.working_days ?? [
			0,
			1,
			2,
			3,
			4,
			6
		],
		start_time: (b.start_time ?? "10:00").slice(0, 5),
		end_time: (b.end_time ?? "23:00").slice(0, 5),
		break_start: (b.break_start ?? "").slice(0, 5),
		break_end: (b.break_end ?? "").slice(0, 5),
		slot_minutes: b.slot_minutes ?? 40
	});
	const toggleDay = (n) => {
		const set = new Set(sched.working_days);
		set.has(n) ? set.delete(n) : set.add(n);
		setSched({
			...sched,
			working_days: Array.from(set).sort()
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 flex-1",
					children: !edit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate font-bold",
							children: b.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "truncate text-xs text-muted-foreground",
							children: [
								b.specialization || "—",
								" • ",
								b.phone
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: [
								(b.start_time ?? "10:00").slice(0, 5),
								" - ",
								(b.end_time ?? "23:00").slice(0, 5),
								" • كل",
								" ",
								b.slot_minutes ?? 40,
								" د"
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "الاسم",
							value: name,
							onChange: setName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							label: "التخصص",
							value: spec,
							onChange: setSpec
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${b.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`,
					children: b.is_active ? "نشط" : "موقوف"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					!edit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setEdit(true),
						className: "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-3 w-3" }), " تعديل"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							onSave({
								name,
								specialization: spec
							});
							setEdit(false);
						},
						className: "rounded-lg gradient-luxe px-3 py-1.5 text-xs font-bold text-primary-foreground",
						children: "حفظ"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setEdit(false),
						className: "rounded-lg border border-border px-3 py-1.5 text-xs",
						children: "إلغاء"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setScheduling((s) => !s),
						className: "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-3 w-3" }), " المواعيد"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onToggle,
						className: "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "h-3 w-3" }),
							" ",
							b.is_active ? "إيقاف" : "تفعيل"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setResetting((s) => !s),
						className: "flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-3 w-3" }), " كلمة المرور"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onDelete,
						className: "flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" }), " حذف"]
					})
				]
			}),
			resetting && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: pwd,
					onChange: (e) => setPwd(e.target.value),
					placeholder: "كلمة المرور الجديدة",
					type: "text",
					className: "flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						if (pwd.length < 6) return toast.error("٦ أحرف على الأقل");
						onReset(pwd);
						setPwd("");
						setResetting(false);
					},
					className: "rounded-lg gradient-luxe px-3 py-1.5 text-xs font-bold text-primary-foreground",
					children: "تأكيد"
				})]
			}),
			scheduling && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-3 rounded-xl border border-border bg-background/60 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-primary/5 p-2 text-[11px] text-muted-foreground",
						children: [
							"يولّد النظام مواعيد كل ",
							sched.slot_minutes,
							" دقيقة من بداية العمل حتى نهايته (مع استثناء الاستراحة)."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-[11px] font-bold text-muted-foreground",
						children: "أيام العمل"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: days.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleDay(i),
							className: `rounded-lg border px-2.5 py-1 text-[11px] font-bold ${sched.working_days.includes(i) ? "gradient-luxe text-primary-foreground" : "border-border"}`,
							children: d
						}, i))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "بداية العمل",
								type: "time",
								value: sched.start_time,
								onChange: (v) => setSched({
									...sched,
									start_time: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "نهاية العمل",
								type: "time",
								value: sched.end_time,
								onChange: (v) => setSched({
									...sched,
									end_time: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "بداية الاستراحة",
								type: "time",
								value: sched.break_start,
								onChange: (v) => setSched({
									...sched,
									break_start: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "نهاية الاستراحة",
								type: "time",
								value: sched.break_end,
								onChange: (v) => setSched({
									...sched,
									break_end: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "مدة الموعد (د)",
								type: "number",
								value: String(sched.slot_minutes),
								onChange: (v) => setSched({
									...sched,
									slot_minutes: Number(v) || 40
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								onSave({
									working_days: sched.working_days,
									start_time: sched.start_time,
									end_time: sched.end_time,
									break_start: sched.break_start || null,
									break_end: sched.break_end || null,
									slot_minutes: sched.slot_minutes
								});
								setScheduling(false);
							},
							className: "flex-1 rounded-lg gradient-luxe py-2 text-xs font-bold text-primary-foreground",
							children: "حفظ المواعيد"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setScheduling(false),
							className: "rounded-lg border border-border px-3 py-2 text-xs",
							children: "إلغاء"
						})]
					})
				]
			})
		]
	});
}
function ServicesAdmin() {
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const list = useQuery({
		queryKey: ["admin-services"],
		queryFn: async () => (await supabase.from("services").select("*").order("created_at", { ascending: false })).data ?? []
	});
	const create = useMutation({
		mutationFn: async (d) => {
			const { error } = await supabase.from("services").insert(d);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تمت الإضافة");
			setOpen(false);
			qc.invalidateQueries({ queryKey: ["admin-services"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const update = useMutation({
		mutationFn: async (d) => {
			const { id, ...rest } = d;
			const { error } = await supabase.from("services").update(rest).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] })
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("services").delete().eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم الحذف");
			qc.invalidateQueries({ queryKey: ["admin-services"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setOpen(true),
				className: "flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " إضافة خدمة"]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceForm, {
				onCancel: () => setOpen(false),
				onSave: (d) => create.mutate(d)
			}),
			list.data?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceRow, {
				s,
				onToggle: () => update.mutate({
					id: s.id,
					is_active: !s.is_active
				}),
				onSave: (d) => update.mutate({
					id: s.id,
					...d
				}),
				onDelete: () => {
					if (confirm("حذف؟")) del.mutate(s.id);
				}
			}, s.id))
		]
	});
}
function ServiceForm({ onCancel, onSave, initial }) {
	const [name, setName] = (0, import_react.useState)(initial?.name ?? "");
	const [desc, setDesc] = (0, import_react.useState)(initial?.description ?? "");
	const [price, setPrice] = (0, import_react.useState)(initial?.price ?? 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "اسم الخدمة",
				value: name,
				onChange: setName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "الوصف",
				value: desc,
				onChange: setDesc
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "السعر",
				value: String(price),
				onChange: (v) => setPrice(Number(v) || 0),
				type: "number"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSave({
						name,
						description: desc,
						price
					}),
					disabled: !name,
					className: "flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50",
					children: "حفظ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onCancel,
					className: "rounded-xl border border-border px-4 py-2 font-bold",
					children: "إلغاء"
				})]
			})
		]
	});
}
function ServiceRow({ s, onToggle, onSave, onDelete }) {
	const [edit, setEdit] = (0, import_react.useState)(false);
	if (edit) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceForm, {
		initial: s,
		onCancel: () => setEdit(false),
		onSave: (d) => {
			onSave(d);
			setEdit(false);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "truncate font-bold",
					children: s.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "truncate text-xs text-muted-foreground",
					children: [
						s.description || "—",
						" • ",
						s.price,
						" ج.م"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setEdit(true),
						className: "grid h-8 w-8 place-items-center rounded-lg border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-3.5 w-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onToggle,
						className: `grid h-8 w-8 place-items-center rounded-lg border ${s.is_active ? "border-success/40 text-success" : "border-border"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "h-3.5 w-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onDelete,
						className: "grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
					})
				]
			})
		]
	});
}
function BookingsAdmin() {
	const qc = useQueryClient();
	const [q, setQ] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("all");
	const list = useQuery({
		queryKey: ["admin-bookings"],
		queryFn: async () => (await supabase.from("bookings").select("*").order("booking_date", { ascending: false }).order("booking_time", { ascending: false }).limit(500)).data ?? []
	});
	const update = useMutation({
		mutationFn: async ({ id, status }) => {
			const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم التحديث");
			qc.invalidateQueries({ queryKey: ["admin-bookings"] });
		}
	});
	const filtered = (list.data ?? []).filter((b) => {
		if (status !== "all" && b.status !== status) return false;
		if (!q) return true;
		const s = q.toLowerCase();
		return b.customer_name?.toLowerCase().includes(s) || b.customer_phone?.includes(q) || b.booking_number?.toLowerCase().includes(s);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "بحث (اسم/جوال/رقم)",
					className: "w-full bg-transparent py-2 text-sm outline-none"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				value: status,
				onChange: (e) => setStatus(e.target.value),
				className: "rounded-xl border border-input bg-card px-3 py-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "الكل"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "booked",
						children: "محجوز"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "completed",
						children: "مكتمل"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "cancelled",
						children: "ملغي"
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: filtered.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-bold",
								children: b.customer_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "truncate text-xs text-muted-foreground",
								children: [
									b.service_name,
									" • ",
									b.customer_phone
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									arabicDate(b.booking_date),
									" • ",
									b.booking_time.slice(0, 5)
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold",
						children: b.booking_number
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [b.status === "booked" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => update.mutate({
							id: b.id,
							status: "completed"
						}),
						className: "flex-1 rounded-lg gradient-luxe py-1.5 text-xs font-bold text-primary-foreground",
						children: "إكمال"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => update.mutate({
							id: b.id,
							status: "cancelled"
						}),
						className: "flex-1 rounded-lg border border-destructive/40 py-1.5 text-xs font-bold text-destructive",
						children: "إلغاء"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-lg px-3 py-1.5 text-xs font-bold ${b.status === "completed" ? "bg-success/15 text-success" : b.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`,
						children: b.status === "booked" ? "محجوز" : b.status === "completed" ? "مكتمل" : "ملغي"
					})]
				})]
			}, b.id))
		})]
	});
}
function OffersAdmin() {
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const list = useQuery({
		queryKey: ["admin-offers"],
		queryFn: async () => (await supabase.from("offers").select("*").order("created_at", { ascending: false })).data ?? []
	});
	const create = useMutation({
		mutationFn: async (d) => {
			const { error } = await supabase.from("offers").insert(d);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			setOpen(false);
			toast.success("تمت الإضافة");
			qc.invalidateQueries({ queryKey: ["admin-offers"] });
		}
	});
	const update = useMutation({
		mutationFn: async ({ id, ...rest }) => {
			const { error } = await supabase.from("offers").update(rest).eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] })
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("offers").delete().eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setOpen(true),
				className: "flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " إضافة عرض"]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferForm, {
				onCancel: () => setOpen(false),
				onSave: (d) => create.mutate(d)
			}),
			list.data?.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferRow, {
				o,
				onSave: (d) => update.mutate({
					id: o.id,
					...d
				}),
				onToggle: () => update.mutate({
					id: o.id,
					is_active: !o.is_active
				}),
				onDelete: () => {
					if (confirm("حذف؟")) del.mutate(o.id);
				}
			}, o.id))
		]
	});
}
function OfferForm({ onCancel, onSave, initial }) {
	const [title, setTitle] = (0, import_react.useState)(initial?.title ?? "");
	const [desc, setDesc] = (0, import_react.useState)(initial?.description ?? "");
	const [pct, setPct] = (0, import_react.useState)(initial?.discount_percent ?? "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "عنوان العرض",
				value: title,
				onChange: setTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "الوصف",
				value: desc,
				onChange: setDesc
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				label: "نسبة الخصم %",
				value: String(pct),
				onChange: setPct,
				type: "number"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSave({
						title,
						description: desc,
						discount_percent: pct === "" ? null : Number(pct)
					}),
					disabled: !title,
					className: "flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50",
					children: "حفظ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onCancel,
					className: "rounded-xl border border-border px-4 py-2 font-bold",
					children: "إلغاء"
				})]
			})
		]
	});
}
function OfferRow({ o, onSave, onToggle, onDelete }) {
	const [edit, setEdit] = (0, import_react.useState)(false);
	if (edit) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferForm, {
		initial: o,
		onCancel: () => setEdit(false),
		onSave: (d) => {
			onSave(d);
			setEdit(false);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "truncate font-bold",
					children: o.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "truncate text-xs text-muted-foreground",
					children: [
						o.description || "—",
						" ",
						o.discount_percent != null && `• -${o.discount_percent}٪`
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setEdit(true),
						className: "grid h-8 w-8 place-items-center rounded-lg border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-3.5 w-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onToggle,
						className: `grid h-8 w-8 place-items-center rounded-lg border ${o.is_active ? "border-success/40 text-success" : "border-border"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "h-3.5 w-3.5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onDelete,
						className: "grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
					})
				]
			})
		]
	});
}
function ReviewsAdmin() {
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ["admin-reviews"],
		queryFn: async () => {
			const [{ data: rev }, { data: bar }] = await Promise.all([supabase.from("reviews").select("*").order("created_at", { ascending: false }), supabase.from("barbers").select("id, name")]);
			const map = new Map((bar ?? []).map((b) => [b.id, b.name]));
			return (rev ?? []).map((r) => ({
				...r,
				barber_name: map.get(r.barber_id) ?? "—"
			}));
		}
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("reviews").delete().eq("id", id);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم الحذف");
			qc.invalidateQueries({ queryKey: ["admin-reviews"] });
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [list.data?.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-border bg-card p-4 shadow-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-1",
							children: [
								1,
								2,
								3,
								4,
								5
							].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${n <= r.rating ? "fill-primary text-primary" : "text-muted"}` }, n))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 truncate text-sm font-bold",
							children: [
								r.customer_name,
								" ← ",
								r.barber_name
							]
						}),
						r.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-sm text-muted-foreground",
							children: r.comment
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => del.mutate(r.id),
					className: "grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
				})]
			})
		}, r.id)), !list.data?.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground",
			children: "لا توجد تقييمات"
		})]
	});
}
function SettingsAdmin() {
	const qc = useQueryClient();
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: async () => (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data
	});
	const save = useMutation({
		mutationFn: async (d) => {
			const { error } = await supabase.from("settings").update({
				...d,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", 1);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			toast.success("تم الحفظ");
			qc.invalidateQueries({ queryKey: ["settings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const s = settings.data;
	if (!s) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsForm, {
		initial: s,
		onSave: (d) => save.mutate(d)
	});
}
function SettingsForm({ initial, onSave }) {
	const [f, setF] = (0, import_react.useState)({ ...initial });
	const days = [
		"أحد",
		"إثنين",
		"ثلاثاء",
		"أربعاء",
		"خميس",
		"جمعة",
		"سبت"
	];
	const set = (k, v) => setF((x) => ({
		...x,
		[k]: v
	}));
	const toggleDay = (n) => {
		const arr = new Set(f.working_days ?? []);
		arr.has(n) ? arr.delete(n) : arr.add(n);
		set("working_days", Array.from(arr).sort());
	};
	const save = () => {
		onSave({
			working_days: f.working_days ?? [],
			start_time: f.start_time,
			end_time: f.end_time,
			break_start: f.break_start || null,
			break_end: f.break_end || null
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground",
				children: "النظام يُولِّد المواعيد تلقائياً من ساعات العمل وأيام العمل والاستراحة. لا حاجة لإنشاء مواعيد يدوياً."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "أيام العمل",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: days.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggleDay(i),
						className: `rounded-lg border px-3 py-1.5 text-xs font-bold ${(f.working_days ?? []).includes(i) ? "gradient-luxe text-primary-foreground" : "border-border"}`,
						children: d
					}, i))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "ساعات العمل",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "بداية العمل",
						value: f.start_time?.slice(0, 5) ?? "",
						onChange: (v) => set("start_time", v),
						type: "time"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "نهاية العمل",
						value: f.end_time?.slice(0, 5) ?? "",
						onChange: (v) => set("end_time", v),
						type: "time"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "الاستراحة",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "بداية الاستراحة",
						value: f.break_start?.slice(0, 5) ?? "",
						onChange: (v) => set("break_start", v || null),
						type: "time"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "نهاية الاستراحة",
						value: f.break_end?.slice(0, 5) ?? "",
						onChange: (v) => set("break_end", v || null),
						type: "time"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: save,
				className: "w-full rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe",
				children: "حفظ الإعدادات"
			})
		]
	});
}
function Group({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm font-bold text-muted-foreground",
			children: title
		}), children]
	});
}
function Input({ label, value, onChange, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-1 block text-xs font-bold text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value,
		onChange: (e) => onChange(e.target.value),
		type,
		className: "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
	})] });
}
function Index() {
	const auth = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (!auth.loading && !auth.user) navigate({
			to: "/auth",
			replace: true
		});
	}, [
		auth.loading,
		auth.user,
		navigate
	]);
	if (auth.loading || !auth.user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		dir: "rtl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-2xl gradient-luxe shadow-luxe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scissors, { className: "h-8 w-8 text-primary-foreground" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 text-sm text-muted-foreground",
				children: "جارٍ التحميل..."
			})]
		})
	});
	if (auth.role === "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminApp, {});
	if (auth.role === "barber") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarberApp, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerApp, {});
}
//#endregion
export { Index as component };
