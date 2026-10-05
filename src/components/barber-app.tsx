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

function appointmentTs(b: Pick<BookingRow, "booking_date" | "booking_time">) {
  return new Date(`${b.booking_date}T${b.booking_time}`).getTime();
}

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
        toast.error("الإشعارات محظورة من إعدادات المتصفح");
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
    onError: () => {
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
      pendingSorted[0] ??
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
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <SkeletonStat />
          </div>
        </header>
        <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
          <div className="grid grid-cols-3 gap-2.5">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
          <SkeletonCard />
        </main>
      </div>
    );
  }

  if (!myBarber.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#111111] text-[#FFFFFF] shadow-card dark:bg-[#F6F1E8] dark:text-[#111111]">
          <Scissors className="h-8 w-8" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 font-display text-[1.1rem] font-black text-foreground">لم يتم ربط حسابك كحلاق</h2>
        <p className="mt-1 font-display text-xs text-muted-foreground">تواصل مع إدارة الصالون لتفعيل حسابك كحلاق.</p>
        <button
          onClick={signOut}
          className="mt-6 rounded-2xl bg-[#111111] px-6 py-3 font-display text-sm font-bold text-[#FFFFFF] shadow-card dark:bg-[#F6F1E8] dark:text-[#111111] press"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "today", label: "طابور اليوم", count: todays.length + (inService ? 1 : 0), icon: <Calendar className="h-4 w-4" strokeWidth={1.8} /> },
    { key: "upcoming", label: "القادمة", count: upcoming.length, icon: <CalendarClock className="h-4 w-4" strokeWidth={1.8} /> },
    { key: "history", label: "السجل", count: history.length, icon: <History className="h-4 w-4" strokeWidth={1.8} /> },
    { key: "reviews", label: "التقييمات", count: reviews.data?.length ?? 0, icon: <MessageSquareQuote className="h-4 w-4" strokeWidth={1.8} /> },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-12 text-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#111111] font-display text-base font-bold text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]">
              {myBarber.data.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-bold text-foreground">
                {myBarber.data.name}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                {myBarber.data.is_working ? (
                  <span className="chip chip-warn">
                    <CurvedWorkingAnimation />
                    <span>مشغول بالكرسي</span>
                  </span>
                ) : (
                  <span className="chip chip-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span>متاح للخدمة</span>
                  </span>
                )}
                <span className="text-[10px] font-medium text-muted-foreground">لوحة الحلاق</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {push?.supported && (
              <button
                onClick={togglePush}
                disabled={pushBusy}
                aria-label="تفعيل الإشعارات"
                className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full border transition-all duration-200 press ${
                  push.subscribed
                    ? "border-[#111111] bg-[#111111] text-[#FFFFFF] dark:border-[#F6F1E8] dark:bg-[#F6F1E8] dark:text-[#111111]"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {push.subscribed ? <BellRing className="h-4 w-4" strokeWidth={1.8} /> : <BellOff className="h-4 w-4" strokeWidth={1.8} />}
              </button>
            )}
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

      {/* Main Content */}
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {/* Quick KPI Stats */}
        <section className="grid grid-cols-3 gap-2.5">
          <StatTile
            label="مواعيد اليوم"
            value={todays.length + (inService ? 1 : 0)}
            icon={<Calendar className="h-4 w-4" strokeWidth={1.8} />}
          />
          <StatTile
            label="مكتملة"
            value={completedCount}
            icon={<Check className="h-4 w-4" strokeWidth={2.2} />}
          />
          <StatTile
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            icon={<Star className="h-4 w-4 fill-current" strokeWidth={0} />}
          />
        </section>

        {/* Operational Now & Next Hero Card */}
        {nextAppointment && (
          <OperationalHero
            b={nextAppointment}
            inService={inService?.id === nextAppointment.id}
            isStarting={startService.isPending}
            isCompleting={complete.isPending}
            onStart={() => startService.mutate(nextAppointment.id)}
            onComplete={() => complete.mutate(nextAppointment.id)}
          />
        )}

        {/* Segmented Control */}
        <div className="flex rounded-full border border-border bg-secondary p-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 font-display text-xs font-bold transition-all duration-200 press ${
                  active
                    ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
                {t.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[9px] font-bold tnum ${
                      active ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-card text-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Today */}
        {tab === "today" && (
          <div className="space-y-3">
            {todays.length === 0 && !inService && (
              <EmptyState
                icon={<Calendar className="h-6 w-6" strokeWidth={1.8} />}
                title="لا توجد مواعيد اليوم"
                hint="ستظهر هنا المواعيد المحجوزة لليوم فور وصولها"
              />
            )}
            {todays.map((b) => (
              <BarberAppointmentCard
                key={b.id}
                b={b}
                inService={inService?.id === b.id}
                onStart={() => startService.mutate(b.id)}
                onComplete={() => complete.mutate(b.id)}
                onCancel={() => setCancelTarget(b)}
                isStarting={startService.isPending && startService.variables === b.id}
                isCompleting={complete.isPending && complete.variables === b.id}
              />
            ))}
          </div>
        )}

        {/* Tab 2: Upcoming */}
        {tab === "upcoming" && (
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" strokeWidth={1.8} />}
                title="لا توجد مواعيد قادمة"
                hint="المواعيد للأيام القادمة ستظهر هنا"
              />
            )}
            {upcoming.map((b) => (
              <BarberAppointmentCard
                key={b.id}
                b={b}
                onStart={() => startService.mutate(b.id)}
                onComplete={() => complete.mutate(b.id)}
                onCancel={() => setCancelTarget(b)}
                isStarting={startService.isPending && startService.variables === b.id}
                isCompleting={complete.isPending && complete.variables === b.id}
              />
            ))}
          </div>
        )}

        {/* Tab 3: History */}
        {tab === "history" && (
          <div className="space-y-3">
            {history.length === 0 && (
              <EmptyState
                icon={<History className="h-6 w-6" strokeWidth={1.8} />}
                title="لا يوجد سجل سابق"
                hint="المواعيد المنتهية أو الملغاة ستظهر هنا"
              />
            )}
            {history.slice(0, 40).map((b) => (
              <BarberAppointmentCard key={b.id} b={b} />
            ))}
          </div>
        )}

        {/* Tab 4: Reviews */}
        {tab === "reviews" && (
          <div className="space-y-3">
            {(reviews.data?.length ?? 0) === 0 && (
              <EmptyState
                icon={<Star className="h-6 w-6" strokeWidth={1.8} />}
                title="لا توجد تقييمات بعد"
                hint="ستظهر تقييمات وآراء العملاء لخدماتك هنا"
              />
            )}
            {reviews.data?.map((r) => (
              <div
                key={r.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          n <= r.rating
                            ? "fill-[#111111] text-[#111111] dark:fill-[#F6F1E8] dark:text-[#F6F1E8]"
                            : "text-muted-foreground/30"
                        }`}
                        strokeWidth={n <= r.rating ? 0 : 1.5}
                      />
                    ))}
                    <span className="ms-1.5 font-display text-xs font-bold tnum text-foreground">
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tnum text-muted-foreground">
                    {arabicDate(r.created_at)}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-2.5 font-display text-xs leading-relaxed text-foreground">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cancellation Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-luxe animate-scale-in">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#C5221F]/10 text-[#C5221F]">
                <XCircle className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                إلغاء هذا الحجز؟
              </h3>
              <p className="mt-1 font-display text-xs text-muted-foreground">
                سيصل إشعار للعميل فور إلغاء الحجز.
              </p>
            </div>

            <div className="my-4 divide-y divide-border rounded-2xl border border-border bg-secondary/30 p-3 text-xs">
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">العميل:</span>
                <span className="font-bold text-foreground">{cancelTarget.customer_name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">الخدمة:</span>
                <span className="font-bold text-foreground">{cancelTarget.service_name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">الوقت:</span>
                <span className="font-bold tnum text-foreground">{formatTime(cancelTarget.booking_time)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => {
                  cancelByBarber.mutate(cancelTarget.id, {
                    onSettled: () => setCancelTarget(null),
                  });
                }}
                className="flex-1 rounded-xl bg-[#C5221F] py-2.5 font-display text-xs font-bold text-white press disabled:opacity-50"
              >
                {cancelByBarber.isPending ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
              </button>
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 font-display text-xs font-bold text-foreground press"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Operational Now & Next Hero */
function OperationalHero({
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
    `مرحباً ${b.customer_name}، نذكرك بموعدك في صالون حلاق الباشا: ${b.service_name} — ${arabicDate(b.booking_date)} الساعة ${formatTime(b.booking_time)}. بانتظارك!`,
  );

  return (
    <section className="rounded-3xl bg-[#111111] p-5 text-[#FFFFFF] shadow-luxe dark:bg-[#141414]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {inService ? (
            <CurvedWorkingAnimation />
          ) : (
            <Timer className="h-4 w-4 text-[#8A857D]" strokeWidth={1.8} />
          )}
          <span className="font-display text-xs font-bold text-[#FFFFFF]">
            {inService ? "العميل الحالي بالكرسي" : "الموعد القادم"}
          </span>
        </div>
        <span
          className={`chip ${
            inService
              ? "chip-warn"
              : late
                ? "chip-danger"
                : "chip-gold"
          }`}
        >
          {inService ? "جارٍ الخدمة" : late ? `متأخر ${humanizeMinutes(diff)}` : `بعد ${humanizeMinutes(diff)}`}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[1.25rem] font-black text-[#FFFFFF]">
            {b.customer_name}
          </div>
          <div className="mt-1 truncate text-xs text-[#8A857D]">
            {b.service_name} • {b.service_price} ج.م
          </div>
        </div>
        <div className="grid h-13 w-16 place-items-center rounded-2xl bg-white/10 text-center">
          <div className="font-display text-[1.1rem] font-bold tnum text-[#FFFFFF]">
            {formatTime(b.booking_time)}
          </div>
          <div className="text-[9px] font-bold text-[#8A857D]">موعد</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 font-display text-xs font-bold text-[#FFFFFF] transition-all duration-200 hover:bg-white/10 press"
        >
          <Phone className="h-4 w-4" strokeWidth={1.8} />
          اتصال
        </a>
        {!inService && (
          <a
            href={reminder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 font-display text-xs font-bold text-[#FFFFFF] transition-all duration-200 hover:bg-white/10 press"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
            تذكير
          </a>
        )}
        {inService ? (
          <button
            disabled={isCompleting}
            onClick={onComplete}
            className="flex min-h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#FFFFFF] font-display text-xs font-black text-[#111111] shadow-card transition-all duration-200 hover:bg-[#EFE8DC] active:bg-[#DAD6CF] disabled:opacity-50 press"
          >
            <Check className="h-4 w-4" strokeWidth={2.2} />
            {isCompleting ? "جارٍ الإنهاء..." : "إنهاء الخدمة"}
          </button>
        ) : (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="flex min-h-11 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#FFFFFF] font-display text-xs font-black text-[#111111] shadow-card transition-all duration-200 hover:bg-[#EFE8DC] active:bg-[#DAD6CF] disabled:opacity-50 press"
          >
            <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
            {isStarting ? "جارٍ البدء..." : "ابدأ الخدمة"}
          </button>
        )}
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-secondary text-foreground">
          {icon}
        </span>
      </div>
      <div className="mt-2 font-display text-[1.6rem] font-black leading-none tnum text-foreground">
        {value}
      </div>
    </div>
  );
}

function BarberAppointmentCard({
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
    `مرحباً ${b.customer_name}، نذكرك بموعدك في صالون حلاق الباشا: ${b.service_name} — ${arabicDate(b.booking_date)} الساعة ${formatTime(b.booking_time)}. بانتظارك!`,
  );

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[1rem] font-bold text-foreground">
            {b.customer_name}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scissors className="h-3.5 w-3.5" strokeWidth={1.8} />
            <span className="truncate">{b.service_name}</span>
            <span>•</span>
            <span className="font-bold tnum text-foreground">{b.service_price} ج.م</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
              <span className="font-bold tnum text-foreground">{formatTime(b.booking_time)}</span>
            </span>
            <span>•</span>
            <span>{arabicDate(b.booking_date)}</span>
            {b.status === "booked" && (
              <span className={`font-bold ${late ? "text-destructive" : "text-muted-foreground"}`}>
                {late ? `(متأخر ${humanizeMinutes(minutes)})` : `(بعد ${humanizeMinutes(minutes)})`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`chip ${
              b.status === "completed"
                ? "chip-success"
                : String(b.status).startsWith("cancelled")
                  ? "chip-danger"
                  : inService
                    ? "chip-warn"
                    : "chip-gold"
            }`}
          >
            {inService && <CurvedWorkingAnimation />}
            {b.status === "completed"
              ? "مكتمل"
              : b.status === "cancelled_by_barber"
                ? "ملغي بواسطتك"
                : b.status === "cancelled_by_customer"
                  ? "ملغي بواسطة العميل"
                  : b.status === "cancelled"
                    ? "ملغي"
                    : inService
                      ? "جارٍ الخدمة"
                      : "محجوز"}
          </span>
          <span className="font-display text-[10px] font-bold tnum text-muted-foreground">
            #{b.booking_number}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2 border-t border-border/70 pt-3">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-border bg-secondary font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.8} />
          اتصال
        </a>
        {b.status === "booked" && (
          <a
            href={reminder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-border bg-secondary font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
            تذكير
          </a>
        )}
        {onStart && b.status === "booked" && !b.started_at && (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#111111] font-display text-xs font-bold text-[#FFFFFF] shadow-card dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
            {isStarting ? "..." : "ابدأ"}
          </button>
        )}
        {onComplete && b.status === "booked" && (
          <button
            disabled={isCompleting}
            onClick={onComplete}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#111111] font-display text-xs font-bold text-[#FFFFFF] shadow-card dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            {isCompleting ? "..." : "إنهاء"}
          </button>
        )}
        {onCancel && b.status === "booked" && (
          <button
            onClick={onCancel}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 font-display text-xs font-bold text-destructive hover:bg-destructive/20 press"
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}
