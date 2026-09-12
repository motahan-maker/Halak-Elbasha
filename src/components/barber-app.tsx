import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { savePushSubscription, cancelBookingByBarber, setBarberWorkingStatus } from "@/lib/admin.functions";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat, SkeletonCard } from "@/components/ui/skeleton";
import { CurvedWorkingAnimation } from "@/components/ui/curved-working-animation";
import { arabicDate, isoDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { toast } from "sonner";
import { Phone, LogOut, Scissors, Calendar, Check, Star, XCircle, Play } from "lucide-react";

interface BookingRow {
  id: string;
  booking_number: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: "booked" | "completed" | "cancelled" | "cancelled_by_customer" | "cancelled_by_barber";
}

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

async function registerServiceWorker() {
  if (swReady) return;
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    swReady = true;
  } catch {}
}

function sendSwConfig(barberId: string) {
  const sw = navigator.serviceWorker?.controller;
  if (!sw) return;
  import("@/integrations/supabase/config").then(({ SUPABASE_CONFIG }) => {
    sw.postMessage({
      type: "CONFIG",
      barberId,
      supabaseUrl: SUPABASE_CONFIG.url,
      supabaseKey: SUPABASE_CONFIG.anonKey,
      vapidPublicKey: SUPABASE_CONFIG.vapidPublicKey,
      supabaseAnonKey: SUPABASE_CONFIG.anonKey,
    });
  });
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SHOW_NOTIFICATION", title, body });
  } else {
    try { new Notification(title, { body, tag: "new-booking", requireInteraction: true }); } catch {}
  }
}

export function BarberApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!auth.user) return;
    registerServiceWorker().then(() => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") getAudioCtx();
        });
      } else if (Notification.permission === "granted") {
        getAudioCtx();
      }
    });
    const resume = () => { getAudioCtx(); document.removeEventListener("click", resume); };
    document.addEventListener("click", resume);
    return () => document.removeEventListener("click", resume);
  }, [auth.user]);

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

  useEffect(() => {
    if (myBarber.data?.id) {
      registerServiceWorker().then(() => sendSwConfig(myBarber.data!.id!));
    }
  }, [myBarber.data?.id]);

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "SAVE_SUBSCRIPTION") {
        const sub = e.data.subscription;
        savePushSubscription({
          data: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        }).catch(() => {});
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  const bookings = useQuery<BookingRow[]>({
    queryKey: ["barber-bookings", myBarber.data?.id],
    enabled: !!myBarber.data?.id,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("barber_id", myBarber.data!.id)
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

  const reviews = useQuery({
    queryKey: ["barber-reviews", myBarber.data?.id],
    enabled: !!myBarber.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("barber_id", myBarber.data!.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("barber reviews query error:", error);
        return [];
      }
      return data ?? [];
    },
  });

  const workingStatusFn = useServerFn(setBarberWorkingStatus);
  const startService = useMutation({
    mutationFn: async () => {
      if (!myBarber.data?.id) return;
      // Execute working status change on server
      await workingStatusFn({ data: { barber_id: myBarber.data.id, is_working: true } });
    },
    onSuccess: () => {
      toast.success("بدأت الخدمة الآن — حالة الحلاق: مشغول");
      qc.invalidateQueries({ queryKey: ["my-barber"] });
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (e: Error) => {
      console.error("Start service error:", e);
      toast.error("حدثت مشكلة أثناء البدء، يرجى المحاولة مرة أخرى");
    },
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      if (myBarber.data?.id) {
        await workingStatusFn({ data: { barber_id: myBarber.data.id, is_working: false } });
      }
    },
    onSuccess: () => {
      toast.success("تم إنهاء الموعد — حالة الحلاق: متاح");
      qc.invalidateQueries({ queryKey: ["my-barber"] });
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelFn = useServerFn(cancelBookingByBarber);
  const cancelByBarber = useMutation({
    mutationFn: async (id: string) => {
      await cancelFn({ data: { booking_id: id } });
    },
    onSuccess: () => {
      toast.success("تم إلغاء الحجز بنجاح");
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
  const todays = (bookings.data ?? []).filter(
    (b) => b.booking_date === today && b.status === "booked",
  );
  const upcoming = (bookings.data ?? []).filter(
    (b) => b.booking_date > today && b.status === "booked",
  );
  const history = (bookings.data ?? []).filter((b) => b.status !== "booked");
  const completedCount = (bookings.data ?? []).filter((b) => b.status === "completed").length;
  const avg = reviews.data?.length
    ? reviews.data.reduce((s, r) => s + (r as any).rating, 0) / reviews.data.length
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
          className="mt-4 rounded-2xl bg-primary px-5 py-2.5 text-[15px] font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
        >
          خروج
        </button>
      </div>
    );
  }

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
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="خروج"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:shadow-glow-primary active:scale-90"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 pt-5">
        <section className="grid grid-cols-3 gap-2.5 animate-fade-in-up stagger-children">
          <Stat label="اليوم" value={todays.length} colorClass="text-primary" gradientClass="from-primary/10 to-primary/5" />
          <Stat label="مكتملة" value={completedCount} colorClass="text-success" gradientClass="from-success/10 to-success/5" />
          <Stat
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            colorClass="text-amber-500"
            gradientClass="from-amber-500/10 to-amber-500/5"
            icon={<Star className="h-4 w-4 fill-amber-500 text-amber-500" strokeWidth={0} />}
          />
        </section>

        <Section title="مواعيد اليوم">
          {todays.length === 0 && <Empty msg="لا توجد مواعيد اليوم" />}
          {todays.map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card
                b={b}
                onStart={() => startService.mutate()}
                onComplete={() => complete.mutate(b.id)}
                onCancel={() => setCancelTarget(b)}
                isWorking={myBarber.data?.is_working}
                isStarting={startService.isPending}
              />
            </div>
          ))}
        </Section>

        <Section title="المواعيد القادمة">
          {upcoming.length === 0 && <Empty msg="لا توجد مواعيد قادمة" />}
          {upcoming.map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card
                b={b}
                onStart={() => startService.mutate()}
                onComplete={() => complete.mutate(b.id)}
                onCancel={() => setCancelTarget(b)}
                isWorking={myBarber.data?.is_working}
                isStarting={startService.isPending}
              />
            </div>
          ))}
        </Section>

        <Section title="سجل المواعيد">
          {history.length === 0 && <Empty msg="لا يوجد سجل" />}
          {history.slice(0, 15).map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card b={b} />
            </div>
          ))}
        </Section>
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
              >
                {cancelByBarber.isPending ? "جارٍ الإلغاء..." : "إلغاء الحجز"}
              </button>
              <button
                disabled={cancelByBarber.isPending}
                onClick={() => setCancelTarget(null)}
                className="flex flex-1 items-center justify-center rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition-all duration-200 hover:bg-secondary/80 active:scale-[0.97] disabled:opacity-50"
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
  isWorking,
  isStarting,
}: {
  b: BookingRow;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isWorking?: boolean;
  isStarting?: boolean;
}) {
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
    return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary shrink-0">{b.booking_number}</span>;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">{b.customer_name}</div>
          <div className="truncate text-xs text-muted-foreground font-semibold mt-1">
            {b.service_name} • {formatTime(b.booking_time)}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/80 font-medium">
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {arabicDate(b.booking_date)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge()}
          {b.status === "booked" && b.booking_number && (
            <span className="text-[10px] font-bold text-muted-foreground/60">{b.booking_number}</span>
          )}
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.96]"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> اتصال
        </a>
        {onStart && b.status === "booked" && !isWorking && (
          <button
            disabled={isStarting}
            onClick={onStart}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-white px-3 py-2 text-xs font-bold transition-all duration-200 hover:bg-amber-600 active:scale-[0.96] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-3.5 w-3.5 fill-white" strokeWidth={0} /> {isStarting ? "جاري البدء..." : "ابدأ"}
          </button>
        )}
        {onComplete && b.status === "booked" && (
          <button
            onClick={onComplete}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.96]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> إنهاء
          </button>
        )}
        {onCancel && b.status === "booked" && (
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-[0.96]"
          >
            <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} /> إلغاء الحجز
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
