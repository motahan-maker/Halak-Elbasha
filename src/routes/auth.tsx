import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, customerEmail, customerPassword, staffEmail } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
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
        if (error.message?.includes("Invalid login")) {
          throw new Error("بيانات الدخول غير صحيحة. تأكد من صحة البيانات");
        }
        throw error;
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl gradient-luxe shadow-luxe">
            <Scissors className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-black text-gradient-gold">حلاق الباشا</h1>
          <p className="mt-1 text-sm text-muted-foreground">احجز موعدك بضغطة واحدة</p>
        </div>

        <div className="mt-8 inline-flex w-full rounded-2xl border border-border bg-card p-1">
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
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === k ? "gradient-luxe text-primary-foreground" : "text-muted-foreground"}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          {tab === "customer" && (
            <form onSubmit={customerSubmit} className="space-y-3">
              <Field
                icon={<User className="h-4 w-4" />}
                placeholder="الاسم بالكامل"
                value={cName}
                onChange={setCName}
              />
              <Field
                icon={<Phone className="h-4 w-4" />}
                placeholder="رقم الجوال"
                type="tel"
                value={cPhone}
                onChange={setCPhone}
              />
              <button
                disabled={cLoading}
                className="w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60"
              >
                {cLoading ? "..." : "دخول / تسجيل"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                لا حاجة لكلمة مرور — الرقم هو هويتك
              </p>
            </form>
          )}

          {tab === "staff" && (
            <form onSubmit={staffSubmit} className="space-y-3">
              <Field
                icon={<Phone className="h-4 w-4" />}
                placeholder="رقم الجوال"
                type="tel"
                value={sPhone}
                onChange={setSPhone}
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                placeholder="كلمة المرور"
                type="password"
                value={sPwd}
                onChange={setSPwd}
              />
              <button
                disabled={sLoading}
                className="w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60"
              >
                {sLoading ? "..." : "دخول"}
              </button>
            </form>
          )}

          {tab === "admin" && (
            <form onSubmit={adminSubmit} className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                دخول المدير الافتراضي
              </div>
              <Field
                icon={<User className="h-4 w-4" />}
                placeholder="اسم المستخدم"
                value={aUser}
                onChange={setAUser}
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                placeholder="كلمة المرور"
                type="password"
                value={aPwd}
                onChange={setAPwd}
              />
              <button
                disabled={aLoading}
                className="w-full rounded-xl gradient-luxe py-3 font-black text-primary-foreground shadow-luxe disabled:opacity-60"
              >
                {aLoading ? "..." : "دخول كمدير"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
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
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-primary/50">
      <span className="text-muted-foreground">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full bg-transparent py-3 text-sm outline-none"
      />
    </div>
  );
}
