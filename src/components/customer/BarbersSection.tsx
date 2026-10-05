import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scissors, Star } from "lucide-react";
import type { HomeBarber } from "./types";

function BarberCard({ barber }: { barber: HomeBarber }) {
  const isNew = barber.cnt === 0;
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_-20px_rgba(36,19,13,0.35)] ring-1 ring-[#24130D]/5">
      {/* Gold top with decorative circle + neutral placeholder */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#DFA93E] to-[#D86620] px-4 pb-5 pt-4">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-10 -top-12 h-32 w-32 rounded-full bg-white/15"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -start-8 -bottom-14 h-28 w-28 rounded-full bg-black/10"
        />
        {isNew && (
          <span className="absolute start-3 top-3 rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-black text-[#D86620] shadow">
            جديد
          </span>
        )}
        <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/95 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.4)]">
          <Scissors className="h-7 w-7 text-[#8A5A17]" strokeWidth={2} />
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="truncate font-display text-[0.95rem] font-extrabold text-[#24130D]">
          {barber.name}
        </h3>
        <p className="mt-0.5 text-[0.75rem] font-medium text-[#24130D]/55">
          {barber.specialization || "حلاق"}
        </p>
        <p className="mt-2 flex items-center gap-1 text-[0.8rem] font-extrabold text-[#24130D]">
          <Star className="h-3.5 w-3.5 fill-[#C99A35] text-[#C99A35]" strokeWidth={0} />
          <span className="tnum">{barber.avg > 0 ? barber.avg.toFixed(1) : "جديد"}</span>
        </p>
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
        <h2 className="font-display text-[1.2rem] font-black text-[#C99A35]">فريق الحلاقين</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl bg-[#EDE4CE]" />
          ))}
        </div>
      </section>
    );
  }

  if (!barbers.data?.length) return null;

  return (
    <section aria-label="فريق الحلاقين">
      <h2 className="font-display text-[1.2rem] font-black text-[#C99A35]">فريق الحلاقين</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {barbers.data.map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>
    </section>
  );
}
