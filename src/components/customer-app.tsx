import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonCard, SkeletonWizard } from "@/components/ui/skeleton";
import { generateSlots, formatTime, type Slot } from "@/lib/slots";
import { arabicDate, arabicShortDate, isoDate, ARABIC_DAYS, buildWhatsAppLink } from "@/lib/format";
import { cancelBookingByCustomer, notifyBarbers } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  Scissors,
  CalendarDays,
  Clock,
  User,
  Phone,
  Star,
  Tag,
  Home,
  LogOut,
  ChevronLeft,
  Check,
  Sparkles,
  MessageCircle,
} from "lucide-react";

type Tab = "home" | "bookings" | "offers" | "profile";
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

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center squircle gradient-luxe text-white shadow-luxe border border-white/20">
              <Scissors className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-bold text-foreground">
                  {settings.data?.shop_name ?? "حلاق الباشا"}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  مفتوح
                </span>
              </div>
              <div className="truncate text-[11px] font-semibold text-muted-foreground mt-0.5">
                مرحباً، {auth.profile?.full_name ?? "صديقنا"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="خروج"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-glow-primary active:scale-90"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-3">
        {tab === "home" && <CustomerHome settings={settings.data} onBook={() => setTab("home")} />}
        {tab === "bookings" && <BookingsList />}
        {tab === "offers" && <OffersList />}
        {tab === "profile" && <ProfileView settings={settings.data} />}
      </main>

      {/* Bottom Nav */}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

/* -------- HOME (includes wizard) -------- */
function CustomerHome({
  settings,
  onBook,
}: {
  settings: Settings | undefined;
  onBook: () => void;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const offers = useQuery<Offer[]>({
    queryKey: ["offers", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as Offer[];
    },
  });

  if (wizardOpen) {
    if (!settings) return <SkeletonWizard />;
    return (
      <BookingWizard
        settings={settings}
        onDone={() => {
          setWizardOpen(false);
          onBook();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0052D4] via-[#4364F7] to-[#6FB1FC] dark:from-[#0B132B] dark:via-[#1C2541] dark:to-[#3A506B] p-6.5 text-white shadow-luxe border border-white/20 animate-fade-in-up">
        {/* Subtle ambient lighting glows */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/25 backdrop-blur-md px-3.5 py-1 text-[11px] font-extrabold tracking-wider text-amber-300 border border-white/20 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> تجربة فاخرة ومعتمدة
          </div>
          <h1 className="mt-3.5 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-md">
            يسعدنا خدمتك في
            <br />
            <span className="text-white drop-shadow-lg">{settings?.shop_name ?? "حلاق الباشا"}</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/95 font-semibold drop-shadow-sm">احجز موعدك بضغطة واحدة. مواعيدنا مرتبة ودقيقة.</p>
          <button
            onClick={() => setWizardOpen(true)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-blue-950 shadow-xl shadow-black/20 transition-all duration-300 hover:bg-white/95 hover:scale-[1.01] active:scale-[0.97]"
          >
            <CalendarDays className="h-4.5 w-4.5 text-blue-600" strokeWidth={2.2} /> ابدأ الحجز الآن
          </button>
        </div>
      </section>

      {/* Offers */}
      {(offers.data?.length ?? 0) > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <h2 className="ios-grouped-section-title">العروض الحالية</h2>
          <div className="ios-grouped-card">
            {offers.data!.slice(0, 3).map((o, i) => (
              <div
                key={o.id}
                className="ios-list-item"
                style={{ animationDelay: `${0.04 * (i + 1)}s` }}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="grid h-9.5 w-9.5 shrink-0 place-items-center squircle bg-primary/10 text-primary border border-primary/15">
                    <Tag className="h-4.5 w-4.5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-foreground">{o.title}</div>
                    {o.description && (
                      <div className="truncate text-xs text-muted-foreground mt-0.5">{o.description}</div>
                    )}
                  </div>
                </div>
                {o.discount_percent != null && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
                    -{o.discount_percent}٪
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Barbers */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
        <BarbersShowcase />
      </div>
    </div>
  );
}

function BarbersShowcase() {
  const barbers = useQuery<(Barber & { avg: number; cnt: number })[]>({
    queryKey: ["barbers", "showcase"],
    queryFn: async () => {
      const { data: list } = await supabase.from("barbers").select("*").eq("is_active", true);
      const ids = (list ?? []).map((b) => b.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("barber_id, rating")
        .in("barber_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const stats: Record<string, { sum: number; cnt: number }> = {};
      (reviews ?? []).forEach((r) => {
        stats[r.barber_id] ??= { sum: 0, cnt: 0 };
        stats[r.barber_id].sum += r.rating;
        stats[r.barber_id].cnt += 1;
      });
      return (list ?? []).map((b) => ({
        ...(b as Barber),
        avg: stats[b.id] ? stats[b.id].sum / stats[b.id].cnt : 0,
        cnt: stats[b.id]?.cnt ?? 0,
      }));
    },
  });
  if (barbers.isLoading) {
    return (
      <div className="space-y-2.5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (!barbers.data?.length) return null;
  return (
    <section>
      <h2 className="ios-grouped-section-title">فريق الحلاقين</h2>
      <div className="grid grid-cols-2 gap-2">
        {barbers.data.map((b, i) => (
          <div
            key={b.id}
            className="rounded-xl border border-border bg-card p-4 shadow-card animate-scale-in transition-all duration-300 hover:shadow-elevated active:scale-[0.98]"
            style={{ animationDelay: `${0.04 * i}s` }}
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-[17px] font-bold text-primary">
              {b.name.charAt(0)}
            </div>
            <div className="mt-3 truncate text-sm font-bold text-foreground">{b.name}</div>
            <div className="truncate text-xs text-muted-foreground mt-0.5">
              {b.specialization || "حلاق"}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={0} />
              <span className="font-bold text-foreground">{b.avg ? b.avg.toFixed(1) : "جديد"}</span>
              {b.cnt > 0 && <span>({b.cnt} تقييم)</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------- WIZARD -------- */
function toMinTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

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
  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = isoDate(today);
    const out: { iso: string; date: Date; available: boolean; isToday: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = isoDate(d);
      out.push({
        iso,
        date: d,
        isToday: iso === todayIso,
        available: iso === todayIso && (workingDays ?? []).includes(d.getDay()),
      });
    }
    return out;
  }, [workingDays]);

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
    const cfg = {
      start_time: barber.start_time ?? settings?.start_time ?? "10:00",
      end_time: barber.end_time ?? settings?.end_time ?? "23:00",
      slot_minutes: barber.slot_minutes ?? settings?.slot_minutes ?? 40,
    };
    const allSlots = generateSlots(cfg, bookedQ.data ?? []);
    const today = isoDate(new Date());
    if (date === today) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const startMin = toMinTime(cfg.start_time);
      const endMin = toMinTime(cfg.end_time);
      const isOvernight = startMin >= endMin;
      return allSlots.map((s) => {
        if (s.kind === "available") {
          const slotMin = toMinTime(s.time);
          let isPast = false;
          if (isOvernight) {
            if (nowMin >= startMin) {
              isPast = slotMin >= startMin && slotMin < nowMin;
            } else {
              isPast = slotMin >= startMin || slotMin < nowMin;
            }
          } else {
            isPast = slotMin < nowMin;
          }
          if (isPast) return { ...s, kind: "past" as const };
        }
        return s;
      });
    }
    return allSlots;
  }, [date, barber, settings, bookedQ.data]);

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
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (step === "service" || step === "success") onDone();
            else goBack();
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground transition-all duration-200 hover:bg-muted active:scale-90"
        >
          <ChevronLeft className="h-4.5 w-4.5 rotate-180" strokeWidth={2} />
        </button>
        {step !== "success" && (
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-[4px] rounded-full transition-all duration-300 ease-out ${
                  i <= stepIndex ? "w-6 bg-primary" : i === stepIndex + 1 ? "w-4 bg-muted" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        )}
        <div className="w-9" />
      </div>

      {/* Step Content */}
      <div key={step} className="wizard-step-enter">
        {step === "service" && (
          <div>
            <h2 className="mb-3.5 px-1 text-2xl font-bold tracking-tight">اختر الخدمة</h2>
            <div className="ios-grouped-card">
              {services.data?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    goNext("barber");
                  }}
                  className="ios-list-item w-full text-right flex items-center gap-3.5 focus:bg-secondary/40 active:bg-secondary/60 transition-colors"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Scissors className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">{s.name}</div>
                    {s.description && (
                      <div className="truncate text-xs text-muted-foreground mt-0.5">{s.description}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-sm font-bold text-primary">{s.price} ج.م</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "barber" && (
          <div>
            <h2 className="mb-3.5 px-1 text-2xl font-bold tracking-tight">اختر الحلاق</h2>
            {!barbers.data?.length && (
              <p className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
                لم يقم المدير بإضافة حلاقين بعد.
              </p>
            )}
            <div className="ios-grouped-card">
              {barbers.data?.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBarber(b);
                    goNext("date");
                  }}
                  className="ios-list-item w-full text-right flex items-center gap-3.5 focus:bg-secondary/40 active:bg-secondary/60 transition-colors"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {b.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground mt-0.5">
                      {b.specialization || "حلاق"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "date" && (
          <div>
            <h2 className="mb-3.5 px-1 text-2xl font-bold tracking-tight">اختر التاريخ</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  disabled={!d.available}
                  onClick={() => {
                    setDate(d.iso);
                    goNext("time");
                  }}
                  className={`relative rounded-2xl border p-3.5 text-center transition-all duration-200 active:scale-95 flex flex-col items-center justify-center ${
                    !d.available
                      ? "border-border/50 bg-muted/25 opacity-35 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary/50 shadow-card hover:shadow-elevated"
                  }`}
                >
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {d.isToday ? "اليوم" : ARABIC_DAYS[d.date.getDay()]}
                  </div>
                  <div className="mt-1 text-2xl font-black text-foreground">{d.date.getDate()}</div>
                  <div className="text-[9.5px] font-semibold text-muted-foreground/75 mt-0.5">
                    {arabicShortDate(d.date).split(" ").slice(-1)[0]}
                  </div>
                  {d.isToday && d.available && (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "time" && (
          <div>
            <h2 className="mb-3.5 px-1 text-2xl font-bold tracking-tight">اختر الوقت</h2>
            {slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <div className="text-base font-bold text-foreground">لا توجد مواعيد متاحة</div>
                <div className="mt-1 text-xs text-muted-foreground">لا يوجد وقت متاح لهذا اليوم</div>
                <button
                  onClick={() => setStep("date")}
                  className="mt-4 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-95"
                >
                  اختر تاريخاً آخر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {slots.map((s) => {
                  const disabled = s.kind !== "available";
                  const styles =
                    s.kind === "available"
                      ? "border-border bg-card text-foreground hover:border-primary/50 shadow-card active:scale-[0.96]"
                      : s.kind === "booked"
                        ? "border-border/40 bg-muted/30 text-muted-foreground/40"
                        : "border-border/40 bg-muted/30 text-muted-foreground/30";
                  return (
                    <button
                      key={s.time}
                      disabled={disabled}
                      onClick={() => {
                        setTime(s.time);
                        goNext("confirm");
                      }}
                      className={`rounded-2xl border p-3 text-xs font-bold transition-all duration-200 flex items-center justify-between ${styles} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <span className="truncate">{s.label}</span>
                      {s.kind === "available" && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-sm" />
                      )}
                      {s.kind === "booked" && <span className="text-[9px] font-medium opacity-60">محجوز</span>}
                      {s.kind === "past" && <span className="text-[9px] font-medium opacity-55">منتهي</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "confirm" && service && barber && date && time && (
          <div className="space-y-4">
            <h2 className="px-1 text-2xl font-bold tracking-tight">تأكيد الحجز</h2>
            <div className="ios-grouped-card">
              <AppleRow label="الاسم" value={auth.profile?.full_name ?? ""} icon={<User className="h-4 w-4" strokeWidth={1.5} />} />
              <AppleRow label="الجوال" value={auth.profile?.phone ?? ""} icon={<Phone className="h-4 w-4" strokeWidth={1.5} />} />
              <AppleRow label="الخدمة" value={`${service.name} • ${service.price} ج.م`} icon={<Scissors className="h-4 w-4" strokeWidth={1.5} />} />
              <AppleRow label="الحلاق" value={barber.name} icon={<User className="h-4 w-4" strokeWidth={1.5} />} />
              <AppleRow label="التاريخ" value={arabicDate(date)} icon={<CalendarDays className="h-4 w-4" strokeWidth={1.5} />} />
              <AppleRow label="الوقت" value={slots.find((s) => s.time === time)?.label ?? time} icon={<Clock className="h-4 w-4" strokeWidth={1.5} />} />
            </div>
            <button
              onClick={() => confirm.mutate()}
              disabled={confirm.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe transition-all duration-200 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
              {confirm.isPending ? "جارٍ التأكيد..." : "تأكيد الحجز"}
            </button>
          </div>
        )}

        {step === "success" && created && (
          <SuccessCard booking={created} settings={settings} onDone={onDone} />
        )}
      </div>
    </div>
  );
}

function AppleRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="ios-list-item flex items-center justify-between gap-3 bg-card">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      <div className="truncate text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function SuccessCard({
  booking,
  settings,
  onDone,
}: {
  booking: Booking;
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
  return (
    <div className="space-y-5 text-center animate-spring-in">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 animate-success-bounce border border-emerald-400/30">
        <Check className="h-10 w-10 text-white stroke-[3]" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-foreground">تم الحجز بنجاح</h2>
      <div className="rounded-2xl glass-card p-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">رقم الحجز</div>
        <div className="mt-1 text-3xl font-black text-gradient-gold">{booking.booking_number}</div>
      </div>
      <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">
        يرجى الحضور قبل موعدك بـ ٥ دقائق.
        <br />
        في حالة التأخير أكثر من ١٠ دقائق قد يتم إلغاء الموعد تلقائياً.
      </p>
      <a
        href={wa}
        target="_blank"
        rel="noopener"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#34C759] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#34C759]/20 transition-all duration-300 hover:brightness-105 hover:shadow-xl active:scale-[0.97]"
      >
        <MessageCircle className="h-4.5 w-4.5" strokeWidth={1.5} /> تأكيد عبر واتساب
      </a>
      <button onClick={onDone} className="text-xs font-semibold text-primary block mx-auto py-1 active:scale-95 transition-transform duration-200">
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
  const upcoming = list.data.filter((b) => b.status === "booked");
  const past = list.data.filter((b) => b.status !== "booked");

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h2 className="ios-grouped-section-title">القادمة</h2>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard key={b.id} b={b} onCancel={() => cancel.mutate(b.id)} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="ios-grouped-section-title">السابقة</h2>
          <div className="space-y-3">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                onReview={(r, c) =>
                  reviewMut.mutate({
                    booking_id: b.id,
                    barber_id: b.barber_id,
                    rating: r,
                    comment: c,
                  })
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
  onCancel,
  onReview,
}: {
  b: Booking;
  onCancel?: () => void;
  onReview?: (rating: number, comment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const getStatusInfo = () => {
    if (b.status === "booked") return { label: "محجوز", cls: "bg-primary/10 text-primary" };
    if (b.status === "completed") return { label: "مكتمل", cls: "bg-success/10 text-success" };
    if (b.status === "cancelled_by_barber") return { label: "ملغي بواسطة الحلاق", cls: "bg-destructive/10 text-destructive" };
    if (b.status === "cancelled_by_customer") return { label: "ملغي بواسطة العميل", cls: "bg-destructive/10 text-destructive" };
    return { label: "ملغي", cls: "bg-destructive/10 text-destructive" };
  };
  const { label: status, cls: statusClass } = getStatusInfo();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-foreground">{b.service_name}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            {arabicDate(b.booking_date)} • {formatTime(b.booking_time)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${statusClass}`}>
            {status}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60">{b.booking_number}</span>
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-3.5 w-full rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-[0.98]"
        >
          إلغاء الحجز
        </button>
      )}
      {onReview && (
        <div className="mt-3">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98]"
            >
              تقييم الخدمة
            </button>
          ) : (
            <div className="space-y-3.5 rounded-xl bg-secondary/35 border border-border/40 p-4 animate-scale-in">
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className="transition-transform duration-150 active:scale-125">
                    <Star
                      className={`h-7 w-7 transition-colors duration-200 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      strokeWidth={n <= rating ? 0 : 1.5}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                placeholder="رأيك يهمنا..."
                className="w-full rounded-xl border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/45"
                rows={2}
              />
              <button
                onClick={() => {
                  onReview(rating, comment);
                  setOpen(false);
                  setComment("");
                }}
                className="w-full rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
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
    <div className="space-y-3">
      {offers.data.map((o, i) => (
        <div
          key={o.id}
          className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in-up transition-all duration-300 hover:shadow-elevated active:scale-[0.98]"
          style={{ animationDelay: `${0.04 * i}s` }}
        >
          <div className="flex items-center justify-between">
            <Tag className="h-6 w-6 text-primary" strokeWidth={1.5} />
            {o.discount_percent != null && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                خصم {o.discount_percent}٪
              </span>
            )}
          </div>
          <div className="mt-3.5 text-base font-bold text-foreground">{o.title}</div>
          {o.description && <div className="mt-1 text-xs text-muted-foreground font-medium leading-relaxed">{o.description}</div>}
        </div>
      ))}
    </div>
  );
}

/* -------- PROFILE -------- */
function ProfileView({ settings }: { settings: Settings | undefined }) {
  const auth = useAuth();
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 text-center shadow-card animate-fade-in-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 border border-primary/20 text-xl font-bold text-primary shadow-sm">
          {auth.profile?.full_name?.charAt(0) ?? "?"}
        </div>
        <div className="mt-3 text-base font-bold text-foreground tracking-tight">{auth.profile?.full_name}</div>
        <div className="text-xs text-muted-foreground font-medium mt-0.5">{auth.profile?.phone}</div>
      </div>
      {settings && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <div className="text-sm font-bold text-foreground">{settings.shop_name}</div>
          {settings.address && (
            <div className="mt-1 text-xs text-muted-foreground font-semibold">{settings.address}</div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {settings.whatsapp && (
              <a
                href={`tel:${settings.whatsapp}`}
                className="rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-95 border border-border/30"
              >
                {settings.whatsapp}
              </a>
            )}
            {settings.facebook && <SocialBtn href={settings.facebook} label="فيسبوك" />}
            {settings.instagram && <SocialBtn href={settings.instagram} label="انستجرام" />}
            {settings.tiktok && <SocialBtn href={settings.tiktok} label="تيك توك" />}
          </div>
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
      className="rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-95 border border-border/30"
    >
      {label}
    </a>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/15 p-10 text-center">
      <div className="text-sm font-bold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground font-medium">{subtitle}</div>
    </div>
  );
}

/* -------- BOTTOM NAV -------- */
function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ["home", "bookings", "offers", "profile"];
  const touchStartX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    const currentIndex = tabs.indexOf(tab);
    if (diff > 0 && currentIndex < tabs.length - 1) {
      onChange(tabs[currentIndex + 1]);
    } else if (diff < 0 && currentIndex > 0) {
      onChange(tabs[currentIndex - 1]);
    }
  }, [tab, onChange, tabs]);

  const items: { t: Tab; label: string; icon: React.ReactNode }[] = [
    { t: "home", label: "الرئيسية", icon: <Home className="h-[20px]" strokeWidth={tab === "home" ? 2.2 : 1.5} /> },
    { t: "bookings", label: "حجوزاتي", icon: <CalendarDays className="h-[20px]" strokeWidth={tab === "bookings" ? 2.2 : 1.5} /> },
    { t: "offers", label: "العروض", icon: <Tag className="h-[20px]" strokeWidth={tab === "offers" ? 2.2 : 1.5} /> },
    { t: "profile", label: "حسابي", icon: <User className="h-[20px]" strokeWidth={tab === "profile" ? 2.2 : 1.5} /> },
  ];
  return (
    <nav
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-x-0 bottom-0 z-40 glass-bottom"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
        {items.map((it) => (
          <button
            key={it.t}
            onClick={() => onChange(it.t)}
            className={`flex flex-col items-center gap-1 py-1.5 text-[9px] font-semibold transition-all duration-300 ${
              tab === it.t
                ? "text-primary scale-105 drop-shadow-sm"
                : "text-muted-foreground/70 active:scale-95 hover:text-foreground"
            }`}
          >
            <div className={`relative transition-all duration-300 ${tab === it.t ? "animate-glow-pulse rounded-full" : ""}`}>
              {it.icon}
              {tab === it.t && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </div>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
