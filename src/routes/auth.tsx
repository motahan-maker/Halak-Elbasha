import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, customerEmail, customerPassword, staffEmail } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { ensureDefaultAdmin, signUpCustomer, ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Scissors, User, Lock, Phone, ShieldCheck, ArrowLeft } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="fixed top-4 left-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        {/* Logo & Brand */}
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] bg-primary shadow-luxe transition-transform duration-500 hover:scale-105">
            <Scissors className="h-12 w-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">حلاق الباشا</h1>
          <p className="mt-2 text-base text-muted-foreground">احجز موعدك في ثوانٍ</p>
        </div>

        {/* Segmented Control */}
        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex w-full rounded-2xl bg-secondary p-1">
            {(
              [
                ["customer", "عميل"],
                ["staff", "موظف"],
                ["admin", "مدير"],
              ] as [Tab, string][]
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative flex-1 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                  tab === k
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
            {tab === "customer" && (
              <form onSubmit={customerSubmit} className="space-y-4">
                <AppleField
                  icon={<User className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="الاسم بالكامل"
                  value={cName}
                  onChange={setCName}
                />
                <AppleField
                  icon={<Phone className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="رقم الجوال"
                  type="tel"
                  value={cPhone}
                  onChange={setCPhone}
                />
                <button
                  disabled={cLoading}
                  className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-luxe transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                >
                  {cLoading ? (
                    <span className="inline-block animate-spin h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                  ) : (
                    "دخول / تسجيل"
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  لا حاجة لكلمة مرور — الرقم هو هويتك
                </p>
              </form>
            )}

            {tab === "staff" && (
              <form onSubmit={staffSubmit} className="space-y-4">
                <AppleField
                  icon={<Phone className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="رقم الجوال"
                  type="tel"
                  value={sPhone}
                  onChange={setSPhone}
                />
                <AppleField
                  icon={<Lock className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="كلمة المرور"
                  type="password"
                  value={sPwd}
                  onChange={setSPwd}
                />
                <button
                  disabled={sLoading}
                  className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-luxe transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                >
                  {sLoading ? (
                    <span className="inline-block animate-spin h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                  ) : (
                    "دخول"
                  )}
                </button>
              </form>
            )}

            {tab === "admin" && (
              <form onSubmit={adminSubmit} className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-accent px-4 py-3 text-sm">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-accent-foreground" strokeWidth={1.5} />
                  <span className="text-accent-foreground">دخول المدير الافتراضي</span>
                </div>
                <AppleField
                  icon={<User className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="اسم المستخدم"
                  value={aUser}
                  onChange={setAUser}
                />
                <AppleField
                  icon={<Lock className="h-[18px]" strokeWidth={1.5} />}
                  placeholder="كلمة المرور"
                  type="password"
                  value={aPwd}
                  onChange={setAPwd}
                />
                <button
                  disabled={aLoading}
                  className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-luxe transition-all duration-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
                >
                  {aLoading ? (
                    <span className="inline-block animate-spin h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                  ) : (
                    "دخول كمدير"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/60 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          Powered by Eng /Mohamed Eltahan &amp; Eng /Kamel Elmahy
        </p>
      </div>
    </div>
  );
}

function AppleField({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-card">
      <span className="text-muted-foreground">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
