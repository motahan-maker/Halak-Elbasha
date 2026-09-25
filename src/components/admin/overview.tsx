import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonStat } from "@/components/ui/skeleton";
import { arabicDate, isoDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { Scissors, Star } from "lucide-react";

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
        <div className="grid grid-cols-3 gap-2">
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
      <div className="grid grid-cols-3 gap-2.5">
        <KPI label="حجوزات اليوم" value={d?.todayCount ?? "—"} tone="gold" delay={0} />
        <KPI label="مكتملة" value={d?.completedCount ?? "—"} tone="success" delay={0.03} />
        <KPI label="ملغية" value={d?.cancelledCount ?? "—"} tone="danger" delay={0.06} />
        <KPI label="العملاء" value={d?.customers ?? "—"} delay={0.09} />
        <KPI label="الحلاقون" value={d?.barbers ?? "—"} delay={0.12} />
        <KPI label="الخدمات" value={d?.services ?? "—"} delay={0.15} />
      </div>

      <section className="panel-ink grain animate-fade-in-up p-5" style={{ animationDelay: "0.18s" }}>
        <span aria-hidden className="absolute inset-x-5 top-0 h-px gold-rule" />
        <div className="relative">
          <div className="eyebrow text-ink-foreground/55">إيرادات مكتملة</div>
          <div className="mt-3.5 grid grid-cols-3">
            {[
              { label: "اليوم", v: d?.revDay ?? 0 },
              { label: "الأسبوع", v: d?.revWeek ?? 0 },
              { label: "الشهر", v: d?.revMonth ?? 0 },
            ].map((r, i) => (
              <div key={r.label} className={i > 0 ? "border-s border-white/10 text-center" : "text-center"}>
                <div className="text-[10.5px] font-bold text-ink-foreground/55">{r.label}</div>
                <div className="mt-2 font-display text-[1.15rem] font-black leading-none tnum text-gradient-gold">
                  {r.v}
                  <span className="ms-1 text-[0.6rem] font-bold">ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <StatCard
          title="الأكثر طلباً"
          value={d?.topService ?? "—"}
          delay={0.21}
          icon={<Scissors className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatCard
          title="أفضل حلاق تقييماً"
          value={d?.topBarber ?? "—"}
          delay={0.24}
          icon={<Star className="h-4 w-4 fill-current" strokeWidth={0} />}
        />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  tone = "neutral",
  delay = 0,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "gold" | "success" | "danger";
  delay?: number;
}) {
  const hair = {
    neutral: "via-border",
    gold: "via-gold/60",
    success: "via-success/55",
    danger: "via-destructive/55",
  }[tone];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${hair}`} />
      <div className="truncate font-display text-[1.35rem] font-black leading-none tnum text-foreground">{value}</div>
      <div className="mt-1.5 truncate text-[10.5px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center squircle bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="eyebrow text-accent-foreground">{title}</div>
        <div className="mt-1 truncate font-display text-[0.9rem] font-extrabold text-foreground">{value}</div>
      </div>
    </div>
  );
}
