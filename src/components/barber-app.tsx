import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { arabicDate, isoDate } from "@/lib/format";
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

export function BarberApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notifiedBookings = useRef<Set<string>>(new Set());

  const myBarber = useQuery({
    queryKey: ["my-barber", auth.user?.id],
    enabled: !!auth.user,
    queryFn: async () => {
      const { data } = await supabase
        .from("barbers")
        .select("*")
        .eq("user_id", auth.user!.id)
        .maybeSingle();
      return data;
    },
  });

  const bookings = useQuery<BookingRow[]>({
    queryKey: ["barber-bookings", myBarber.data?.id],
    enabled: !!myBarber.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("barber_id", myBarber.data!.id)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      return (data ?? []) as BookingRow[];
    },
  });

  const reviews = useQuery({
    queryKey: ["barber-reviews", myBarber.data?.id],
    enabled: !!myBarber.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("barber_id", myBarber.data!.id)
        .order("created_at", { ascending: false });
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

  useEffect(() => {
    if (!myBarber.data?.id) return;

    const channel = supabase
      .channel("new-bookings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `barber_id=eq.${myBarber.data.id}`,
        },
        (payload) => {
          const bookingId = payload.new.id;
          
          // Prevent repeating the sound for the same booking
          if (notifiedBookings.current.has(bookingId)) return;
          notifiedBookings.current.add(bookingId);

          // Play premium notification sound
          const audio = new Audio("/notification.mp3");
          audio.play().catch((e) => console.error("Error playing sound:", e));

          // Show toast notification
          toast.success("تم استلام حجز جديد! 🛎️", {
            description: `لديك حجز جديد من ${payload.new.customer_name || "عميل"}`,
            duration: 6000,
          });

          // Refresh the bookings list
          qc.invalidateQueries({ queryKey: ["barber-bookings"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myBarber.data?.id, qc]);

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

  if (myBarber.isLoading) return <div className="p-10 text-center">جارٍ التحميل...</div>;
  if (!myBarber.data) {
    return (
      <div className="mx-auto max-w-md p-6 text-center" dir="rtl">
        <p>لم يتم ربط حسابك بأي حلاق. تواصل مع المدير.</p>
        <button
          onClick={signOut}
          className="mt-4 rounded-xl gradient-luxe px-5 py-2 font-bold text-primary-foreground"
        >
          خروج
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground shadow-card">
              <Scissors className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{myBarber.data.name}</div>
              <div className="truncate text-xs text-muted-foreground">حلاق</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              onClick={signOut}
              className="grid h-9 w-9 place-items-center rounded-full border border-border"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <section className="grid grid-cols-3 gap-2">
          <Stat label="اليوم" value={todays.length} />
          <Stat label="مكتملة" value={completed.length} />
          <Stat
            label="التقييم"
            value={avg ? avg.toFixed(1) : "—"}
            icon={<Star className="h-4 w-4 fill-primary text-primary" />}
          />
        </section>

        <Section title="مواعيد اليوم">
          {todays.length === 0 && <Empty msg="لا توجد مواعيد اليوم" />}
          {todays.map((b) => (
            <Card key={b.id} b={b} onComplete={() => complete.mutate(b.id)} />
          ))}
        </Section>

        <Section title="المواعيد القادمة">
          {upcoming.length === 0 && <Empty msg="لا توجد مواعيد قادمة" />}
          {upcoming.map((b) => (
            <Card key={b.id} b={b} onComplete={() => complete.mutate(b.id)} />
          ))}
        </Section>

        <Section title="المكتملة">
          {completed.length === 0 && <Empty msg="لا يوجد سجل" />}
          {completed.slice(0, 10).map((b) => (
            <Card key={b.id} b={b} />
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
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-card">
      <div className="flex items-center justify-center gap-1 text-2xl font-black text-gradient-gold">
        {value}
        {icon}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-bold text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Card({ b, onComplete }: { b: BookingRow; onComplete?: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{b.customer_name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {b.service_name} • {b.booking_time.slice(0, 5)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {arabicDate(b.booking_date)}
          </div>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          {b.booking_number}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${b.customer_phone}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
        >
          <Phone className="h-3.5 w-3.5" /> اتصال
        </a>
        {onComplete && b.status === "booked" && (
          <button
            onClick={onComplete}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl gradient-luxe px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" /> إنهاء
          </button>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}
