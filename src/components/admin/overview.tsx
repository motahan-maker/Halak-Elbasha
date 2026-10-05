import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonStat } from "@/components/ui/skeleton";
import { isoDate } from "@/lib/format";
import { Scissors, Star, Users, CalendarDays, Check, XCircle } from "lucide-react";

export function Overview() {
  const stats = useQuery({
    queryKey: ["admin-overview"],
    staleTime: 30000,
    queryFn: async () => {
      const today = isoDate(new Date());
      const weekAgo = isoDate(new Date(Date.now() - 7 * 86400000));
      const monthAgo = isoDate(new Date(Date.now() - 30 * 86400000));
      const [bookingsRes, c, s, barbersRes, reviewAgg] = await Promise.all([
        supabase
          .from("bookings")
          .select("status, booking_date, service_price, service_name, barber_id")
          .gte("booking_date", monthAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("barbers").select("id, name"),
        supabase.from("reviews").select("barber_id, rating"),
      ]);
      const bookings = (bookingsRes.data ?? []) as any[];
      const todayBookings = bookings.filter((x) => x.booking_date === today);
      const completed = bookings.filter((x) => x.status === "completed");
      const cancelled = bookings.filter((x) => String(x.status).startsWith("cancelled"));
      const revDay = completed
        .filter((x) => x.booking_date === today)
        .reduce((a, x) => a + Number(x.service_price), 0);
      const revWeek = completed
        .filter((x) => x.booking_date >= weekAgo)
        .reduce((a, x) => a + Number(x.service_price), 0);
      const revMonth = completed.reduce((a, x) => a + Number(x.service_price), 0);
      const svcCount: Record<string, number> = {};
      completed.forEach((x) => (svcCount[x.service_name] = (svcCount[x.service_name] ?? 0) + 1));
      const topService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      const ratings: Record<string, { s: number; c: number }> = {};
      (reviewAgg.data ?? []).forEach((r: any) => {
        ratings[r.barber_id] ??= { s: 0, c: 0 };
        ratings[r.barber_id].s += r.rating;
        ratings[r.barber_id].c += 1;
      });
      let topBarber = "—";
      let topAvg = 0;
      Object.entries(ratings).forEach(([id, v]) => {
        const a = v.s / v.c;
        if (a > topAvg) {
          topAvg = a;
          topBarber = (barbersRes.data ?? []).find((x: any) => x.id === id)?.name ?? "—";
        }
      });
      return {
        todayCount: todayBookings.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        customers: c.count ?? 0,
        services: s.count ?? 0,
        barbers: (barbersRes.data ?? []).length,
        revDay,
        revWeek,
        revMonth,
        topService,
        topBarber,
      };
    },
  });

  const d = stats.data;

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 6 Key KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <KPICard
          label="حجوزات اليوم"
          value={d?.todayCount ?? "—"}
          icon={<CalendarDays className="h-4 w-4" strokeWidth={1.8} />}
        />
        <KPICard
          label="مكتملة"
          value={d?.completedCount ?? "—"}
          icon={<Check className="h-4 w-4" strokeWidth={2.2} />}
        />
        <KPICard
          label="ملغية"
          value={d?.cancelledCount ?? "—"}
          icon={<XCircle className="h-4 w-4 text-destructive" strokeWidth={1.8} />}
        />
        <KPICard
          label="العملاء المسجلين"
          value={d?.customers ?? "—"}
          icon={<Users className="h-4 w-4" strokeWidth={1.8} />}
        />
        <KPICard
          label="الحلاقون"
          value={d?.barbers ?? "—"}
          icon={<Scissors className="h-4 w-4" strokeWidth={1.8} />}
        />
        <KPICard
          label="الخدمات النشطة"
          value={d?.services ?? "—"}
          icon={<Scissors className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Revenue Summary Card */}
      <section className="rounded-3xl bg-[#111111] p-6 text-[#FFFFFF] shadow-luxe dark:bg-[#141414]">
        <div className="text-xs font-bold uppercase tracking-wider text-[#8A857D]">
          الإيرادات المحققة (المكتملة)
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 divide-x divide-white/10 text-center">
          {[
            { label: "اليوم", v: d?.revDay ?? 0 },
            { label: "هذا الأسبوع", v: d?.revWeek ?? 0 },
            { label: "هذا الشهر", v: d?.revMonth ?? 0 },
          ].map((r) => (
            <div key={r.label} className="px-2">
              <div className="text-[11px] font-bold text-[#8A857D]">{r.label}</div>
              <div className="mt-2 font-display text-[1.35rem] font-black leading-none tnum text-[#FFFFFF]">
                {r.v}
                <span className="ms-1 text-[9px] font-bold text-[#8A857D]">ج.م</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Performers */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-3xl border border-border bg-card p-4 shadow-card">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground">
            <Scissors className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted-foreground">الخدمة الأكثر طلباً</div>
            <div className="mt-1 truncate font-display text-[1rem] font-bold text-foreground">
              {d?.topService ?? "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-3xl border border-border bg-card p-4 shadow-card">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground">
            <Star className="h-5 w-5 fill-current" strokeWidth={0} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-muted-foreground">أفضل حلاق تقييماً</div>
            <div className="mt-1 truncate font-display text-[1rem] font-bold text-foreground">
              {d?.topBarber ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-secondary text-foreground">
          {icon}
        </span>
      </div>
      <div className="mt-2.5 font-display text-[1.6rem] font-black leading-none tnum text-foreground">
        {value}
      </div>
    </div>
  );
}
