import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "lucide-react";
import type { HomeOffer } from "./types";

function OfferCard({ offer }: { offer: HomeOffer }) {
  return (
    <article className="relative w-[218px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_-20px_rgba(36,19,13,0.35)] ring-1 ring-[#24130D]/5">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#D86620] font-display text-[1.05rem] font-black text-white shadow-[0_10px_20px_-8px_rgba(216,102,32,0.8)]">
            {offer.discount_percent != null ? (
              <span className="tnum">
                {offer.discount_percent}
                <span className="text-[0.65rem] font-extrabold">٪</span>
              </span>
            ) : (
              <Tag className="h-6 w-6" strokeWidth={2} />
            )}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C99A35]/15 text-[#B07E1F]">
            <Tag className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        </div>
        <h3 className="mt-3 font-display text-[1.02rem] font-extrabold leading-snug text-[#24130D]">
          {offer.title}
        </h3>
        {offer.description && (
          <p className="mt-1 min-h-10 whitespace-pre-line text-[0.8rem] font-medium leading-relaxed text-[#24130D]/65">
            {offer.description}
          </p>
        )}
      </div>
      {/* Gold/orange decorative curved bottom */}
      <svg
        viewBox="0 0 218 52"
        preserveAspectRatio="none"
        aria-hidden
        className="block h-[52px] w-full"
      >
        <defs>
          <linearGradient id={`offer-wave-${offer.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#C99A35" />
            <stop offset="1" stopColor="#D86620" />
          </linearGradient>
        </defs>
        <path
          d="M0 30 C 40 8, 80 8, 109 22 C 140 37, 180 40, 218 18 L 218 52 L 0 52 Z"
          fill={`url(#offer-wave-${offer.id})`}
        />
      </svg>
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
        <h2 className="font-display text-[1.2rem] font-black text-[#C99A35]">العروض الحالية</h2>
        <div className="scrollbar-none mt-3 flex gap-3 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-48 w-[218px] shrink-0 animate-pulse rounded-3xl bg-[#EDE4CE]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!offers.data?.length) return null;

  return (
    <section aria-label="العروض الحالية">
      <h2 className="font-display text-[1.2rem] font-black text-[#C99A35]">العروض الحالية</h2>
      <div className="scrollbar-none -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {offers.data.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}
