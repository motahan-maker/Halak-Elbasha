import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonStat } from "@/components/ui/skeleton";
import { arabicDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { Scissors, Star } from "lucide-react";

export function Overview() {
  const stats = useQuery({
    queryKey: ["admin-overview"],
    staleTime: 30000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
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
      const cancelled = bookings.filter((x) => x.status === "cancelled");
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
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up">
        <KPI label="حجوزات اليوم" value={d?.todayCount ?? "—"} colorClass="text-primary" />
        <KPI label="مكتملة" value={d?.completedCount ?? "—"} colorClass="text-success" />
        <KPI label="ملغية" value={d?.cancelledCount ?? "—"} colorClass="text-destructive" />
        <KPI label="العملاء" value={d?.customers ?? "—"} />
        <KPI label="الحلاقون" value={d?.barbers ?? "—"} />
        <KPI label="الخدمات" value={d?.services ?? "—"} />
      </div>
      <h3 className="ios-grouped-section-title px-1 pt-2">الإيرادات</h3>
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <KPI label="اليوم" value={`${d?.revDay ?? 0} ج.م`} colorClass="text-success" />
        <KPI label="الأسبوع" value={`${d?.revWeek ?? 0} ج.م`} colorClass="text-success" />
        <KPI label="الشهر" value={`${d?.revMonth ?? 0} ج.م`} colorClass="text-success" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <StatCard
          title="الأكثر طلباً"
          value={d?.topService ?? "—"}
          icon={<Scissors className="h-4.5 w-4.5" strokeWidth={1.5} />}
        />
        <StatCard
          title="أفضل حلاق تقييماً"
          value={d?.topBarber ?? "—"}
          icon={<Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" strokeWidth={0} />}
        />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  colorClass = "text-foreground",
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15">
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      <div className="mt-1 text-[11px] font-bold text-muted-foreground">{label}</div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-bold text-muted-foreground">{title}</div>
        <div className="text-sm font-bold text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}
