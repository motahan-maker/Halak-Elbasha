import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  cancelBookingByBarber,
  setBarberWorkingStatus,
  startBookingService,
  completeBookingService,
} from "@/lib/admin.functions";
import { disablePushNotifications, enablePushNotifications, getPushState, type PushState } from "@/lib/push";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/brand";
import { CurvedWorkingAnimation } from "@/components/ui/curved-working-animation";
import { arabicDate, isoDate, buildWhatsAppLink } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { toast } from "sonner";
import {
  Phone,
  LogOut,
  Scissors,
  Calendar,
  Check,
  Star,
  XCircle,
  Play,
  MessageCircle,
  CalendarClock,
  History,
  MessageSquareQuote,
  Timer,
  BellRing,
  BellOff,
  Clock,
} from "lucide-react";

type BookingStatus =
  | "booked"
  | "completed"
  | "cancelled"
  | "cancelled_by_customer"
  | "cancelled_by_barber";

interface BookingRow {
  id: string;
  booking_number: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking_id?: string | null;
}

type Tab = "today" | "upcoming" | "history" | "reviews";

let notifInterval: ReturnType<typeof setInterval> | null = null;
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playLoudBeep(freq: number, duration: number) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playAlarmPattern() {
  playLoudBeep(2000, 0.12);
  setTimeout(() => playLoudBeep(2500, 0.12), 150);
  setTimeout(() => playLoudBeep(2000, 0.12), 300);
  setTimeout(() => playLoudBeep(2500, 0.12), 450);
}

function startNotificationLoop() {
  stopNotificationLoop();
  playAlarmPattern();
  let elapsed = 0;
  notifInterval = setInterval(() => {
    elapsed += 2000;
    if (elapsed >= 10000) {
      stopNotificationLoop();
      return;
    }
    playAlarmPattern();
  }, 2000);
}

function stopNotificationLoop() {
  if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
}

let swReady = false;

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    if (!swReady) {
      await navigator.serviceWorker.register("/sw.js");
      swReady = true;
    }
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function sendSwConfig(barberId: string) {
  const reg = await registerServiceWorker();
  const sw = reg?.active ?? navigator.serviceWorker.controller;
  if (!sw) return;
  const { SUPABASE_CONFIG } = await import("@/integrations/supabase/config");
  sw.postMessage({
    type: "CONFIG",
    barberId,
    supabaseUrl: SUPABASE_CONFIG.url,
    supabaseKey: SUPABASE_CONFIG.anonKey,
  });
}

async function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.ready.catch(() => null);
  if (reg?.active) {
    reg.active.postMessage({ type: "SHOW_NOTIFICATION", title, body });
    return;
  }
  try {
    new Notification(title, { body, tag: "new-booking", dir: "rtl", requireInteraction: true });
  } catch {}
}

/** Timestamp of an appointment as a local Date. */
function appointmentTs(b: Pick<BookingRow, "booking_date" | "booking_time">) {
  return new Date(`${b.booking_date}T${b.booking_time}`).getTime();
}

/** Minutes until an appointment; negative once it has passed. */
function minutesUntil(dateIso: string, time: string) {
  return Math.round((appointmentTs({ booking_date: dateIso, booking_time: time }) - Date.now()) / 60000);
}

function humanizeMinutes(diff: number) {
  const abs = Math.abs(diff);
  if (abs <= 1) return "الآن";
  if (abs < 60) return `${abs} دقيقة`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${h} ساعة` : `${h} س ${m} د`;
}

export function BarberApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [, setClock] = useState(0);
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (!auth.user) return;
    registerServiceWorker();
    getPushState()
      .then(setPush)
      .catch(() => setPush(null));
    const resume = () => {
      getAudioCtx();
      document.removeEventListener("click", resume);
    };
    document.addEventListener("click", resume);
    return () => document.removeEventListener("click", resume);
  }, [auth.user]);

  const togglePush = async () => {
    const wasSubscribed = !!push?.subscribed;
    setPushBusy(true);
    try {
      const next = wasSubscribed ? await disablePushNotifications() : await enablePushNotifications();
      setPush(next);
      if (next.subscribed) {
        toast.success("تم تفعيل الإشعارات الفورية");
        getAudioCtx();
      } else if (wasSubscribed) {
        toast.message("تم إيقاف الإشعارات");
      } else if (next.permission === "denied") {
        toast.error("الإشعارات محظورة — فعّلها من إعدادات المتصفح");
      } else {
        toast.error("تعذّر تفعيل الإشعارات");
      }
    } catch (e) {
      console.error("Push toggle error:", e);
      toast.error("تعذّر تحديث إعدادات الإشعارات");
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setClock((c) => c + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const myBarber = useQuery({
    queryKey: ["my-barber", auth.user?.id],
    enabled: !!auth.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("user_id", auth.user!.id)
        .maybeSingle();
      if (error) {
        console.error("myBarber query error:", error);
        return null;
      }
      return data;
    },
  });

  const barberId = myBarber.data?.id;

  useEffect(() => {
    if (barberId) sendSwConfig(barberId);
  }, [barberId]);

  const bookings = useQuery<BookingRow[]>({
    queryKey: ["barber-bookings", barberId],
    enabled: !!barberId,
    // Realtime keeps this fresh; polling is only a slow safety net.
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("barber_id", barberId!)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (error) {
        console.error("barber bookings query error:", error);
        return [];
      }
      return (data ?? []) as BookingRow[];
    },
  });

  // Live sync: any insert/update on this barber's bookings refreshes the list instantly.
  useEffect(() => {
    if (!barberId) return;
    const channel = supabase
      .channel(`barber-bookings-${barberId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `barber_id=eq.${barberId}` },
        () => qc.invalidateQueries({ queryKey: ["barber-bookings", barberId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, qc]);

  useEffect(() => {
    if (!bookings.data) return;
    const currentIds = new Set(bookings.data.map((b) => b.id));
    if (prevIdsRef.current.size > 0) {
      for (const id of currentIds) {
        if (!prevIdsRef.current.has(id)) {
          const booking = bookings.data.find((b) => b.id === id);
          if (booking && booking.status === "booked") {
            startNotificationLoop();
            const desc = `${booking.customer_name} — ${booking.service_name} ${formatTime(booking.booking_time)}`;
            toast.success("حجز جديد!", { description: desc, duration: 8000 });
            showBrowserNotification("حجز جديد! " + booking.customer_name, desc);
          }
        }
      }
    }
    prevIdsRef.current = currentIds;
  }, [bookings.data]);

  const reviews = useQuery<ReviewRow[]>({
    queryKey: ["barber-reviews", barberId],
    enabled: !!barberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("barber_id", barberId!)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("barber reviews query error:", error);
        return [];
      }
      return (data ?? []) as ReviewRow[];
    },
  });

  const workingStatusFn = useServerFn(setBarberWorkingStatus);
  const startFn = useServerFn(startBookingService);
  const completeFn = useServerFn(completeBookingService);

  const patchBooking = (id: string, patch: Partial<BookingRow>) => {
    qc.setQueryData<BookingRow[]>(["barber-bookings", barberId], (old) =>
      old?.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const startService = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!barberId) return;
      patchBooking(bookingId, { started_at: new Date().toISOString() });
      try {
        await startFn({ data: { booking_id: bookingId } });
      } finally {
        // Legacy global flag (only one service runs at a time in the chair).
        try {
          await workingStatusFn({ data: { barber_id: barberId, is_working: true } });
        } catch (e) {
          console.warn("RPC update notice:", e);
        }
      }
    },
    onSuccess: () => {
      toast.success("بدأت الخدمة — أُرسل إشعار للعميل");
      qc.invalidateQueries({ queryKey: ["my-barber"] });
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (e: Error) => {
      console.error("Start service error:", e);
      toast.error("حدثت مشكلة أثناء البدء");
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
    },
  });

  const complete = useMutation({
    mutationFn: async (bookingId: string) => {
      patchBooking(bookingId, { status: "completed", completed_at: new Date().toISOString() });
      await completeFn({ data: { booking_id: bookingId } });
    },
    onSuccess: () => {
      toast.success("تم إنهاء الموعد — أُرسل إشعار للعميل");
      qc.invalidateQueries({ queryKey: ["my-barber"] });
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
    },
  });

  const cancelFn = useServerFn(cancelBookingByBarber);
  const cancelByBarber = useMutation({
    mutationFn: async (id: string) => {
      await cancelFn({ data: { booking_id: id } });
    },
    onSuccess: () => {
      toast.success("تم إلغاء الحجز — أُرسل إشعار للعميل");
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
      qc.invalidateQueries({ queryKey: ["booked"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  const today = isoDate(new Date());

  const { all, inService, todays, upcoming, history, nextAppointment } = useMemo(() => {
    const rows = bookings.data ?? [];
    const pending = rows.filter((b) => b.status === "booked");
    const active = pending.find((b) => b.started_at && !b.completed_at) ?? null;
    const inServiceIds = new Set(active ? [active.id] : []);

    const pendingSorted = [...pending]
      .filter((b) => !inServiceIds.has(b.id))
      .sort((a, b) => appointmentTs(a) - appointmentTs(b));
    const next =
      active ??
      pendingSorted.find((b) => appointmentTs(b) >= Date.now() - 30 * 60 * 1000) ??
      pendingSorted[pendingSorted.length - 1] ??
      null;

    return {
      all: rows,
      inService: active,
      todays: pending.filter((b) => b.booking_date === today && !inServiceIds.has(b.id)).sort((a, b) => appointmentTs(a) - appointmentTs(b)),
      upcoming: pending.filter((b) => b.booking_date > today).sort((a, b) => appointmentTs(a) - appointmentTs(b)),
      history: rows
        .filter((b) => b.status !== "booked")
        .sort((a, b) => appointmentTs(b) - appointmentTs(a)),
      nextAppointment: next,
    };
  }, [bookings.data, today]);

  const completedCount = all.filter((b) => b.status === "completed").length;
  const avg = reviews.data?.length
    ? reviews.data.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.data.length
    : 0;

  if (myBarber.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 glass">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <SkeletonStat />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
          <section className="grid grid-cols-3 gap-2.5">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </section>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </main>
      </div>
    );
  }
  if (!myBarber.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="grid h-14 w-14 place-items-center squircle border border-border/70 bg-card text-muted-foreground shadow-card">
          <Scissors className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <p className="mt-4 font-display text-[0.95rem] font-extrabold text-foreground">لم يتم ربط حسابك بأي حلاق</p>
        <p className="mt-1.5 text-xs font-semibold text-muted-foreground">تواصل مع المدير لإتمام الربط.</p>
        <button
          onClick={signOut}
          className="press mt-5 cursor-pointer rounded-2xl bg-primary px-6 py-3 font-display text-sm font-extrabold text-primary-foreground shadow-card transition-all duration-300 hover:brightness-110"
        >
          خروج
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "today", label: "اليوم", count: todays.length, icon: <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} /> },
    { key: "upcoming", label: "القادمة", count: upcoming.length, icon: <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} /> },
    { key: "history", label: "السجل", count: history.length, icon: <History className="h-3.5 w-3.5" strokeWidth={1.5} /> },
    { key: "reviews", label: "التقييمات", count: reviews.data?.length ?? 0, icon: <MessageSquareQuote className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  ];

  const renderCard = (b: BookingRow, fromHistory = false) => (
    <Card
      key={b.id}
      b={b}
      inService={inService?.id === b.id}
      onStart={fromHistory ? undefined : () => startService.mutate(b.id)}
      onComplete={fromHistory ? undefined : () => complete.mutate(b.id)}
      onCancel={fromHistory ? undefined : () => setCancelTarget(b)}
      isStarting={startService.isPending && startService.variables === b.id}
      isCompleting={complete.isPending && complete.variables === b.id}
    />
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center squircle gradient-gold text-gold-foreground shadow-glow-gold">
              <Scissors className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-extrabold leading-tight text-foreground">
                {myBarber.data.name}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {myBarber.data.is_working ? (
                  <span className="chip chip-warn">
                    <CurvedWorkingAnimation />
                    <span>مشغول</span>
                  </span>
                ) : (
                  <span className="chip chip-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>متاح</span>
                  </span>
                )}
                <span className="text-[10.5px] font-semibold text-muted-foreground">لوحة الحلاق</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {push?.supported && (
              <button
                onClick={togglePush}
                disabled={pushBusy}
                aria-label={push.subscribed ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}
                aria-pressed={push.subscribed}
                className={`press grid h-9 w-9 cursor-pointer place-items-center rounded-full border transition-all duration-300 disabled:opacity-50 ${
                  push.subscribed
                    ? "border-gold/30 bg-accent text-accent-foreground shadow-glow-gold"
                    : "border-border/70 bg-card/70 text-muted-foreground hover:border-gold/45 hover:text-accent-foreground"
                }`}
              >
                {push.subscribed ? (
                  <BellRing className="h-4 w-4" strokeWidth={1.7} />
                ) : (
                  <BellOff className="h-4 w-4" strokeWidth={1.7} />
                )}
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="خروج"
              className="press hit-area grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition-all duration-300 hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
        <section className="grid grid-cols-3 gap-2.5">
          <Stat
            label="مواعيد اليوم"
            value={todays.length + (inService ? 1 : 0)}
            tone="gold"
            icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.8} />}
          />
          <Stat
            label="مكتملة"
            value={completedCount}
            tone="success"
            icon={<Check className="h-3.5 w-3.5" strokeWidth={2.2} />}
          />
          <Stat
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            tone="star"
            icon={<Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />}
          />
        </section>

        {nextAppointment && (
          <NextAppointmentHero
            b={nextAppointment}
            inService={inService?.id === nextAppointment.id}
            isStarting={startService.isPending}
            isCompleting={complete.isPending}
            onStart={() => startService.mutate(nextAppointment.id)}
            onComplete={() => complete.mutate(nextAppointment.id)}
          />
        )}

        <div className="flex items-center gap-1.5 rounded-2xl border border-border/70 bg-secondary/50 p-1.5">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={`press flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-[11px] font-extrabold transition-all duration-300 ${
                  active
                    ? "border border-gold/30 bg-card text-accent-foreground shadow-card"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
                {t.count > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 text-[9.5px] font-black tnum ${
                      active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "today" && (
          <Section title="مواعيد اليوم">
            {todays.length === 0 && <Empty msg="لا توجد مواعيد اليوم" />}
            {todays.map((b, i) => (
              <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
                {renderCard(b)}
              </div>
            ))}
          </Section>
        )}

        {tab === "upcoming" && (
          <Section title="المواعيد القادمة">
            {upcoming.length === 0 && <Empty msg="لا توجد مواعيد قادمة" />}
            {upcoming.map((b, i) => (
              <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
                {renderCard(b)}
              </div>
            ))}
          </Section>
        )}

        {tab === "history" && (
          <Section title="سجل المواعيد">
            {history.length === 0 && <Empty msg="لا يوجد سجل" />}
            {history.slice(0, 30).map((b, i) => (
              <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
                {renderCard(b, true)}
              </div>
            ))}
          </Section>
        )}

        {tab === "reviews" && (
          <Section title="تقييمات العملاء">
            {(reviews.data?.length ?? 0) === 0 && <Empty msg="لا توجد تقييمات بعد" />}
            {reviews.data?.map((r, i) => (
              <div
                key={r.id}
                className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated"
                style={{ animationDelay: `${0.03 * i}s` }}
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold text-gold" : "fill-none text-muted-foreground/30"}`}
                        strokeWidth={n <= r.rating ? 0 : 1.6}
                      />
                    ))}
                    <span className="ms-1.5 font-display text-[11px] font-black tnum text-accent-foreground">
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tnum text-muted-foreground">{arabicDate(r.created_at)}</span>
                </div>
                {r.comment && (
                  <p className="mt-2.5 text-[12px] font-semibold leading-relaxed text-foreground/85">{r.comment}</p>
                )}
              </div>
            ))}
          </Section>
        )}
      </main>

      {/* Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border/70 bg-card shadow-luxe animate-scale-in">
            <div className="px-5 pt-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center squircle border border-destructive/25 bg-destructive/10 text-destructive">
                <XCircle className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h3 className="mt-4 font-display text-[1.05rem] font-extrabold text-foreground">
                إلغاء هذا الحجز؟
              </h3>
              <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed text-muted-foreground">
                سيصل إشعار للعميل بإلغاء الموعد.
              </p>
            </div>
            <div className="mt-4 divide-y divide-border/55 border-y border-border/55">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-[11.5px] font-semibold text-muted-foreground">العميل</span>
                <span className="truncate font-display text-[0.83rem] font-bold text-foreground">
                  {cancelTarget.customer_name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-[11.5px] font-semibold text-muted-foreground">الخدمة</span>
                <span className="truncate font-display text-[0.83rem] font-bold text-foreground">
                  {cancelTarget.service_name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-[11.5px] font-semibold text-muted-foreground">الموعد</span>
                <span className="truncate font-display text-[0.83rem] font-bold tnum text-foreground">
                  {formatTime(cancelTarget.booking_time)} • {arabicDate(cancelTarget.booking_date)}
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 p-4">
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => {
                  cancelByBarber.mutate(cancelTarget.id, {
                    onSettled: () => setCancelTarget(null),
                  });
                }}
                className="press flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-destructive py-3 text-sm font-extrabold text-destructive-foreground transition-all duration-200 hover:brightness-105 disabled:opacity-50"
              >
                {cancelByBarber.isPending ? "جارٍ الإلغاء..." : "إلغاء الحجز"}
              </button>
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => setCancelTarget(null)}
                className="press flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground disabled:opacity-50"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NextAppointmentHero({
  b,
  inService,
  isStarting,
  isCompleting,
  onStart,
  onComplete,
}: {
  b: BookingRow;
  inService: boolean;
  isStarting: boolean;
  isCompleting: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const diff = minutesUntil(b.booking_date, b.booking_time);
  const late = diff < 0;
  const reminder = buildWhatsAppLink(
    b.customer_phone,
    `مرحباً ${b.customer_name}، نذكرك بموعدك: ${b.service_name} — ${arabicDate(b.booking_date)} الساعة ${formatTime(b.booking_time)}. في انتظارك!`,
  );

  return (
    <section
      className={`relative overflow-hidden animate-fade-in-up ${
        inService ? "panel-ink grain spotlight p-5" : "rounded-2xl border border-border/70 bg-card p-4 shadow-elevated"
      }`}
    >
      <span
        aria-hidden
        className={
          inService
            ? "absolute inset-x-5 top-0 h-px gold-rule"
            : `absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${late ? "via-destructive/60" : "via-gold/55"}`
        }
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {inService ? (
              <CurvedWorkingAnimation />
            ) : (
              <Timer className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={1.8} />
            )}
            <span
              className={`font-display text-[11px] font-extrabold ${
                inService ? "text-gold" : "text-foreground"
              }`}
            >
              {inService ? "جارٍ الخدمة الآن" : "الموعد القادم"}
            </span>
          </span>
          {inService ? (
            <span className="rounded-full border border-gold/35 bg-gold/12 px-2.5 py-1 font-display text-[10.5px] font-black tnum text-gold">
              {humanizeMinutes(diff)}
            </span>
          ) : (
            <span className={`chip ${late ? "chip-danger" : "chip-gold"}`}>
              {late ? `متأخر ${humanizeMinutes(diff)}` : `بعد ${humanizeMinutes(diff)}`}
            </span>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <div
            className={`grid h-14 w-16 shrink-0 place-items-center rounded-xl ${
              inService
                ? "border border-gold/30 bg-gold/10"
                : "bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25"
            }`}
          >
            <div className="text-center">
              <div
                className={`font-display text-[1.05rem] font-black leading-none tnum ${
                  inService ? "text-gradient-gold" : ""
                }`}
              >
                {formatTime(b.booking_time)}
              </div>
              <div className={`mt-1 text-[8.5px] font-bold ${inService ? "text-ink-foreground/50" : "opacity-70"}`}>
                موعد
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`truncate font-display text-[1.1rem] font-black ${
                inService ? "text-ink-foreground" : "text-foreground"
              }`}
            >
              {b.customer_name}
            </div>
            <div
              className={`mt-1 truncate text-[11.5px] font-semibold ${
                inService ? "text-ink-foreground/70" : "text-muted-foreground"
              }`}
            >
              {b.service_name} • {b.service_price} ج.م
            </div>
            <div
              className={`mt-0.5 truncate text-[11px] font-semibold ${
                inService ? "text-ink-foreground/45" : "text-muted-foreground/80"
              }`}
            >
              {arabicDate(b.booking_date)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`tel:${b.customer_phone}`}
            className={`press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all duration-200 ${
              inService
                ? "border-white/12 bg-white/6 text-ink-foreground hover:bg-white/12"
                : "border-border/70 bg-secondary text-foreground hover:border-gold/45 hover:text-accent-foreground"
            }`}
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.7} /> اتصال
          </a>
          {!inService && (
            <a
              href={reminder}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 text-xs font-bold text-foreground transition-all duration-200 hover:bg-success/18"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> تذكير
            </a>
          )}
          {inService ? (
            <button
              disabled={isCompleting}
              onClick={onComplete}
              className="press flex min-h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl gradient-gold px-3 text-xs font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> {isCompleting ? "جارٍ الإنهاء..." : "إنهاء الموعد"}
            </button>
          ) : (
            <button
              disabled={isStarting}
              onClick={onStart}
              className="press flex min-h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-extrabold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              {isStarting ? "جارٍ البدء..." : "ابدأ الخدمة"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "gold",
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone?: "gold" | "success" | "star";
}) {
  const tones = {
    gold: { hair: "via-gold/60", tile: "bg-accent text-accent-foreground ring-gold/25" },
    success: { hair: "via-success/55", tile: "bg-success/10 text-success ring-success/25" },
    star: { hair: "via-gold/60", tile: "bg-gold/15 text-accent-foreground ring-gold/30" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-card animate-fade-in-up">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${tones.hair}`} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold text-muted-foreground">{label}</span>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${tones.tile}`}>
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-[1.7rem] font-black leading-none tnum text-foreground">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="section-heading mb-3 px-0.5 text-[1.05rem]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({
  b,
  onStart,
  onComplete,
  onCancel,
  inService,
  isStarting,
  isCompleting,
}: {
  b: BookingRow;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  inService?: boolean;
  isStarting?: boolean;
  isCompleting?: boolean;
}) {
  const minutes = minutesUntil(b.booking_date, b.booking_time);
  const late = b.status === "booked" && minutes < 0;
  const reminder = buildWhatsAppLink(
    b.customer_phone,
    `مرحباً ${b.customer_name}، نذكرك بموعدك: ${b.service_name} — ${arabicDate(b.booking_date)} الساعة ${formatTime(b.booking_time)}. في انتظارك!`,
  );

  const getStatusBadge = () => {
    if (b.status === "completed") return <span className="chip chip-success">مكتمل</span>;
    if (b.status === "cancelled_by_barber") return <span className="chip chip-danger">ملغي بواسطتك</span>;
    if (b.status === "cancelled_by_customer") return <span className="chip chip-danger">ملغي بواسطة العميل</span>;
    if (b.status === "cancelled") return <span className="chip chip-danger">ملغي</span>;
    if (inService) {
      return (
        <span className="chip chip-warn">
          <CurvedWorkingAnimation />
          <span>جارٍ الخدمة</span>
        </span>
      );
    }
    return <span className="chip chip-gold tnum">{b.booking_number}</span>;
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated ${
        inService ? "border-warning/35 bg-warning/[0.05]" : "border-border/70 hover:border-gold/45"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          inService ? "via-warning/70" : "via-gold/40"
        }`}
      />
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[0.95rem] font-extrabold text-foreground">{b.customer_name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
            <Scissors className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
            <span className="truncate">{b.service_name}</span>
            <span className="shrink-0 font-display font-black tnum text-accent-foreground">{b.service_price} ج.م</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.9} />
              <span className="font-display font-bold tnum text-foreground">{formatTime(b.booking_time)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" strokeWidth={1.7} />
              {arabicDate(b.booking_date)}
            </span>
            {b.status === "booked" && (
              <span className={`font-extrabold ${late ? "text-destructive" : "text-muted-foreground/70"}`}>
                {late ? `• متأخر ${humanizeMinutes(minutes)}` : `• بعد ${humanizeMinutes(minutes)}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">{getStatusBadge()}</div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-xs font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.7} /> اتصال
        </a>
        {b.status === "booked" && (
          <a
            href={reminder}
            target="_blank"
            rel="noopener noreferrer"
            className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 text-xs font-bold text-foreground transition-all duration-200 hover:bg-success/18"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> تذكير
          </a>
        )}
        {onStart && b.status === "booked" && !b.started_at && (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-extrabold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} /> {isStarting ? "جارٍ البدء..." : "ابدأ"}
          </button>
        )}
        {onComplete && b.status === "booked" && (
          <button
            disabled={isCompleting}
            onClick={onComplete}
            className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 text-xs font-extrabold text-accent-foreground transition-all duration-200 hover:bg-gold/18 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} /> {isCompleting ? "جارٍ الإنهاء..." : "إنهاء"}
          </button>
        )}
        {onCancel && b.status === "booked" && (
          <button
            onClick={onCancel}
            className="press flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/12"
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={1.7} /> إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <EmptyState
      icon={<Calendar className="h-5 w-5" strokeWidth={1.8} />}
      title={msg}
      hint="ستظهر هنا فور وصول حجز جديد"
    />
  );
}
