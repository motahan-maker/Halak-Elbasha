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
import { EmptyState } from "@/components/ui/brand";
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
      className="flex min-h-screen flex-col bg-background pb-28 text-foreground"
    >
      {/* Header for non-home pages */}
      {!isHome && (
        <header className="sticky top-0 z-30 glass">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]">
                <Scissors className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-[15px] font-bold text-foreground">
                  {settings.data?.shop_name ?? "حلاق الباشا"}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="truncate text-[11px] font-semibold text-muted-foreground">
                    مرحباً، {auth.profile?.full_name ?? "صديقنا"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                aria-label="خروج"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:text-destructive press"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
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

      {/* Luxury Floating Pill Navigation */}
      <CustomerBottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

/* -------- HOME TAB -------- */
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
    <div className="space-y-6 pb-2">
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

/* -------- BOOKING PROGRESSIVE FLOW (UX System) -------- */
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
      {/* Top Header & Progress */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "service" || step === "success") onDone();
            else goBack();
          }}
          aria-label="رجوع"
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-foreground transition-all duration-200 hover:border-foreground/40 press"
        >
          <ChevronLeft className="h-4.5 w-4.5 rotate-180" strokeWidth={2} />
        </button>

        {step !== "success" ? (
          <>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[#111111] transition-all duration-300 dark:bg-[#F6F1E8]"
                style={{ width: `${((stepIndex + 1) / 5) * 100}%` }}
              />
            </div>
            <span className="shrink-0 font-display text-[11px] font-bold tnum text-muted-foreground">
              {stepIndex + 1} / 5
            </span>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Step Content */}
      <div key={step} className="animate-fade-in">
        {/* Step 1: Services */}
        {step === "service" && (
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-[1.3rem] font-black text-foreground">
                اختر الخدمة
              </h2>
              <p className="mt-0.5 font-display text-xs text-muted-foreground">
                حدد الخدمة التي ترغب بالحصول عليها
              </p>
            </div>

            <div className="space-y-2.5">
              {services.data?.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    goNext("barber");
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-elevated dark:hover:border-[#F6F1E8] press"
                  style={{ animationDelay: `${0.03 * i}s` }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EFE8DC] text-[#111111] dark:bg-[#222222] dark:text-[#F6F1E8]">
                      <Scissors className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[0.95rem] font-bold text-foreground">
                        {s.name}
                      </div>
                      {s.description && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {s.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="font-display text-[1.1rem] font-black tnum text-foreground">
                      {s.price}
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground">ج.م</div>
                  </div>
                </button>
              ))}

              {!services.data?.length && (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                  لا توجد خدمات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Barber Selection */}
        {step === "barber" && (
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-[1.3rem] font-black text-foreground">
                اختر الحلاق
              </h2>
              <p className="mt-0.5 font-display text-xs text-muted-foreground">
                اختر الحلاق المفضل أو المتاح للبدء فوراً
              </p>
            </div>

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
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-elevated dark:hover:border-[#F6F1E8] press"
                    style={{ animationDelay: `${0.03 * i}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#111111] font-display text-base font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111]">
                        {b.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display text-[0.95rem] font-bold text-foreground">
                            {b.name}
                          </span>
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
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {b.specialization || "حلاق محترف"}
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Step 3: Date Selection */}
        {step === "date" && (
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-[1.3rem] font-black text-foreground">
                اختر التاريخ
              </h2>
              <p className="mt-0.5 font-display text-xs text-muted-foreground">
                اختر اليوم المناسب لموعدك
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {dates.map((d) => {
                const isSelected = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    disabled={!d.available}
                    onClick={() => {
                      setDate(d.iso);
                      goNext("time");
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all duration-200 ${
                      !d.available
                        ? "cursor-not-allowed border-border/40 bg-secondary/40 opacity-40"
                        : isSelected
                          ? "cursor-pointer border-[#111111] bg-[#111111] text-[#FFFFFF] shadow-card dark:border-[#F6F1E8] dark:bg-[#F6F1E8] dark:text-[#111111] press"
                          : d.isToday
                            ? "cursor-pointer border-border bg-[#FFFFFF] shadow-card hover:border-[#111111] dark:bg-[#141414] press"
                            : "cursor-pointer border-border bg-[#FFFFFF] shadow-card hover:border-[#111111] dark:bg-[#141414] press"
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75">
                      {d.isToday ? "اليوم" : ARABIC_DAYS[d.date.getDay()]}
                    </div>
                    <div className="mt-1 font-display text-[1.45rem] font-black leading-none tnum">
                      {d.date.getDate()}
                    </div>
                    <div className="mt-1 text-[10px] font-medium opacity-70">
                      {arabicShortDate(d.date).split(" ").slice(-1)[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Time Slot Selection */}
        {step === "time" && (
          <div className="space-y-3">
            <div>
              <h2 className="font-display text-[1.3rem] font-black text-foreground">
                اختر الوقت
              </h2>
              <p className="mt-0.5 font-display text-xs text-muted-foreground">
                اختر الفترة الزمنية المناسبة
              </p>
            </div>

            {slots.length === 0 || !hasFreeSlot ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <div className="font-display text-sm font-bold text-foreground">
                  لا توجد مواعيد متاحة في هذا اليوم
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  اختر يوماً آخر أو حلاقاً آخر
                </div>
                <button
                  onClick={() => setStep("date")}
                  className="mt-4 rounded-xl border border-border bg-secondary px-4 py-2 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
                >
                  اختر تاريخاً آخر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {slots.map((s) => {
                  const disabled = s.kind !== "available";
                  const isSelected = time === s.time;
                  return (
                    <button
                      key={s.time}
                      disabled={disabled}
                      onClick={() => {
                        setTime(s.time);
                        goNext("confirm");
                      }}
                      className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-200 ${
                        disabled
                          ? "cursor-not-allowed border-border/40 bg-secondary/50 text-muted-foreground/50"
                          : isSelected
                            ? "cursor-pointer border-[#111111] bg-[#111111] text-[#FFFFFF] shadow-sm dark:border-[#F6F1E8] dark:bg-[#F6F1E8] dark:text-[#111111] press"
                            : "cursor-pointer border-border bg-card text-foreground shadow-card hover:border-[#111111] hover:shadow-elevated dark:hover:border-[#F6F1E8] press"
                      }`}
                    >
                      <span className="font-display text-[0.95rem] font-bold tnum">
                        {s.label}
                      </span>
                      {disabled && (
                        <span className="mt-0.5 text-[8.5px] font-semibold">
                          {s.kind === "booked"
                            ? "محجوز"
                            : s.kind === "break"
                              ? "استراحة"
                              : "انتهى"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {step === "confirm" && service && barber && date && time && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-[1.3rem] font-black text-foreground">
                تأكيد بيانات الحجز
              </h2>
              <p className="mt-0.5 font-display text-xs text-muted-foreground">
                راجع تفاصيل الموعد قبل التأكيد
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-3xl bg-[#111111] p-5 text-[#FFFFFF] shadow-luxe dark:bg-[#141414]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-[#8A857D]">الخدمة المطلوبة</div>
                  <div className="mt-1 font-display text-[1.15rem] font-extrabold text-[#FFFFFF]">
                    {service.name}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-display text-[1.6rem] font-black leading-none tnum text-[#FFFFFF]">
                    {service.price}
                  </div>
                  <div className="mt-0.5 text-[9px] font-bold text-[#8A857D]">جنيه مصري</div>
                </div>
              </div>

              <div className="my-4 border-t border-white/10" />

              <div className="grid grid-cols-2 gap-3 text-[0.85rem]">
                <div>
                  <div className="text-[10px] font-bold text-[#8A857D]">الحلاق</div>
                  <div className="mt-0.5 font-display font-bold text-[#FFFFFF]">{barber.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8A857D]">الوقت</div>
                  <div className="mt-0.5 font-display font-bold tnum text-[#FFFFFF]">
                    {slots.find((s) => s.time === time)?.label ?? time}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#8A857D]">التاريخ</div>
                <div className="mt-0.5 font-display font-bold text-[#FFFFFF]">{arabicDate(date)}</div>
              </div>
            </div>

            {/* Customer Details Card */}
            <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between p-3.5 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" strokeWidth={1.8} />
                  الاسم
                </span>
                <span className="font-display text-[0.9rem] font-bold text-foreground">
                  {auth.profile?.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" strokeWidth={1.8} />
                  الجوال
                </span>
                <span className="font-display text-[0.9rem] font-bold tnum text-foreground" dir="ltr">
                  {auth.profile?.phone}
                </span>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending}
              className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#111111] py-3.5 font-display text-[1rem] font-bold text-[#FFFFFF] shadow-card transition-all duration-200 hover:bg-[#262626] active:bg-[#000000] disabled:opacity-50 dark:bg-[#F6F1E8] dark:text-[#111111] dark:hover:bg-[#FFFFFF] press"
            >
              {confirm.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جارٍ تأكيد الحجز...
                </>
              ) : (
                <>
                  <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
                  تأكيد الحجز
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 6: Success Screen */}
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
أؤكد لكم حجزي:
رقم الحجز: ${booking.booking_number}
الاسم: ${auth.profile?.full_name}
الخدمة: ${booking.service_name}
التاريخ: ${arabicDate(booking.booking_date)}
الوقت: ${booking.booking_time}`;
  const wa = buildWhatsAppLink(settings.whatsapp, waMessage);
  const digits = digitsOnly(settings.whatsapp);

  return (
    <div className="animate-fade-in space-y-5 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#111111] text-[#FFFFFF] shadow-luxe dark:bg-[#F6F1E8] dark:text-[#111111]">
        <Check className="h-10 w-10" strokeWidth={2.6} />
      </div>

      <div>
        <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          تم التأكيد بنجاح
        </span>
        <h2 className="mt-1 font-display text-[1.6rem] font-black text-foreground">
          موعدك محجوز الآن
        </h2>
      </div>

      {/* Booking Code Card */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="text-[10px] font-bold text-muted-foreground">رقم الحجز الخاص بك</div>
        <div className="mt-1.5 font-display text-[2.2rem] font-black leading-none tnum text-foreground">
          {booking.booking_number}
        </div>
        <div className="my-3.5 border-t border-border/70" />
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>الحلاق: {barberName}</span>
          <span className="tnum text-foreground">{booking.service_price} ج.م</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-[#111111] py-3 font-display text-[0.95rem] font-bold text-[#FFFFFF] shadow-card transition-all duration-200 hover:bg-[#262626] dark:bg-[#F6F1E8] dark:text-[#111111] press"
        >
          <MessageCircle className="h-4.5 w-4.5" strokeWidth={1.8} />
          تأكيد عبر واتساب
        </a>
        {digits.length > 5 && (
          <a
            href={`tel:${digits}`}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-display text-[0.95rem] font-bold text-foreground shadow-card transition-all duration-200 hover:border-foreground press"
          >
            <Phone className="h-4.5 w-4.5" strokeWidth={1.8} />
            اتصال بالصالون
          </a>
        )}
      </div>

      <button
        onClick={onDone}
        className="cursor-pointer py-1 font-display text-sm font-bold text-muted-foreground hover:text-foreground press"
      >
        العودة للرئيسية
      </button>
    </div>
  );
}

/* -------- BOOKINGS LIST TAB -------- */
function BookingsList() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

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
      </div>
    );
  }

  const ts = (b: Booking) => new Date(`${b.booking_date}T${b.booking_time}`).getTime();
  const upcoming = (list.data ?? [])
    .filter((b) => b.status === "booked")
    .sort((a, b) => ts(a) - ts(b));
  const past = (list.data ?? [])
    .filter((b) => b.status !== "booked")
    .sort((a, b) => ts(b) - ts(a));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[1.2rem] font-black text-foreground">حجوزاتي</h2>
      </div>

      {/* Segmented control */}
      <div className="flex rounded-full border border-border bg-secondary p-1">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 rounded-full py-2 font-display text-xs font-bold transition-all duration-200 press ${
            activeTab === "upcoming"
              ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          المواعيد القادمة ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 rounded-full py-2 font-display text-xs font-bold transition-all duration-200 press ${
            activeTab === "history"
              ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          السابقة ({past.length})
        </button>
      </div>

      {/* List */}
      {activeTab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.map((b) => (
            <BookingCard
              key={b.id}
              b={b}
              inService={!!b.started_at && !b.completed_at}
              onCancel={() => cancel.mutate(b.id)}
              isCancelling={cancel.isPending && cancel.variables === b.id}
            />
          ))}
          {upcoming.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" strokeWidth={1.8} />}
              title="لا توجد مواعيد قادمة"
              hint="احجز موعدك القادم مع حلاقك المفضل"
            />
          )}
        </div>
      )}

      {activeTab === "history" && (
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
          {past.length === 0 && (
            <EmptyState
              icon={<Clock className="h-6 w-6" strokeWidth={1.8} />}
              title="لا يوجد سجل سابق"
              hint="ستظهر هنا المواعيد السابقة والمكتملة"
            />
          )}
        </div>
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
  const [openReview, setOpenReview] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const getStatus = () => {
    if (inService) return { label: "جارٍ الخدمة الآن", tone: "warn" as const };
    if (b.status === "completed") return { label: "مكتمل", tone: "success" as const };
    if (String(b.status).startsWith("cancelled"))
      return { label: "ملغي", tone: "danger" as const };
    return { label: "مؤكد", tone: "gold" as const };
  };
  const { label: statusLabel, tone } = getStatus();

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[0.95rem] font-bold text-foreground">
            {b.service_name}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
              {arabicDate(b.booking_date)}
            </span>
            <span className="flex items-center gap-1.5 tnum">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
              {formatTime(b.booking_time)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`chip ${
              tone === "gold"
                ? "chip-gold"
                : tone === "success"
                  ? "chip-success"
                  : tone === "warn"
                    ? "chip-warn"
                    : "chip-danger"
            }`}
          >
            {inService && <CurvedWorkingAnimation />}
            {statusLabel}
          </span>
          <span className="tnum font-display text-[10px] font-bold text-muted-foreground">
            #{b.booking_number}
          </span>
        </div>
      </div>

      {inService && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#B45309]/20 bg-[#B45309]/10 p-3 text-xs font-bold text-[#B45309]">
          <span className="h-2 w-2 rounded-full bg-[#B45309] animate-pulse" />
          <span>حلاقك بدأ خدمتك الآن — نتمنى لك تجربة مميزة!</span>
        </div>
      )}

      {onCancel && (
        <div className="mt-3.5 border-t border-border/70 pt-3">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full cursor-pointer rounded-xl border border-destructive/30 bg-destructive/10 py-2.5 font-display text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/20 press"
            >
              إلغاء الموعد
            </button>
          ) : (
            <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-center">
              <p className="text-xs font-bold text-destructive">
                هل أنت متأكد من إلغاء الموعد؟
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isCancelling}
                  onClick={() => {
                    onCancel();
                    setConfirmCancel(false);
                  }}
                  className="flex-1 cursor-pointer rounded-xl bg-destructive py-2 font-display text-xs font-bold text-white press disabled:opacity-50"
                >
                  {isCancelling ? "جارٍ الإلغاء..." : "نعم، إلغاء"}
                </button>
                <button
                  disabled={isCancelling}
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-border bg-card py-2 font-display text-xs font-bold text-foreground press"
                >
                  تراجع
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canReview && onReview && (
        <div className="mt-3 border-t border-border/70 pt-3">
          {!openReview ? (
            <button
              onClick={() => setOpenReview(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-2.5 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
            >
              <Star className="h-4 w-4" strokeWidth={1.8} />
              قيّم الخدمة
            </button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className="cursor-pointer transition-transform duration-150 active:scale-90"
                  >
                    <Star
                      className={`h-6 w-6 ${n <= rating ? "fill-[#111111] text-[#111111] dark:fill-[#F6F1E8] dark:text-[#F6F1E8]" : "text-muted-foreground/30"}`}
                      strokeWidth={n <= rating ? 0 : 1.5}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="رأيك في الخدمة والحلاق..."
                className="w-full rounded-xl border border-border bg-card p-3 font-display text-xs outline-none focus:border-foreground"
                rows={2}
              />
              <button
                onClick={() => {
                  onReview(rating, comment);
                  setOpenReview(false);
                }}
                className="w-full cursor-pointer rounded-xl bg-[#111111] py-2.5 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press"
              >
                إرسال التقييم
              </button>
            </div>
          )}
        </div>
      )}

      {alreadyReviewed && (
        <div className="mt-3 border-t border-border/70 pt-2.5 text-center text-xs font-semibold text-muted-foreground">
          شكراً لك، تم إرسال تقييمك لهذا الموعد
        </div>
      )}
    </div>
  );
}

/* -------- OFFERS TAB -------- */
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

  if (!offers.data?.length) {
    return (
      <EmptyState
        icon={<Tag className="h-6 w-6" strokeWidth={1.8} />}
        title="لا توجد عروض حالياً"
        hint="تابعنا لمعرفة أحدث العروض والخصومات"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-[1.2rem] font-black text-foreground">جميع العروض</h2>
      <div className="space-y-3">
        {offers.data.map((o) => (
          <article
            key={o.id}
            className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
          >
            {o.discount_percent != null && (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#111111] font-display text-[1.1rem] font-black text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111]">
                <span>
                  {o.discount_percent}
                  <span className="text-[0.65rem] font-bold">٪</span>
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[1rem] font-bold text-foreground">{o.title}</h3>
              {o.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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

/* -------- PROFILE TAB -------- */
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
      if (next.subscribed) toast.success("تم تفعيل الإشعارات بنجاح");
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
      {/* Profile Header */}
      <div className="rounded-3xl bg-[#111111] p-6 text-[#FFFFFF] shadow-luxe dark:bg-[#141414]">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#FFFFFF] font-display text-[1.6rem] font-black text-[#111111]">
            {auth.profile?.full_name?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-[#8A857D]">حساب العميل</div>
            <div className="mt-1 truncate font-display text-[1.2rem] font-bold text-[#FFFFFF]">
              {auth.profile?.full_name}
            </div>
            <div className="mt-0.5 font-display text-xs text-[#8A857D]" dir="ltr">
              {auth.profile?.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Setting */}
      {push?.supported && (
        <button
          onClick={togglePush}
          disabled={busy}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 text-start shadow-card transition-all duration-200 hover:border-foreground press"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground">
              {push.subscribed ? (
                <BellRing className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
              )}
            </div>
            <div className="min-w-0">
              <span className="block font-display text-sm font-bold text-foreground">
                إشعارات المواعيد
              </span>
              <span className="block text-xs text-muted-foreground">
                {push.subscribed ? "مُفعّلة — تصلك تنبيهات حجزك" : "فعّلها لتصلك التنبيهات"}
              </span>
            </div>
          </div>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              push.subscribed ? "bg-[#111111] dark:bg-[#F6F1E8]" : "bg-secondary"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                push.subscribed ? "start-0.5" : "start-[22px]"
              }`}
            />
          </span>
        </button>
      )}

      {/* Shop Info Card */}
      {settings && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2.5">
            <Store className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="font-display text-sm font-bold text-foreground">
              {settings.shop_name}
            </h3>
          </div>

          {settings.address && (
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
              <span>{settings.address}</span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary px-3 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                واتساب
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`tel:${digitsOnly(settings.whatsapp)}`}
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary px-3 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
              >
                <Phone className="h-4 w-4" strokeWidth={1.8} />
                اتصال
              </a>
            )}
            {settings.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary px-3 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
              >
                <Navigation className="h-4 w-4" strokeWidth={1.8} />
                الاتجاهات
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
