import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, customerPassword, staffEmail } from "@/hooks/use-auth";
import { ensureDefaultAdmin, signUpCustomer, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Scissors, User, Lock, Phone, ShieldCheck } from "lucide-react";

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

const ROLES: { key: Tab; label: string }[] = [
  { key: "customer", label: "عميل" },
  { key: "staff", label: "موظف" },
  { key: "admin", label: "مدير" },
];

const COPY: Record<Tab, { title: string; body: string }> = {
  customer: {
    title: "احجز موعدك بلمسة واحدة",
    body: "",
  },
  staff: {
    title: "دخول الموظفين",
    body: "سجّل دخولك لمتابعة طابور اليوم وبدء الخدمات.",
  },
  admin: {
    title: "دخول المدير",
    body: "تحكم كامل في الحلاقين والخدمات والحجوزات والعروض.",
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
    <div dir="rtl" className="min-h-screen bg-[#FAF6EE] text-[#211a12]">
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col px-6 pb-8 pt-12">
        {/* Brand — matches reference: black scissors in orange ring, bold wordmark */}
        <header className="animate-fade-in-up text-center">
          <div className="relative mx-auto grid h-28 w-28 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-[6px] border-[#E8831A]"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 88%, 0 88%)" }}
            />
            <span aria-hidden className="absolute inset-0 rounded-full border-[6px] border-[#E8831A]/90" />
            <span aria-hidden className="absolute left-1/2 top-[-8px] h-5 w-8 -translate-x-1/2 bg-[#FAF6EE]" />
            <Scissors className="h-14 w-14 text-[#211a12]" strokeWidth={2.4} />
          </div>

          <h1 className="mt-5 font-display text-[2.9rem] font-black leading-none tracking-tight text-[#211a12]">
            حَلاقُ البَاشَا
          </h1>
          <p className="mt-3 text-[1.05rem] font-semibold text-[#211a12]">
            احجز موعدك بلمسة واحدة
          </p>
        </header>

        {/* Role switch — grey pill, active tab is white with orange text */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <div
            role="tablist"
            aria-label="نوع الحساب"
            className="flex items-center rounded-full bg-[#E4E1D8] p-1.5 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.35)]"
          >
            {ROLES.map((r, i) => {
              const active = tab === r.key;
              return (
                <div key={r.key} className="flex flex-1 items-center">
                  <button
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(r.key)}
                    className={`flex-1 cursor-pointer rounded-full py-2.5 text-[1.05rem] font-bold transition-all duration-200 press ${
                      active
                        ? "bg-white text-[#E8831A] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)]"
                        : "text-[#2b2b2b] hover:text-black"
                    }`}
                  >
                    {r.label}
                  </button>
                  {i < ROLES.length - 1 && (
                    <span aria-hidden className="mx-1 h-7 w-px bg-[#2b2b2b]/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.14s" }}>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_24px_55px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04]">
            <div key={tab} className="animate-fade-in">
              {tab !== "customer" && (
                <div className="mb-4 text-center">
                  <h2 className="font-display text-lg font-extrabold text-[#211a12]">
                    {copy.title}
                  </h2>
                  <p className="mt-1 text-[0.8rem] font-medium text-[#211a12]/60">
                    {copy.body}
                  </p>
                </div>
              )}

              {tab === "customer" && (
                <form onSubmit={customerSubmit} className="space-y-4">
                  <Field
                    icon={<User className="h-5 w-5 fill-[#E8831A] text-[#E8831A]" strokeWidth={0} />}
                    placeholder="الاسم الكامل"
                    value={cName}
                    onChange={setCName}
                    autoComplete="name"
                  />
                  <Field
                    icon={<Phone className="h-5 w-5 fill-[#E8831A] text-[#E8831A]" strokeWidth={0} />}
                    placeholder="رقم الجوال"
                    type="tel"
                    value={cPhone}
                    onChange={setCPhone}
                    autoComplete="tel"
                  />
                  <Submit loading={cLoading} label="دخول / تسجيل" />
                </form>
              )}

              {tab === "staff" && (
                <form onSubmit={staffSubmit} className="space-y-4">
                  <Field
                    icon={<Phone className="h-5 w-5 fill-[#E8831A] text-[#E8831A]" strokeWidth={0} />}
                    placeholder="رقم الجوال"
                    type="tel"
                    value={sPhone}
                    onChange={setSPhone}
                    autoComplete="username"
                  />
                  <Field
                    icon={<Lock className="h-5 w-5 text-[#E8831A]" strokeWidth={2} />}
                    placeholder="كلمة المرور"
                    type="password"
                    value={sPwd}
                    onChange={setSPwd}
                    autoComplete="current-password"
                  />
                  <Submit loading={sLoading} label="دخول" />
                </form>
              )}

              {tab === "admin" && (
                <form onSubmit={adminSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-[#E8831A]/30 bg-[#E8831A]/10 px-4 py-3 text-[0.75rem] font-bold text-[#B25A09]">
                    <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>دخول المدير — صلاحيات كاملة</span>
                  </div>
                  <Field
                    icon={<User className="h-5 w-5 fill-[#E8831A] text-[#E8831A]" strokeWidth={0} />}
                    placeholder="اسم المستخدم"
                    value={aUser}
                    onChange={setAUser}
                    autoComplete="username"
                  />
                  <Field
                    icon={<Lock className="h-5 w-5 text-[#E8831A]" strokeWidth={2} />}
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

        {/* Helper line */}
        <p className="mt-6 animate-fade-in-up text-center text-[0.95rem] font-semibold text-[#211a12]" style={{ animationDelay: "0.2s" }}>
          لا حاجة لكلمة مرور — الرقم هو هويتك
        </p>

        <div className="flex-1" />

        {/* Footer */}
        <p className="mt-10 text-center text-[0.8rem] font-medium text-[#211a12]">
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
    <label className="flex items-center gap-3 rounded-2xl border border-[#E3DCCB] bg-white px-4 transition-all duration-200 focus-within:border-[#E8831A]/60 focus-within:ring-2 focus-within:ring-[#E8831A]/20">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        className="w-full bg-transparent py-4 text-[1rem] font-medium text-[#211a12] outline-none placeholder:text-[#211a12]/40"
      />
      <span className="shrink-0">{icon}</span>
    </label>
  );
}

function Submit({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-[#E8831A] py-4 text-[1.15rem] font-extrabold text-white shadow-[0_14px_28px_-12px_rgba(232,131,26,0.65)] transition-all duration-200 hover:bg-[#D9730D] active:scale-[0.98] disabled:opacity-60 press"
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        label
      )}
    </button>
  );
}
