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
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <SkeletonStat />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl space-y-5 px-5 pt-5">
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
      <div className="mx-auto max-w-md p-6 text-center" dir="rtl">
        <p className="text-[15px]">لم يتم ربط حسابك بأي حلاق. تواصل مع المدير.</p>
        <button
          onClick={signOut}
          className="mt-4 cursor-pointer rounded-2xl bg-primary px-5 py-2.5 text-[15px] font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-luxe text-white shadow-luxe border border-white/15">
              <Scissors className="h-4.5 w-4.5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{myBarber.data.name}</div>
              <div className="truncate text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>حلاق</span>
                {myBarber.data.is_working ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                    <CurvedWorkingAnimation />
                    <span>مشغول</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>متاح</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {push?.supported && (
              <button
                onClick={togglePush}
                disabled={pushBusy}
                aria-label={push.subscribed ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}
                aria-pressed={push.subscribed}
                className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-all duration-300 active:scale-90 disabled:opacity-50 ${
                  push.subscribed
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary text-muted-foreground border border-border/40 hover:bg-accent"
                }`}
              >
                {push.subscribed ? (
                  <BellRing className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <BellOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="خروج"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-glow-primary active:scale-90"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 pt-5">
        <section className="grid grid-cols-3 gap-2.5 animate-fade-in-up stagger-children">
          <Stat label="اليوم" value={todays.length + (inService ? 1 : 0)} colorClass="text-primary" gradientClass="from-primary/10 to-primary/5" />
          <Stat label="مكتملة" value={completedCount} colorClass="text-success" gradientClass="from-success/10 to-success/5" />
          <Stat
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            colorClass="text-amber-500"
            gradientClass="from-amber-500/10 to-amber-500/5"
            icon={<Star className="h-4 w-4 fill-amber-500 text-amber-500" strokeWidth={0} />}
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

        <div className="ios-segmented-control">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ios-segmented-btn cursor-pointer ${tab === t.key ? "ios-segmented-btn-active" : ""}`}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {t.icon}
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-extrabold ${tab === t.key ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          ))}
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
                className="animate-fade-in-up rounded-xl border border-border bg-card p-4 shadow-card"
                style={{ animationDelay: `${0.03 * i}s` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/35"}`}
                        strokeWidth={n <= r.rating ? 0 : 1.5}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/70">
                    {arabicDate(r.created_at)}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-foreground/85">{r.comment}</p>
                )}
              </div>
            ))}
          </Section>
        )}
      </main>

      {/* Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border text-center space-y-4 animate-scale-in" dir="rtl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">هل أنت متأكد من إلغاء هذا الحجز؟</h3>
              <p className="mt-1.5 text-xs text-muted-foreground font-semibold leading-relaxed">
                العميل: {cancelTarget.customer_name}
                <br />
                الخدمة: {cancelTarget.service_name} • {formatTime(cancelTarget.booking_time)}
                <br />
                التاريخ: {arabicDate(cancelTarget.booking_date)}
                <br />
                <span className="text-destructive/85">سيصل إشعار للعميل بإلغاء الموعد.</span>
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => {
                  cancelByBarber.mutate(cancelTarget.id, {
                    onSettled: () => setCancelTarget(null),
                  });
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
              >
                {cancelByBarber.isPending ? "جارٍ الإلغاء..." : "إلغاء الحجز"}
              </button>
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => setCancelTarget(null)}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-200 hover:bg-secondary/80 active:scale-[0.97] disabled:opacity-50"
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
      className={`overflow-hidden rounded-2xl border p-4 shadow-elevated animate-fade-in-up ${
        inService ? "border-amber-500/40 bg-amber-500/8" : "border-primary/25 bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide">
          <Timer className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span className={inService ? "text-amber-600 dark:text-amber-400" : "text-primary"}>
            {inService ? "جارٍ الخدمة الآن" : "الموعد القادم"}
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums ${
            inService
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : late
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
          }`}
        >
          {inService ? humanizeMinutes(diff) : late ? `متأخر ${humanizeMinutes(diff)}` : `بعد ${humanizeMinutes(diff)}`}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-black text-foreground">{b.customer_name}</div>
          <div className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
            {b.service_name} • {formatTime(b.booking_time)} • {arabicDate(b.booking_date)}
          </div>
        </div>
        {inService && <CurvedWorkingAnimation />}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.96]"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> اتصال
        </a>
        <a
          href={reminder}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:bg-emerald-500/15 active:scale-[0.96]"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> تذكير
        </a>
        {inService ? (
          <button
            disabled={isCompleting}
            onClick={onComplete}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} /> {isCompleting ? "جارٍ الإنهاء..." : "إنهاء"}
          </button>
        ) : (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="flex min-h-11 flex-[1.4] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
            {isStarting ? "جارٍ البدء..." : "ابدأ الخدمة وأشعر العميل"}
          </button>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  colorClass = "text-foreground",
  gradientClass = "",
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  colorClass?: string;
  gradientClass?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-3.5 text-center shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15 active:scale-[0.98] bg-gradient-to-br ${gradientClass}`}>
      <div className={`flex items-center justify-center gap-1 text-2xl font-black ${colorClass} animate-counter-up`}>
        {value}
        {icon}
      </div>
      <div className="mt-1 text-[11px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="ios-grouped-section-title mb-2">{title}</h2>
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
    if (b.status === "completed") {
      return <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success shrink-0">مكتمل</span>;
    }
    if (b.status === "cancelled_by_barber") {
      return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[9px] font-bold text-destructive shrink-0">ملغي بواسطة الحلاق</span>;
    }
    if (b.status === "cancelled_by_customer") {
      return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[9px] font-bold text-destructive shrink-0">ملغي بواسطة العميل</span>;
    }
    if (b.status === "cancelled") {
      return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[9px] font-bold text-destructive shrink-0">ملغي</span>;
    }
    if (inService) {
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
          <CurvedWorkingAnimation />
          <span>جارٍ الخدمة</span>
        </span>
      );
    }
    return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0">{b.booking_number}</span>;
  };

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated ${
        inService ? "border-amber-500/40" : "border-border hover:border-primary/15"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">{b.customer_name}</div>
          <div className="truncate text-xs text-muted-foreground font-semibold mt-1">
            {b.service_name} • {formatTime(b.booking_time)}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/80 font-medium">
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {arabicDate(b.booking_date)}
            {b.status === "booked" && (
              <span className={`ms-1 font-extrabold ${late ? "text-destructive" : "text-muted-foreground/70"}`}>
                {late ? `• متأخر ${humanizeMinutes(minutes)}` : `• بعد ${humanizeMinutes(minutes)}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge()}
          {b.status === "booked" && b.booking_number && !inService && (
            <span className="text-[10px] font-bold text-muted-foreground/60">{b.booking_number}</span>
          )}
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-3 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.96]"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> اتصال
        </a>
        {b.status === "booked" && (
          <a
            href={reminder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:bg-emerald-500/15 active:scale-[0.96]"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> تذكير
          </a>
        )}
        {onStart && b.status === "booked" && !b.started_at && (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white transition-all duration-200 hover:bg-amber-600 active:scale-[0.96] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-3.5 w-3.5 fill-white" strokeWidth={0} /> {isStarting ? "جاري البدء..." : "ابدأ"}
          </button>
        )}
        {onComplete && b.status === "booked" && (
          <button
            disabled={isCompleting}
            onClick={onComplete}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> {isCompleting ? "جارٍ الإنهاء..." : "إنهاء"}
          </button>
        )}
        {onCancel && b.status === "booked" && (
          <button
            onClick={onCancel}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-destructive/20 bg-destructive/5 px-3 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-[0.96]"
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/15 p-6 text-center text-xs font-medium text-muted-foreground">
      {msg}
    </div>
  );
}
