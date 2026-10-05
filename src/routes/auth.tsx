import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, staffEmail } from "@/hooks/use-auth";
import {
  ensureDefaultAdmin,
  signUpCustomer,
  ADMIN_EMAIL,
  ADMIN_DEFAULT_PASSWORD,
} from "@/lib/admin.functions";
import { normalizeEgyptianPhone, validateFullName, looseDigits, PHONE_ERROR } from "@/lib/phone";
import { BrandHeader } from "@/components/auth/BrandHeader";
import { RoleSelector, type AuthRole } from "@/components/auth/RoleSelector";
import { AuthField } from "@/components/auth/AuthField";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { toast } from "sonner";
import { User, Lock, Phone, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول - حلاق الباشا" },
      { name: "description", content: "ادخل لحجز موعدك مع حلاق الباشا" },
    ],
  }),
  component: AuthPage,
});

const STAFF_COPY = {
  title: "دخول الموظفين",
  body: "سجّل دخولك لمتابعة طابور اليوم وبدء الخدمات.",
};

const ADMIN_COPY = {
  title: "دخول المدير",
  body: "تحكم كامل في الحلاقين والخدمات والحجوزات والعروض.",
};

function friendlyError(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e) return e;
  return "حدث خطأ غير متوقع";
}

function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthRole>("customer");
  const ensureAdmin = useServerFn(ensureDefaultAdmin);

  useEffect(() => {
    if (!auth.loading && auth.user) navigate({ to: "/", replace: true });
  }, [auth.loading, auth.user, navigate]);

  /* ---------------- Customer (phone identity, no password) ---------------- */
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cNameError, setCNameError] = useState<string | null>(null);
  const [cPhoneError, setCPhoneError] = useState<string | null>(null);
  const [cLoading, setCLoading] = useState(false);

  const customerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateFullName(cName);
    const phone = normalizeEgyptianPhone(cPhone);
    const phoneError = phone ? null : PHONE_ERROR;
    setCNameError(nameError);
    setCPhoneError(phoneError);
    if (nameError) return toast.error(nameError);
    if (phoneError || !phone) return toast.error(PHONE_ERROR);
    setCLoading(true);
    try {
      const result = await signUpCustomer({ data: { name: cName.trim(), phone } });
      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      });
      if (error) throw new Error("حدث خطأ أثناء الدخول. تأكد من صحة البيانات");
      if (result.existing) toast.success("مرحباً بعودتك!");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setCLoading(false);
    }
  };

  /* ---------------- Staff (verified server-side as barber) ---------------- */
  const [sPhone, setSPhone] = useState("");
  const [sPwd, setSPwd] = useState("");
  const [sPhoneError, setSPhoneError] = useState<string | null>(null);
  const [sLoading, setSLoading] = useState(false);

  const staffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Staff accounts are created by the admin with any phone format (min 6
    // digits), so validation stays lenient here — strict Egyptian format
    // applies to customer registration only.
    const typed = looseDigits(sPhone);
    if (typed.length < 6) {
      setSPhoneError(PHONE_ERROR);
      return toast.error(PHONE_ERROR);
    }
    setSPhoneError(null);
    if (!sPwd) return toast.error("من فضلك أدخل كلمة المرور");
    // The stored login email was derived from the phone exactly as the admin
    // typed it at creation time, so try the typed digits first (legacy
    // behavior), then the normalized Egyptian form as a fallback.
    const candidates = [typed];
    const normalized = normalizeEgyptianPhone(sPhone);
    if (normalized && normalized !== typed) candidates.push(normalized);
    setSLoading(true);
    try {
      let signedIn = false;
      for (const cand of candidates) {
        const { error } = await supabase.auth.signInWithPassword({
          email: staffEmail(cand),
          password: sPwd,
        });
        if (!error) {
          signedIn = true;
          break;
        }
      }
      if (!signedIn) return toast.error("بيانات الدخول غير صحيحة");
      navigate({ to: "/", replace: true });
    } finally {
      setSLoading(false);
    }
  };

  /* ---------------- Admin (server-verified role) ---------------- */
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
      toast.error(friendlyError(err));
    } finally {
      setALoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col px-5 pb-8 pt-10">
        <div className="animate-fade-in-up">
          <BrandHeader />
        </div>

        {/* Role selector */}
        <div className="mt-7 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <RoleSelector
            value={tab}
            onChange={(role) => {
              setTab(role);
              setCNameError(null);
              setCPhoneError(null);
              setSPhoneError(null);
            }}
          />
        </div>

        {/* Auth card */}
        <div className="mt-5 animate-fade-in-up" style={{ animationDelay: "0.14s" }}>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card dark:border-[#2A2A2A]">
            <div key={tab} className="animate-fade-in">
              {tab === "customer" && (
                <form onSubmit={customerSubmit} className="space-y-3.5" noValidate={false}>
                  <AuthField
                    id="customer-name"
                    label="الاسم الكامل"
                    value={cName}
                    onChange={(v) => {
                      setCName(v);
                      if (cNameError) setCNameError(null);
                    }}
                    icon={<User className="h-5 w-5" strokeWidth={1.8} />}
                    autoComplete="name"
                    error={cNameError}
                  />
                  <AuthField
                    id="customer-phone"
                    label="رقم الجوال (01XXXXXXXXX)"
                    value={cPhone}
                    onChange={(v) => {
                      setCPhone(v);
                      if (cPhoneError) setCPhoneError(null);
                    }}
                    icon={<Phone className="h-5 w-5" strokeWidth={1.8} />}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    error={cPhoneError}
                  />
                  <div className="pt-1">
                    <PrimaryButton loading={cLoading} label="دخول / تسجيل" />
                  </div>
                </form>
              )}

              {tab === "staff" && (
                <div>
                  <div className="mb-4 text-center">
                    <h2 className="font-display text-base font-bold text-foreground">
                      {STAFF_COPY.title}
                    </h2>
                    <p className="mt-1 font-display text-[0.8rem] font-medium text-muted-foreground">
                      {STAFF_COPY.body}
                    </p>
                  </div>
                  <form onSubmit={staffSubmit} className="space-y-3.5">
                    <AuthField
                      id="staff-phone"
                      label="رقم الجوال"
                      value={sPhone}
                      onChange={(v) => {
                        setSPhone(v);
                        if (sPhoneError) setSPhoneError(null);
                      }}
                      icon={<Phone className="h-5 w-5" strokeWidth={1.8} />}
                      type="tel"
                      autoComplete="username"
                      inputMode="tel"
                      error={sPhoneError}
                    />
                    <AuthField
                      id="staff-password"
                      label="كلمة المرور"
                      value={sPwd}
                      onChange={setSPwd}
                      icon={<Lock className="h-5 w-5" strokeWidth={1.8} />}
                      type="password"
                      autoComplete="current-password"
                    />
                    <div className="pt-1">
                      <PrimaryButton loading={sLoading} label="دخول كحلاق" />
                    </div>
                  </form>
                </div>
              )}

              {tab === "admin" && (
                <div>
                  <div className="mb-4 text-center">
                    <h2 className="font-display text-base font-bold text-foreground">
                      {ADMIN_COPY.title}
                    </h2>
                    <p className="mt-1 font-display text-[0.8rem] font-medium text-muted-foreground">
                      {ADMIN_COPY.body}
                    </p>
                  </div>
                  <form onSubmit={adminSubmit} className="space-y-3.5">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3.5 py-2.5 text-[0.78rem] font-bold text-foreground">
                      <ShieldCheck
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        strokeWidth={2}
                      />
                      <span>دخول الإدارة — تحكم كامل</span>
                    </div>
                    <AuthField
                      id="admin-username"
                      label="اسم المستخدم"
                      value={aUser}
                      onChange={setAUser}
                      icon={<User className="h-5 w-5" strokeWidth={1.8} />}
                      autoComplete="username"
                    />
                    <AuthField
                      id="admin-password"
                      label="كلمة المرور"
                      value={aPwd}
                      onChange={setAPwd}
                      icon={<Lock className="h-5 w-5" strokeWidth={1.8} />}
                      type="password"
                      autoComplete="current-password"
                    />
                    <div className="pt-1">
                      <PrimaryButton loading={aLoading} label="دخول المدير" />
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer subtitle reminder */}
        {tab === "customer" && (
          <p
            className="mt-5 animate-fade-in-up text-center font-display text-[0.875rem] font-semibold text-muted-foreground"
            style={{ animationDelay: "0.2s" }}
          >
            لا حاجة لكلمة مرور — الرقم هو هويتك
          </p>
        )}

        <div className="flex-1" />
        <AuthFooter />
      </div>
    </div>
  );
}
