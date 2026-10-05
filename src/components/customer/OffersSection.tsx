import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "lucide-react";
import type { HomeOffer } from "./types";

function OfferCard({ offer }: { offer: HomeOffer }) {
  return (
    <article className="relative flex w-[230px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#111111] font-display text-[1rem] font-black text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]">
            {offer.discount_percent != null ? (
              <span className="tnum">
                {offer.discount_percent}
                <span className="text-[0.65rem] font-bold">٪</span>
              </span>
            ) : (
              <Tag className="h-5 w-5" strokeWidth={1.8} />
            )}
          </span>
          <span className="rounded-full border border-border bg-secondary px-2.5 py-1 font-display text-[0.68rem] font-bold text-muted-foreground">
            عرض خاص
          </span>
        </div>
        <h3 className="mt-4 font-display text-[1rem] font-bold leading-snug text-foreground">
          {offer.title}
        </h3>
        {offer.description && (
          <p className="mt-1.5 whitespace-pre-line font-display text-[0.8rem] font-medium leading-relaxed text-muted-foreground">
            {offer.description}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        <span className="font-display text-[0.75rem] font-bold text-foreground">
          خصم حصري عند الحجز
        </span>
      </div>
    </article>
  );
}

export function OffersSection() {
  const offers = useQuery<HomeOffer[]>({
    queryKey: ["offers", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, description, discount_percent")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as HomeOffer[];
    },
  });

  if (offers.isLoading) {
    return (
      <section aria-label="العروض الحالية">
        <h2 className="font-display text-[1.15rem] font-black text-foreground">العروض الحالية</h2>
        <div className="scrollbar-none mt-3 flex gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-44 w-[230px] shrink-0 animate-shimmer rounded-3xl border border-border bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!offers.data?.length) return null;

  return (
    <section aria-label="العروض الحالية">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[1.15rem] font-black text-foreground">العروض الحالية</h2>
        <span className="font-display text-[0.75rem] font-bold text-muted-foreground">
          {offers.data.length} عروض
        </span>
      </div>
      <div className="scrollbar-none -mx-4 mt-3.5 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {offers.data.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}
