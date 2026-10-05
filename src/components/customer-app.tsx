import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonCard, SkeletonWizard } from "@/components/ui/skeleton";
import { CurvedWorkingAnimation } from "@/components/ui/curved-working-animation";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { FeaturedBookingCard } from "@/components/customer/FeaturedBookingCard";
import { OffersSection } from "@/components/customer/OffersSection";
import { BarbersSection } from "@/components/customer/BarbersSection";
import {
  CustomerBottomNav,
  type CustomerTab as Tab,
} from "@/components/customer/CustomerBottomNav";
import { generateSlots, formatTime, hasRemainingTime, type Slot } from "@/lib/slots";
import {
  arabicDate,
  arabicShortDate,
  isoDate,
  ARABIC_DAYS,
  buildWhatsAppLink,
  digitsOnly,
} from "@/lib/format";
import { cancelBookingByCustomer, notifyBarbers } from "@/lib/admin.functions";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushState,
  type PushState,
} from "@/lib/push";
import { toast } from "sonner";
import {
  Scissors,
  CalendarDays,
  Clock,
  User,
  Phone,
  Star,
  Tag,
  LogOut,
  ChevronLeft,
  Check,
  MessageCircle,
  BellRing,
  BellOff,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";

type Step = "service" | "barber" | "date" | "time" | "confirm" | "success";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}
interface Barber {
  id: string;
  name: string;
  specialization: string | null;
  is_active: boolean;
  is_working?: boolean;
  working_days: number[];
  start_time: string;
  end_time: string;
  slot_minutes: number;
}
interface Booking {
  id: string;
  booking_number: string | null;
  customer_name: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: string;
  barber_id: string;
  started_at?: string | null;
  completed_at?: string | null;
}
interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
}
interface Settings {
  shop_name: string;
  whatsapp: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  working_days: number[];
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_start: string | null;
  break_end: string | null;
}

export function CustomerApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("home");
  const qc = useQueryClient();

  const settings = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      return data as Settings;
    },
  });

  if (!auth.user) {
    return null;
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  const isHome = tab === "home";

  return (
    <div
      dir="rtl"
      className={`flex min-h-screen flex-col pb-28 ${isHome ? "bg-[#FAF5E8]" : "bg-background"}`}
    >
      {/* Header (inner pages keep the existing app header; home has its own) */}
      {!isHome && (
        <header className="sticky top-0 z-30 glass">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center squircle gradient-gold text-gold-foreground shadow-glow-gold">
                <Scissors className="h-[22px] w-[22px]" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-[15px] font-extrabold leading-tight text-foreground">
                  {settings.data?.shop_name ?? "حلاق الباشا"}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_18%,transparent)] animate-pulse" />
                  <span className="truncate text-[11px] font-semibold text-muted-foreground">
                    مرحباً، {auth.profile?.full_name ?? "صديقنا"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <ThemeToggle />
              <button
                onClick={signOut}
                aria-label="خروج"
                className="hit-area grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border/70 bg-card/60 text-muted-foreground transition-all duration-300 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive press"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`mx-auto w-full flex-1 px-4 pt-4 ${isHome ? "max-w-md" : "max-w-2xl"}`}>
        {tab === "home" && (
          <CustomerHomePage
            settings={settings.data}
            userName={auth.profile?.full_name}
            onSignOut={signOut}
            onBookingDone={() => setTab("bookings")}
          />
        )}
        {tab === "bookings" && <BookingsList />}
        {tab === "offers" && <OffersList />}
        {tab === "profile" && <ProfileView settings={settings.data} />}
      </main>

      {/* Bottom Nav */}
      <CustomerBottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

/* -------- HOME (rebuilt to reference design; booking wizard preserved) -------- */
function CustomerHomePage({
  settings,
  userName,
  onSignOut,
  onBookingDone,
}: {
  settings: Settings | undefined;
  userName: string | undefined;
  onSignOut: () => void;
  onBookingDone: () => void;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);

  if (wizardOpen) {
    if (!settings) return <SkeletonWizard />;
    return (
      <BookingWizard
        settings={settings}
        onDone={() => {
          setWizardOpen(false);
          onBookingDone();
        }}
      />
    );
  }

  return (
    <div className="space-y-7 pb-2">
      <div className="animate-fade-in-up">
        <CustomerHeader userName={userName} onSignOut={onSignOut} />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "0.06s" }}>
        <FeaturedBookingCard
          shopName={settings?.shop_name ?? "حلاق الباشا"}
          onStart={() => setWizardOpen(true)}
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
        <OffersSection />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: "0.18s" }}>
        <BarbersSection />
      </div>
    </div>
  );
}

/* Barbers showcase moved to src/components/customer/BarbersSection.tsx (no photos, reference design). */

/* -------- WIZARD -------- */
function BookingWizard({ settings, onDone }: { settings: Settings; onDone: () => void }) {
  const auth = useAuth();
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [created, setCreated] = useState<Booking | null>(null);

  const goNext = (s: Step) => setStep(s);
  const goBack = () => {
    if (step === "barber") setStep("service");
    else if (step === "date") setStep("barber");
    else if (step === "time") setStep("date");
    else if (step === "confirm") setStep("time");
  };

  const services = useQuery<Service[]>({
    queryKey: ["services", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("price");
      if (error) return [];
      return (data ?? []) as Service[];
    },
  });
  const barbers = useQuery<Barber[]>({
    queryKey: ["barbers", "active"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) return [];
      return (data ?? []) as Barber[];
    },
  });

  const workingDays = barber?.working_days ?? settings.working_days;
  const cfg = useMemo(
    () => ({
      start_time: barber?.start_time ?? settings.start_time ?? "10:00",
      end_time: barber?.end_time ?? settings.end_time ?? "23:00",
      slot_minutes: barber?.slot_minutes ?? settings.slot_minutes ?? 40,
      break_start: settings.break_start,
      break_end: settings.break_end,
    }),
    [barber, settings],
  );

  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = isoDate(today);
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const todayOpen = hasRemainingTime(cfg, nowMin);
    const days = workingDays ?? [];
    const out: { iso: string; date: Date; available: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = isoDate(d);
      const isToday = iso === todayIso;
      const worksToday = days.length === 0 || days.includes(d.getDay());
      out.push({
        iso,
        date: d,
        isToday,
        available: worksToday && (!isToday || todayOpen),
      });
    }
    return out;
  }, [workingDays, cfg]);

  const bookedQ = useQuery<string[]>({
    queryKey: ["booked", barber?.id, date],
    enabled: !!barber && !!date,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_booked_times", {
        _barber_id: barber!.id,
        _booking_date: date!,
      });
      if (error) return [];
      return (data ?? []).map((r: any) => r.booking_time as string);
    },
  });

  const slots: Slot[] = useMemo(() => {
    if (!date || !barber) return [];
    const isToday = date === isoDate(new Date());
    const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : null;
    return generateSlots(cfg, bookedQ.data ?? [], nowMin);
  }, [date, barber, cfg, bookedQ.data]);

  const hasFreeSlot = slots.some((s) => s.kind === "available");

  const confirm = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_booking", {
        _barber_id: barber!.id,
        _service_id: service!.id,
        _booking_date: date!,
        _booking_time: time!,
      });
      if (error) {
        if (
          String(error.message).includes("SLOT_TAKEN") ||
          String(error.message).includes("bookings_no_double")
        ) {
          throw new Error("هذا الموعد محجوز بالفعل");
        }
        throw new Error(error.message);
      }
      return data as Booking;
    },
    onSuccess: (b) => {
      setCreated(b);
      setStep("success");
      notifyBarbers({
        data: {
          barber_id: b.barber_id,
          title: "حجز جديد!",
          body: `${b.customer_name} — ${b.service_name} ${formatTime(b.booking_time)}`,
        },
      }).catch(() => {});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stepIndex = ["service", "barber", "date", "time", "confirm"].indexOf(step);

  return (
    <div className="space-y-4">
      {/* Nav Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "service" || step === "success") onDone();
            else goBack();
          }}
          aria-label="رجوع"
          className="hit-area grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-border/70 bg-card/70 text-foreground transition-all duration-300 hover:border-gold/45 hover:text-accent-foreground press"
        >
          <ChevronLeft className="h-4.5 w-4.5 rotate-180" strokeWidth={2} />
        </button>
        {step !== "success" ? (
          <>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-gold transition-all duration-500 ease-out"
                style={{ width: `${((stepIndex + 1) / 5) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-bold tnum text-muted-foreground">
              {stepIndex + 1}/5
            </span>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Step Content */}
      <div key={step} className="wizard-step-enter">
        {step === "service" && (
          <div>
            <h2 className="mb-3.5 px-1 font-display text-[1.35rem] font-extrabold tracking-tight text-foreground">
              اختر الخدمة
            </h2>
            <div className="space-y-2.5">
              {services.data?.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    goNext("barber");
                  }}
                  className="group flex w-full cursor-pointer animate-fade-in-up items-center gap-3.5 rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-right shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated press"
                  style={{ animationDelay: `${0.03 * i}s` }}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center squircle bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25 transition-transform duration-300 group-hover:scale-105">
                    <Scissors className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[0.95rem] font-extrabold text-foreground">
                      {s.name}
                    </div>
                    {s.description && (
                      <div className="mt-0.5 truncate text-[11.5px] font-medium text-muted-foreground">
                        {s.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-start">
                    <div className="font-display text-[0.95rem] font-black tnum text-accent-foreground">
                      {s.price}
                    </div>
                    <div className="text-[8.5px] font-bold text-muted-foreground">ج.م</div>
                  </div>
                </button>
              ))}
              {!services.data?.length && (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/15 p-8 text-center text-xs font-medium text-muted-foreground">
                  لا توجد خدمات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {step === "barber" && (
          <div>
            <h2 className="mb-1.5 px-1 font-display text-[1.35rem] font-extrabold tracking-tight text-foreground">
              اختر الحلاق
            </h2>
            <p className="mb-3.5 px-1 text-[11.5px] font-medium text-muted-foreground">
              الحلاق المتاح يبدأ بخدمتك فور وصولك — والمشغول يمكنك الحجز معه لاحقاً.
            </p>
            {!barbers.data?.length && (
              <p className="rounded-2xl border border-dashed border-border bg-secondary/15 p-8 text-center text-xs font-medium text-muted-foreground">
                لم يقم المدير بإضافة حلاقين بعد.
              </p>
            )}
            <div className="space-y-2.5">
              {[...(barbers.data ?? [])]
                .sort((a, b) => Number(!!a.is_working) - Number(!!b.is_working))
                .map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBarber(b);
                      goNext("date");
                    }}
                    className="group flex w-full cursor-pointer animate-fade-in-up items-center gap-3.5 rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-right shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated press"
                    style={{ animationDelay: `${0.03 * i}s` }}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center squircle bg-accent font-display text-[17px] font-black text-accent-foreground ring-1 ring-inset ring-gold/25 transition-transform duration-300 group-hover:scale-105">
                      {b.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-display text-[0.95rem] font-extrabold text-foreground">
                          {b.name}
                        </div>
                        {b.is_working ? (
                          <span className="chip chip-warn shrink-0">
                            <CurvedWorkingAnimation />
                            مشغول
                          </span>
                        ) : (
                          <span className="chip chip-success shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                            متاح
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11.5px] font-medium text-muted-foreground">
                        {b.specialization || "حلاق"}
                      </div>
                    </div>
                    <ChevronLeft
                      className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:text-accent-foreground"
                      strokeWidth={2}
                    />
                  </button>
                ))}
            </div>
          </div>
        )}

        {step === "date" && (
          <div>
            <h2 className="mb-3.5 px-1 font-display text-[1.35rem] font-extrabold tracking-tight text-foreground">
              اختر التاريخ
            </h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  disabled={!d.available}
                  onClick={() => {
                    setDate(d.iso);
                    goNext("time");
                  }}
                  className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-3.5 text-center transition-all duration-300 ${
                    !d.available
                      ? "cursor-not-allowed border-border/45 bg-muted/25 opacity-40"
                      : d.isToday
                        ? "cursor-pointer border-gold/50 bg-accent/60 shadow-card hover:-translate-y-0.5 hover:shadow-glow-gold press"
                        : "cursor-pointer border-border/70 bg-card shadow-card hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated press"
                  }`}
                >
                  {d.isToday && d.available && (
                    <span aria-hidden className="absolute inset-x-3 top-0 h-px gold-rule" />
                  )}
                  <div className="text-[9.5px] font-bold text-muted-foreground">
                    {d.isToday ? "اليوم" : ARABIC_DAYS[d.date.getDay()]}
                  </div>
                  <div className="mt-1 font-display text-[1.5rem] font-black leading-none tnum text-foreground">
                    {d.date.getDate()}
                  </div>
                  <div className="mt-1 text-[9.5px] font-semibold text-muted-foreground/80">
                    {arabicShortDate(d.date).split(" ").slice(-1)[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "time" && (
          <div>
            <h2 className="mb-3.5 px-1 font-display text-[1.35rem] font-extrabold tracking-tight text-foreground">
              اختر الوقت
            </h2>
            {slots.length === 0 || !hasFreeSlot ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <div className="text-base font-bold text-foreground">لا توجد مواعيد متاحة</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {slots.length === 0
                    ? "لا يوجد وقت متاح لهذا اليوم"
                    : "كل المواعيد محجوزة أو انتهى وقتها"}
                </div>
                <button
                  onClick={() => setStep("date")}
                  className="press mt-4 rounded-xl border border-border/70 bg-secondary px-4 py-2.5 text-[12px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
                >
                  اختر تاريخاً آخر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {slots.map((s) => {
                  const disabled = s.kind !== "available";
                  const tone = disabled
                    ? s.kind === "break"
                      ? "cursor-not-allowed border-dashed border-border/60 bg-muted/15"
                      : "cursor-not-allowed border-border/40 bg-muted/25"
                    : "cursor-pointer border-border/70 bg-card shadow-card hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated press";
                  const caption =
                    s.kind === "booked"
                      ? "محجوز"
                      : s.kind === "break"
                        ? "استراحة"
                        : s.kind === "past"
                          ? "انتهى"
                          : null;
                  return (
                    <button
                      key={s.time}
                      disabled={disabled}
                      onClick={() => {
                        setTime(s.time);
                        goNext("confirm");
                      }}
                      className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-300 ${tone}`}
                    >
                      <span
                        className={`font-display text-[0.92rem] font-extrabold tnum ${
                          disabled ? "text-muted-foreground/45" : "text-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                      {caption ? (
                        <span className="mt-1 text-[8.5px] font-bold text-muted-foreground/60">
                          {caption}
                        </span>
                      ) : (
                        <span className="mt-1 h-1 w-1 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_16%,transparent)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "confirm" && service && barber && date && time && (
          <div className="space-y-4">
            <h2 className="px-1 font-display text-[1.35rem] font-extrabold tracking-tight text-foreground">
              تأكيد الحجز
            </h2>

            <div className="panel-ink grain">
              <div className="relative z-10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-ink-foreground/45">
                      الخدمة المختارة
                    </div>
                    <div className="mt-1.5 truncate font-display text-[1.1rem] font-extrabold text-ink-foreground">
                      {service.name}
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="font-display text-[1.6rem] font-black leading-none tnum text-gradient-gold">
                      {service.price}
                    </div>
                    <div className="mt-1 text-[8.5px] font-bold text-ink-foreground/45">ج.م</div>
                  </div>
                </div>

                <hr className="gold-rule my-4" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-ink-foreground/45">الحلاق</div>
                    <div className="mt-1 truncate font-display text-[0.85rem] font-extrabold text-ink-foreground">
                      {barber.name}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-bold text-ink-foreground/45">الوقت</div>
                    <div className="mt-1 truncate font-display text-[0.85rem] font-extrabold tnum text-ink-foreground">
                      {slots.find((s) => s.time === time)?.label ?? time}
                    </div>
                  </div>
                </div>

                <div className="mt-3 min-w-0">
                  <div className="text-[9.5px] font-bold text-ink-foreground/45">التاريخ</div>
                  <div className="mt-1 truncate font-display text-[0.85rem] font-extrabold text-ink-foreground">
                    {arabicDate(date)}
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/55 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
              <AppleRow
                label="الاسم"
                value={auth.profile?.full_name ?? ""}
                icon={<User className="h-4 w-4" strokeWidth={1.6} />}
              />
              <AppleRow
                label="الجوال"
                value={auth.profile?.phone ?? ""}
                icon={<Phone className="h-4 w-4" strokeWidth={1.6} />}
              />
            </div>

            <button
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl gradient-gold py-4 text-[0.84rem] font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-[1.06] disabled:opacity-55 press"
            >
              {confirm.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-foreground/30 border-t-gold-foreground" />
                  جارٍ التأكيد...
                </>
              ) : (
                <>
                  <Check className="h-4.5 w-4.5" strokeWidth={2.6} /> تأكيد الحجز
                </>
              )}
            </button>

            <p className="text-center text-[10.5px] font-semibold text-muted-foreground/75">
              سيصل إشعار للحلاق فور تأكيد الحجز.
            </p>
          </div>
        )}

        {step === "success" && created && (
          <SuccessCard
            booking={created}
            barberName={barber?.name ?? ""}
            settings={settings}
            onDone={onDone}
          />
        )}
      </div>
    </div>
  );
}

function AppleRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <div className="flex shrink-0 items-center gap-2.5 text-[11.5px] font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground">
          {icon}
        </span>
        {label}
      </div>
      <div className="truncate font-display text-[0.83rem] font-bold text-foreground">{value}</div>
    </div>
  );
}

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function downloadBookingIcs(
  booking: Booking,
  barberName: string,
  shopName: string,
  address?: string,
) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const floating = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const start = new Date(`${booking.booking_date}T${booking.booking_time}`);
  if (Number.isNaN(start.getTime())) return false;
  const end = new Date(start.getTime() + 45 * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Halak Elbasha//Booking//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@halak-elbasha`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    `DTSTART:${floating(start)}`,
    `DTEND:${floating(end)}`,
    `SUMMARY:${icsEscape(`${shopName} — ${booking.service_name}`)}`,
    `DESCRIPTION:${icsEscape(`رقم الحجز: ${booking.booking_number ?? "—"}\nالحلاق: ${barberName}\nالسعر: ${booking.service_price} ج.م`)}`,
    ...(address ? [`LOCATION:${icsEscape(address)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape("تذكير بموعدك")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-${booking.booking_number ?? booking.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

function SuccessCard({
  booking,
  barberName,
  settings,
  onDone,
}: {
  booking: Booking;
  barberName: string;
  settings: Settings;
  onDone: () => void;
}) {
  const auth = useAuth();
  const waMessage = `مرحباً ${settings.shop_name}،
أكد لكم حجزي:
رقم الحجز: ${booking.booking_number}
الاسم: ${auth.profile?.full_name}
الخدمة: ${booking.service_name}
التاريخ: ${arabicDate(booking.booking_date)}
الوقت: ${booking.booking_time}`;
  const wa = buildWhatsAppLink(settings.whatsapp, waMessage);
  const digits = digitsOnly(settings.whatsapp);

  const addToCalendar = () => {
    const ok = downloadBookingIcs(booking, barberName, settings.shop_name, settings.address);
    if (ok) toast.success("تم تنزيل ملف الموعد — أضفه لتقويمك");
    else toast.error("تعذّر إنشاء ملف التقويم");
  };

  return (
    <div className="animate-spring-in space-y-5 text-center">
      <div className="relative mx-auto grid h-20 w-20 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-gold/35 animate-ring-expand"
        />
        <span className="absolute inset-0 rounded-full bg-gold/25 blur-2xl animate-glow-pulse" />
        <span className="relative grid h-20 w-20 place-items-center rounded-full gradient-gold text-gold-foreground shadow-glow-gold ring-1 ring-inset ring-white/40 animate-success-bounce">
          <Check className="h-11 w-11" strokeWidth={2.6} />
        </span>
      </div>

      <div>
        <div className="eyebrow text-accent-foreground">تم بنجاح</div>
        <h2 className="mt-1.5 font-display text-[1.5rem] font-black tracking-tight text-foreground">
          موعدك محجوز
        </h2>
      </div>

      <div className="panel-ink grain">
        <div className="relative z-10 px-5 py-4">
          <div className="text-[9.5px] font-bold text-ink-foreground/45">رقم الحجز</div>
          <div className="mt-1.5 font-display text-[2rem] font-black leading-none tnum text-gradient-gold">
            {booking.booking_number}
          </div>
          <hr className="gold-rule my-3.5" />
          <div className="flex items-center justify-between gap-3 text-start">
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-ink-foreground/45">مع</div>
              <div className="mt-1 truncate font-display text-[0.82rem] font-extrabold text-ink-foreground">
                {barberName}
              </div>
            </div>
            <div className="shrink-0 text-end">
              <div className="text-[9px] font-bold text-ink-foreground/45">السعر</div>
              <div className="mt-1 font-display text-[0.82rem] font-extrabold tnum text-ink-foreground">
                {booking.service_price} ج.م
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/55 overflow-hidden rounded-2xl border border-border/70 bg-card text-start shadow-card">
        <AppleRow
          label="الحلاق"
          value={barberName}
          icon={<User className="h-4 w-4" strokeWidth={1.6} />}
        />
        <AppleRow
          label="الخدمة"
          value={booking.service_name}
          icon={<Scissors className="h-4 w-4" strokeWidth={1.6} />}
        />
        <AppleRow
          label="التاريخ"
          value={arabicDate(booking.booking_date)}
          icon={<CalendarDays className="h-4 w-4" strokeWidth={1.6} />}
        />
        <AppleRow
          label="الوقت"
          value={formatTime(booking.booking_time)}
          icon={<Clock className="h-4 w-4" strokeWidth={1.6} />}
        />
      </div>

      <div className="rounded-2xl border border-gold/25 bg-gold/8 p-3.5 text-start text-[11.5px] font-semibold leading-relaxed text-accent-foreground">
        تم إشعار الحلاق بحجزك، وسيصلك تنبيه فور بدء الخدمة.
      </div>

      <p className="text-[11.5px] font-medium leading-relaxed text-muted-foreground/80">
        يرجى الحضور قبل موعدك بـ ٥ دقائق.
        <br />
        في حالة التأخير أكثر من ١٠ دقائق قد يتم إلغاء الموعد تلقائياً.
      </p>

      <div className="space-y-2.5">
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl gradient-success py-3.5 text-[0.82rem] font-extrabold text-white shadow-glow-success transition-all duration-300 hover:brightness-[1.06] press"
        >
          <MessageCircle className="h-4.5 w-4.5" strokeWidth={1.8} /> تأكيد عبر واتساب
        </a>
        <button
          onClick={addToCalendar}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3.5 text-[0.82rem] font-extrabold text-foreground shadow-card transition-all duration-300 hover:border-gold/45 hover:text-accent-foreground press"
        >
          <CalendarDays className="h-4.5 w-4.5" strokeWidth={1.8} /> أضف الموعد للتقويم
        </button>
        {digits.length > 5 && (
          <a
            href={`tel:${digits}`}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card py-3.5 text-[0.82rem] font-extrabold text-foreground shadow-card transition-all duration-300 hover:border-gold/45 hover:text-accent-foreground press"
          >
            <Phone className="h-4.5 w-4.5" strokeWidth={1.8} /> اتصل بالصالون
          </a>
        )}
      </div>

      <button
        onClick={onDone}
        className="link-underline mx-auto block cursor-pointer py-1 font-display text-[0.8rem] font-bold text-accent-foreground transition-transform duration-200 press"
      >
        العودة للرئيسية
      </button>
    </div>
  );
}

/* -------- BOOKINGS LIST -------- */
function BookingsList() {
  const auth = useAuth();
  const qc = useQueryClient();
  const list = useQuery<Booking[]>({
    queryKey: ["my-bookings", auth.user?.id],
    enabled: !!auth.user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", auth.user!.id)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });
      return (data ?? []) as Booking[];
    },
  });

  const reviewedQ = useQuery<Set<string>>({
    queryKey: ["my-reviews", auth.user?.id],
    enabled: !!auth.user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("customer_id", auth.user!.id);
      return new Set((data ?? []).map((r) => r.booking_id).filter((id): id is string => !!id));
    },
  });

  // Live sync with the barber's actions (start / finish / cancel).
  useEffect(() => {
    if (!auth.user) return;
    const uid = auth.user.id;
    const channel = supabase
      .channel(`customer-bookings-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${uid}` },
        () => qc.invalidateQueries({ queryKey: ["my-bookings", uid] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth.user, qc]);

  const prevRef = useRef<Map<string, { status: string; started: boolean }>>(new Map());
  useEffect(() => {
    if (!list.data) return;
    const prev = prevRef.current;
    if (prev.size > 0) {
      for (const b of list.data) {
        const before = prev.get(b.id);
        if (!before) continue;
        if (!before.started && b.started_at && b.status === "booked") {
          toast.success("بدأ حلاقك الخدمة", {
            description: `${b.service_name} — أهلاً بك!`,
          });
        }
        if (before.status === "booked" && b.status === "completed") {
          toast.success("تم إنهاء موعدك", {
            description: "لا تنسَ تقييم الخدمة من الأسفل",
          });
        }
        if (before.status === "booked" && b.status.startsWith("cancelled")) {
          toast.error("تم إلغاء موعدك", {
            description: `${b.service_name} — ${arabicDate(b.booking_date)}`,
          });
        }
      }
    }
    prevRef.current = new Map(
      list.data.map((b) => [b.id, { status: b.status, started: !!b.started_at }]),
    );
  }, [list.data]);

  const cancelFn = useServerFn(cancelBookingByCustomer);
  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await cancelFn({ data: { booking_id: id } });
    },
    onSuccess: () => {
      toast.success("تم إلغاء الحجز بنجاح");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["booked"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMut = useMutation({
    mutationFn: async (vars: {
      booking_id: string;
      barber_id: string;
      rating: number;
      comment: string;
    }) => {
      const { error } = await supabase.from("reviews").insert({
        booking_id: vars.booking_id,
        barber_id: vars.barber_id,
        customer_id: auth.user!.id,
        customer_name: auth.profile?.full_name ?? "",
        rating: vars.rating,
        comment: vars.comment,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success("شكراً لتقييمك!"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (list.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!list.data?.length) {
    return <Empty title="لا توجد حجوزات" subtitle="ابدأ بحجز موعدك الأول" />;
  }
  const ts = (b: Booking) => new Date(`${b.booking_date}T${b.booking_time}`).getTime();
  const active = list.data.filter(
    (b) => b.status === "booked" && !!b.started_at && !b.completed_at,
  );
  const activeIds = new Set(active.map((b) => b.id));
  // Nearest appointment first — the one you care about is always on top.
  const upcoming = list.data
    .filter((b) => b.status === "booked" && !activeIds.has(b.id))
    .sort((a, b) => ts(a) - ts(b));
  const past = list.data.filter((b) => b.status !== "booked").sort((a, b) => ts(b) - ts(a));

  return (
    <div className="space-y-6">
      {(active.length > 0 || upcoming.length > 0) && (
        <section>
          <SectionTitle eyebrow="المواعيد">القادمة</SectionTitle>
          <div className="space-y-3">
            {[...active, ...upcoming].map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                inService={activeIds.has(b.id)}
                onCancel={() => cancel.mutate(b.id)}
                isCancelling={cancel.isPending && cancel.variables === b.id}
              />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <SectionTitle eyebrow="أرشيف">السابقة</SectionTitle>
          <div className="space-y-3">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                canReview={b.status === "completed" && !reviewedQ.data?.has(b.id)}
                alreadyReviewed={reviewedQ.data?.has(b.id) ?? false}
                onReview={(r, c) =>
                  reviewMut.mutate(
                    {
                      booking_id: b.id,
                      barber_id: b.barber_id,
                      rating: r,
                      comment: c,
                    },
                    { onSuccess: () => reviewedQ.refetch() },
                  )
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({
  b,
  inService,
  onCancel,
  isCancelling,
  onReview,
  canReview,
  alreadyReviewed,
}: {
  b: Booking;
  inService?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
  onReview?: (rating: number, comment: string) => void;
  canReview?: boolean;
  alreadyReviewed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const getStatusInfo = () => {
    if (inService) return { label: "جارٍ الخدمة الآن", chip: "chip-warn" };
    if (b.status === "booked") return { label: "محجوز", chip: "chip-gold" };
    if (b.status === "completed") return { label: "مكتمل", chip: "chip-success" };
    if (b.status === "cancelled_by_barber")
      return { label: "ملغي بواسطة الحلاق", chip: "chip-danger" };
    if (b.status === "cancelled_by_customer")
      return { label: "ملغي بواسطة العميل", chip: "chip-danger" };
    return { label: "ملغي", chip: "chip-danger" };
  };
  const { label: status, chip: statusChip } = getStatusInfo();

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated ${
        inService ? "border-warning/35 bg-warning/[0.05]" : "border-border/70"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent to-transparent ${
          inService ? "via-warning/70" : "via-gold/40"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[0.95rem] font-extrabold text-foreground">
            {b.service_name}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.7} />
              {arabicDate(b.booking_date)}
            </span>
            <span className="inline-flex items-center gap-1.5 tnum">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.7} />
              {formatTime(b.booking_time)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`chip ${statusChip}`}>
            {inService && <CurvedWorkingAnimation />}
            {status}
          </span>
          <span className="tnum text-[9.5px] font-bold tracking-[0.1em] text-muted-foreground/60">
            {b.booking_number}
          </span>
        </div>
      </div>

      {inService && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/8 px-3.5 py-2.5">
          <span className="chip chip-warn shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            مباشر
          </span>
          <span className="text-[11px] font-bold text-foreground">
            حلاقك بدأ الخدمة الآن — أهلاً بك!
          </span>
        </div>
      )}

      {onCancel &&
        (!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            className="mt-3.5 w-full cursor-pointer rounded-xl border border-destructive/25 bg-destructive/[0.06] px-4 py-2.5 text-[11.5px] font-bold text-destructive transition-all duration-300 hover:bg-destructive/12 press"
          >
            إلغاء الحجز
          </button>
        ) : (
          <div className="mt-3.5 animate-scale-in space-y-2.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3">
            <p className="text-center text-[11.5px] font-bold text-destructive">
              سيتم إلغاء الموعد وإشعار الحلاق — هل أنت متأكد؟
            </p>
            <div className="flex gap-2">
              <button
                disabled={isCancelling}
                onClick={() => {
                  onCancel();
                  setConfirmCancel(false);
                }}
                className="flex-1 cursor-pointer rounded-xl bg-destructive px-4 py-2.5 text-[11.5px] font-bold text-destructive-foreground transition-all duration-200 hover:brightness-105 press disabled:opacity-50"
              >
                {isCancelling ? "جارٍ الإلغاء..." : "نعم، إلغاء"}
              </button>
              <button
                disabled={isCancelling}
                onClick={() => setConfirmCancel(false)}
                className="flex-1 cursor-pointer rounded-xl border border-border/70 bg-card px-4 py-2.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:bg-muted press disabled:opacity-50"
              >
                تراجع
              </button>
            </div>
          </div>
        ))}

      {alreadyReviewed && !onReview && (
        <div className="mt-3 flex justify-center">
          <span className="chip chip-success">
            <Check className="h-3 w-3" strokeWidth={3} />
            شكراً لك، تم إرسال تقييمك
          </span>
        </div>
      )}

      {onReview && canReview && (
        <div className="mt-3">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-[11.5px] font-bold text-accent-foreground transition-all duration-300 hover:bg-gold/18 press"
            >
              <Star className="h-3.5 w-3.5" strokeWidth={2} />
              قيّم الخدمة
            </button>
          ) : (
            <div className="animate-scale-in space-y-3.5 rounded-xl border border-border/60 bg-secondary/35 p-4">
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`${n} نجوم`}
                    className="cursor-pointer transition-transform duration-150 press"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors duration-200 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                      strokeWidth={n <= rating ? 0 : 1.5}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="رأيك يهمنا..."
                className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none transition-colors duration-200 placeholder:text-muted-foreground/45 focus:border-gold/45 focus:ring-2 focus:ring-gold/25"
                rows={2}
              />
              <button
                onClick={() => {
                  onReview(rating, comment);
                  setOpen(false);
                  setComment("");
                }}
                className="w-full cursor-pointer rounded-xl gradient-gold px-4 py-2.5 text-[11.5px] font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-200 hover:brightness-[1.06] press"
              >
                إرسال التقييم
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------- OFFERS -------- */
function OffersList() {
  const offers = useQuery<Offer[]>({
    queryKey: ["offers", "all-active"],
    queryFn: async () => {
      const { data } = await supabase.from("offers").select("*").eq("is_active", true);
      return (data ?? []) as Offer[];
    },
  });
  if (offers.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (!offers.data?.length) return <Empty title="لا توجد عروض" subtitle="تابعنا للجديد" />;
  return (
    <div className="space-y-3.5">
      <SectionTitle eyebrow="لفترة محدودة">كل العروض</SectionTitle>
      <div className="space-y-3">
        {offers.data.map((o, i) => (
          <article
            key={o.id}
            className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated"
            style={{ animationDelay: `${0.04 * i}s` }}
          >
            <span aria-hidden className="absolute inset-y-0 start-0 w-[3px] gradient-gold" />
            {o.discount_percent != null && (
              <div className="relative grid w-[68px] shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25">
                <span
                  aria-hidden
                  className="absolute inset-y-1.5 start-0 w-px border-s border-dashed border-gold/40"
                />
                <div className="text-center">
                  <div className="font-display text-[1.55rem] font-black leading-none tnum">
                    {o.discount_percent}
                    <span className="text-[0.6rem] font-extrabold">٪</span>
                  </div>
                  <div className="mt-1 text-[8.5px] font-bold opacity-70">خصم</div>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex items-start gap-2">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" strokeWidth={1.7} />
                <h3 className="font-display text-[0.95rem] font-extrabold leading-snug text-foreground">
                  {o.title}
                </h3>
              </div>
              {o.description && (
                <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted-foreground">
                  {o.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* -------- PROFILE -------- */
function ProfileView({ settings }: { settings: Settings | undefined }) {
  const auth = useAuth();
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState()
      .then(setPush)
      .catch(() => setPush(null));
  }, []);

  const togglePush = async () => {
    if (!push || busy) return;
    setBusy(true);
    try {
      const next = push.subscribed
        ? await disablePushNotifications()
        : await enablePushNotifications();
      setPush(next);
      if (next.subscribed)
        toast.success("تم تفعيل الإشعارات", { description: "سنذكرك بموعدك قبل وقت كافٍ" });
      else if (next.permission === "denied") toast.error("الإشعارات محظورة من إعدادات المتصفح");
      else toast.message("تم إيقاف الإشعارات");
    } catch {
      toast.error("تعذّر تحديث إعدادات الإشعارات");
    } finally {
      setBusy(false);
    }
  };

  const whatsapp = settings?.whatsapp
    ? buildWhatsAppLink(settings.whatsapp, `مرحباً ${settings.shop_name}، أريد الاستفسار عن موعد.`)
    : null;

  return (
    <div className="space-y-4">
      <div className="panel-ink grain animate-fade-in-up p-5">
        <span aria-hidden className="absolute inset-x-5 top-0 h-px gold-rule" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl gradient-gold font-display text-[1.6rem] font-black text-gold-foreground shadow-glow-gold">
            {auth.profile?.full_name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow text-ink-foreground/55">بطاقة العميل</div>
            <div className="mt-1 truncate font-display text-[1.15rem] font-extrabold tracking-tight text-ink-foreground">
              {auth.profile?.full_name}
            </div>
            <div
              className="mt-1 font-display text-xs font-bold tnum text-ink-foreground/60"
              dir="ltr"
            >
              {auth.profile?.phone}
            </div>
          </div>
        </div>
      </div>

      {push?.supported && (
        <button
          onClick={togglePush}
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 text-start shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated disabled:opacity-60 animate-fade-in-up press"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center squircle transition-colors duration-300 ${push.subscribed ? "bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25" : "bg-secondary text-muted-foreground"}`}
            >
              {push.subscribed ? (
                <BellRing className="h-5 w-5" strokeWidth={1.6} />
              ) : (
                <BellOff className="h-5 w-5" strokeWidth={1.6} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[0.85rem] font-extrabold text-foreground">
                إشعارات الموعد
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-muted-foreground">
                {busy
                  ? "جارٍ التحديث..."
                  : push.subscribed
                    ? "مُفعّلة — نذكرك عند بدء حلاقك الخدمة"
                    : "فعّلها لتصلك تنبيهات موعدك فوراً"}
              </span>
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${push.subscribed ? "gradient-gold shadow-glow-gold" : "bg-muted-foreground/25"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${push.subscribed ? "start-0.5" : "start-[22px]"}`}
            />
          </span>
        </button>
      )}

      {settings && (
        <div
          className="rounded-2xl border border-border/70 bg-card p-4 shadow-card animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center squircle bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25">
              <Store className="h-4 w-4" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <div className="eyebrow text-accent-foreground">تواصل معنا</div>
              <div className="mt-0.5 truncate font-display text-[0.88rem] font-extrabold text-foreground">
                {settings.shop_name}
              </div>
            </div>
          </div>
          {settings.address && (
            <div className="mt-3 flex items-start gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
              <span>{settings.address}</span>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 text-xs font-bold text-foreground transition-all duration-200 hover:bg-success/18 press"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.8} /> واتساب
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`tel:${digitsOnly(settings.whatsapp)}`}
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-xs font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground press"
              >
                <Phone className="h-4 w-4" strokeWidth={1.6} /> اتصال
              </a>
            )}
            {settings.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-xs font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground press"
              >
                <Navigation className="h-4 w-4" strokeWidth={1.6} /> الموقع
              </a>
            )}
          </div>
          {(settings.facebook || settings.instagram || settings.tiktok) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border/55 pt-3">
              {settings.facebook && <SocialBtn href={settings.facebook} label="فيسبوك" />}
              {settings.instagram && <SocialBtn href={settings.instagram} label="انستجرام" />}
              {settings.tiktok && <SocialBtn href={settings.tiktok} label="تيك توك" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SocialBtn({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="press rounded-full border border-border/70 bg-secondary px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
    >
      {label}
    </a>
  );
}

function SectionTitle({
  children,
  eyebrow,
  action,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow text-accent-foreground">{eyebrow}</div>}
        <h2 className="mt-1 font-display text-[1.05rem] font-extrabold tracking-tight text-foreground">
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/15 p-10 text-center">
      <div className="font-display text-sm font-extrabold text-foreground">{title}</div>
      <div className="mt-1.5 text-xs font-medium text-muted-foreground">{subtitle}</div>
    </div>
  );
}

/* Bottom navigation moved to src/components/customer/CustomerBottomNav.tsx (reference design). */
