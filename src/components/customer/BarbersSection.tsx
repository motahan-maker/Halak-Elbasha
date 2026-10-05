import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Star } from "lucide-react";
import type { HomeBarber } from "./types";

function BarberCard({ barber }: { barber: HomeBarber }) {
  const isNew = barber.cnt === 0;
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]">
          <Scissors className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[0.95rem] font-bold text-foreground">
              {barber.name}
            </h3>
            {isNew && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-display text-[0.625rem] font-bold text-muted-foreground">
                جديد
              </span>
            )}
          </div>
          <p className="truncate font-display text-[0.75rem] font-medium text-muted-foreground">
            {barber.specialization || "حلاق محترف"}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-[#111111] text-[#111111] dark:fill-[#F6F1E8] dark:text-[#F6F1E8]" strokeWidth={0} />
          <span className="font-display text-[0.8rem] font-bold tnum text-foreground">
            {barber.avg > 0 ? barber.avg.toFixed(1) : "—"}
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">
            ({barber.cnt})
          </span>
        </div>
        <span className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 font-display text-[0.65rem] font-bold text-foreground">
          متاح للحجز
        </span>
      </div>
    </article>
  );
}

export function BarbersSection() {
  const qc = useQueryClient();
  const barbers = useQuery<HomeBarber[]>({
    queryKey: ["barbers", "showcase"],
    refetchInterval: 30000,
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
        id: b.id,
        name: b.name,
        specialization: b.specialization,
        is_active: b.is_active,
        avg: stats[b.id] ? stats[b.id].sum / stats[b.id].cnt : 0,
        cnt: stats[b.id]?.cnt ?? 0,
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("public-barbers-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "barbers" }, () =>
        qc.invalidateQueries({ queryKey: ["barbers"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () =>
        qc.invalidateQueries({ queryKey: ["barbers"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  if (barbers.isLoading) {
    return (
      <section aria-label="فريق الحلاقين">
        <h2 className="font-display text-[1.15rem] font-black text-foreground">فريق الحلاقين</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-shimmer rounded-3xl border border-border bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (!barbers.data?.length) return null;

  return (
    <section aria-label="فريق الحلاقين">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[1.15rem] font-black text-foreground">فريق الحلاقين</h2>
        <span className="font-display text-[0.75rem] font-bold text-muted-foreground">
          {barbers.data.length} حلاق
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {barbers.data.map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>
    </section>
  );
}
