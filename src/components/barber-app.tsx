import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { savePushSubscription } from "@/lib/admin.functions";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat, SkeletonCard } from "@/components/ui/skeleton";
import { arabicDate, isoDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { toast } from "sonner";
import { Phone, LogOut, Scissors, Calendar, Check, Star } from "lucide-react";

interface BookingRow {
  id: string;
  booking_number: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: "booked" | "completed" | "cancelled";
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

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم إنهاء الموعد");
      qc.invalidateQueries({ queryKey: ["barber-bookings"] });
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
    (b) => b.booking_date === today && b.status !== "cancelled",
  );
  const upcoming = (bookings.data ?? []).filter(
    (b) => b.booking_date > today && b.status === "booked",
  );
  const completed = (bookings.data ?? []).filter((b) => b.status === "completed");
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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card transition-all duration-300">
              <Scissors className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold">{myBarber.data.name}</div>
              <div className="truncate text-xs text-muted-foreground">حلاق</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-border transition-all duration-300 hover:shadow-elevated active:scale-[0.95]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-2.5 px-5 pt-5">
        <section className="grid grid-cols-3 gap-2.5 animate-fade-in-up">
          <Stat label="اليوم" value={todays.length} />
          <Stat label="مكتملة" value={completed.length} />
          <Stat
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            icon={<Star className="h-4 w-4 fill-primary text-primary" strokeWidth={1.5} />}
          />
        </section>

        <Section title="مواعيد اليوم">
          {todays.length === 0 && <Empty msg="لا توجد مواعيد اليوم" />}
          {todays.map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card b={b} onComplete={() => complete.mutate(b.id)} />
            </div>
          ))}
        </Section>

        <Section title="المواعيد القادمة">
          {upcoming.length === 0 && <Empty msg="لا توجد مواعيد قادمة" />}
          {upcoming.map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card b={b} onComplete={() => complete.mutate(b.id)} />
            </div>
          ))}
        </Section>

        <Section title="المكتملة">
          {completed.length === 0 && <Empty msg="لا يوجد سجل" />}
          {completed.slice(0, 10).map((b, i) => (
            <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
              <Card b={b} />
            </div>
          ))}
        </Section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card transition-all duration-300 hover:shadow-elevated">
      <div className="flex items-center justify-center gap-1 text-2xl font-black text-gradient-gold">
        {value}
        {icon}
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 px-1 text-[15px] font-bold text-muted-foreground">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Card({ b, onComplete }: { b: BookingRow; onComplete?: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/20">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">{b.customer_name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {b.service_name} • {formatTime(b.booking_time)}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {arabicDate(b.booking_date)}
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {b.booking_number}
        </span>
      </div>
      <div className="mt-3 flex gap-2.5">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-border px-3 py-2 text-xs font-bold transition-all duration-300 hover:bg-muted active:scale-[0.97]"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={1.5} /> اتصال
        </a>
        {onComplete && b.status === "booked" && (
          <button
            onClick={onComplete}
            className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> إنهاء
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">
      {msg}
    </div>
  );
}
