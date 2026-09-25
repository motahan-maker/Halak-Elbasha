import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, customerEmail, customerPassword, staffEmail } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { ensureDefaultAdmin, signUpCustomer, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Scissors, User, Lock, Phone, ShieldCheck, Sparkles, Store, Crown } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول - حلاق الباشا" },
      { name: "description", content: "ادخل لحجز موعدك مع حلاق الباشا" },
    ],
  }),
  component: AuthPage,
});

type Tab = "customer" | "staff" | "admin";

const ROLES: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "customer", label: "عميل", icon: <User className="h-4 w-4" strokeWidth={1.75} /> },
  { key: "staff", label: "حلاق", icon: <Store className="h-4 w-4" strokeWidth={1.75} /> },
  { key: "admin", label: "مدير", icon: <Crown className="h-4 w-4" strokeWidth={1.75} /> },
];

const COPY: Record<Tab, { title: string; body: string }> = {
  customer: {
    title: "احجز موعدك في دقيقة",
    body: "ادخل باسمك ورقمك فقط — لا حاجة لكلمة مرور. رقمك هو هويتك في الصالون.",
  },
  staff: {
    title: "لوحة الحلاق",
    body: "سجّل دخولك لمتابعة طابور اليوم، وبدء وإنهاء الخدمات لحظة بلحظة.",
  },
  admin: {
    title: "لوحة الإدارة",
    body: "تحكم كامل في الحلاقين والخدمات والحجوزات والعروض من مكان واحد.",
  },
};

function msg(e: unknown): string {
  if (e === null || e === undefined) return "حدث خطأ غير متوقع";
  if (typeof e === "string") return e || "حدث خطأ";
  if (e instanceof Error) return e.message || "حدث خطأ";
  if (typeof e === "object") {
    try {
      const str = JSON.stringify(e);
      if (str === "{}" || str === "[]") return "حدث خطأ غير متوقع";
      const obj = e as Record<string, unknown>;
      if (obj.message && typeof obj.message === "string") return obj.message;
      if (obj.error && typeof obj.error === "string") return obj.error;
      return str;
    } catch {
      return "حدث خطأ";
    }
  }
  return String(e);
}

function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("customer");
  const ensureAdmin = useServerFn(ensureDefaultAdmin);

  useEffect(() => {
    if (!auth.loading && auth.user) navigate({ to: "/", replace: true });
  }, [auth.loading, auth.user, navigate]);

  /* Customer */
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const customerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) return toast.error("ادخل الاسم والجوال");
    if (cPhone.replace(/[^\d]/g, "").length < 6) return toast.error("رقم جوال غير صالح");
    setCLoading(true);
    try {
      const result = await signUpCustomer({ data: { name: cName.trim(), phone: cPhone.trim() } });
      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      });
      if (error) {
        throw new Error("حدث خطأ أثناء الدخول. تأكد من صحة البيانات");
      }
      if (result.existing) {
        toast.success("مرحباً بعودتك!");
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(msg(err));
    } finally {
      setCLoading(false);
    }
  };

  /* Staff (barber) */
  const [sPhone, setSPhone] = useState("");
  const [sPwd, setSPwd] = useState("");
  const [sLoading, setSLoading] = useState(false);
  const staffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: staffEmail(sPhone),
      password: sPwd,
    });
    setSLoading(false);
    if (error) return toast.error("بيانات الدخول غير صحيحة");
    navigate({ to: "/", replace: true });
  };

  /* Admin (built-in) */
  const [aUser, setAUser] = useState("admin");
  const [aPwd, setAPwd] = useState(ADMIN_DEFAULT_PASSWORD);
  const [aLoading, setALoading] = useState(false);
  const adminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setALoading(true);
    try {
      if (aUser.trim().toLowerCase() !== "admin") throw new Error("اسم المستخدم غير صحيح");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: aPwd,
      });

      if (!signInError) {
        navigate({ to: "/", replace: true });
        return;
      }

      try {
        await ensureAdmin();
      } catch (ensureErr) {
        console.error("ensureDefaultAdmin failed:", ensureErr);
        throw new Error("حدث خطأ أثناء إعداد حساب المدير");
      }

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: aPwd,
      });
      if (retryError) throw new Error("كلمة المرور غير صحيحة");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(msg(err));
    } finally {
      setALoading(false);
    }
  };

  const copy = COPY[tab];

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden gradient-hero grain text-ink-foreground">
      {/* Ambient gold blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-gold/22 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -end-24 h-[22rem] w-[22rem] rounded-full bg-gold/12 blur-[120px]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />

      <div className="fixed top-4 end-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[26rem] flex-col justify-center px-6 py-14">
        {/* Brand */}
        <header className="animate-fade-in-up text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center">
            <span aria-hidden className="absolute inset-0 rounded-[1.75rem] border border-gold/30 animate-ring-expand" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-[1.75rem] bg-gold/25 blur-2xl animate-glow-pulse"
            />
            <span className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] gradient-gold text-gold-foreground shadow-glow-gold ring-1 ring-inset ring-white/40">
              <Scissors className="h-11 w-11" strokeWidth={1.4} />
            </span>
          </div>

          <h1 className="mt-7 display-xl text-gradient-gold">حلاق الباشا</h1>

          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/70" />
            <p className="eyebrow !text-ink-foreground/55">صالون رجالي · حجز فوري</p>
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70" />
          </div>
        </header>

        {/* Role switch */}
        <div className="mt-9 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div
            role="tablist"
            aria-label="نوع الحساب"
            className="flex gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur-xl"
          >
            {ROLES.map((r) => {
              const active = tab === r.key;
              return (
                <button
                  key={r.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(r.key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[0.8rem] font-bold transition-all duration-300 press ${
                    active
                      ? "gradient-gold text-gold-foreground shadow-glow-gold"
                      : "text-ink-foreground/55 hover:text-ink-foreground/85"
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="mt-5 animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/[0.055] p-6 backdrop-blur-2xl shadow-[0_24px_70px_-30px_rgba(0,0,0,0.85)]">
            <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />

            <div key={tab} className="animate-fade-in">
              <h2 className="font-display text-lg font-extrabold leading-snug text-ink-foreground">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-[0.78rem] font-medium leading-relaxed text-ink-foreground/55">
                {copy.body}
              </p>

              <div className="mt-5">
                {tab === "customer" && (
                  <form onSubmit={customerSubmit} className="space-y-3.5">
                    <Field
                      icon={<User className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="الاسم بالكامل"
                      value={cName}
                      onChange={setCName}
                      autoComplete="name"
                    />
                    <Field
                      icon={<Phone className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="رقم الجوال"
                      type="tel"
                      value={cPhone}
                      onChange={setCPhone}
                      autoComplete="tel"
                    />
                    <Submit loading={cLoading} label="دخول / تسجيل" />
                    <p className="flex items-center justify-center gap-1.5 pt-0.5 text-[0.68rem] font-semibold text-ink-foreground/40">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                      لا حاجة لكلمة مرور — رقمك هو هويتك
                    </p>
                  </form>
                )}

                {tab === "staff" && (
                  <form onSubmit={staffSubmit} className="space-y-3.5">
                    <Field
                      icon={<Phone className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="رقم الجوال"
                      type="tel"
                      value={sPhone}
                      onChange={setSPhone}
                      autoComplete="username"
                    />
                    <Field
                      icon={<Lock className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="كلمة المرور"
                      type="password"
                      value={sPwd}
                      onChange={setSPwd}
                      autoComplete="current-password"
                    />
                    <Submit loading={sLoading} label="دخول لوحة الحلاق" />
                  </form>
                )}

                {tab === "admin" && (
                  <form onSubmit={adminSubmit} className="space-y-3.5">
                    <div className="flex items-center gap-2.5 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-[0.7rem] font-bold text-gold">
                      <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span>دخول المدير الافتراضي — صلاحيات كاملة</span>
                    </div>
                    <Field
                      icon={<User className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="اسم المستخدم"
                      value={aUser}
                      onChange={setAUser}
                      autoComplete="username"
                    />
                    <Field
                      icon={<Lock className="h-[18px]" strokeWidth={1.6} />}
                      placeholder="كلمة المرور"
                      type="password"
                      value={aPwd}
                      onChange={setAPwd}
                      autoComplete="current-password"
                    />
                    <Submit loading={aLoading} label="دخول كمدير" />
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-9 animate-fade-in-up text-center text-[0.62rem] font-semibold tracking-wide text-ink-foreground/28"
          style={{ animationDelay: "0.26s" }}
        >
          Powered by Eng /Mohamed Eltahan &amp; Eng /Kamel Elmahy
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 transition-all duration-300 focus-within:border-gold/55 focus-within:bg-white/[0.075] focus-within:ring-2 focus-within:ring-gold/25">
      <span className="shrink-0 text-ink-foreground/35 transition-colors duration-200 group-focus-within:text-gold">
        {icon}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        className="w-full bg-transparent py-3.5 text-sm font-medium text-ink-foreground outline-none placeholder:text-ink-foreground/30"
      />
    </label>
  );
}

function Submit({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="mt-1 flex w-full items-center justify-center rounded-2xl gradient-gold py-3.5 text-[0.82rem] font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-[1.06] active:scale-[0.975] disabled:opacity-55 press"
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold-foreground/25 border-t-gold-foreground" />
      ) : (
        label
      )}
    </button>
  );
}
