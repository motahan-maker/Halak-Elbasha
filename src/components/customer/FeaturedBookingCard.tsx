import { CalendarDays, Scissors } from "lucide-react";

interface FeaturedBookingCardProps {
  shopName: string;
  onStart: () => void;
}

/** Obsidian luxury hero card with high-contrast primary booking CTA. */
export function FeaturedBookingCard({ shopName, onStart }: FeaturedBookingCardProps) {
  return (
    <section
      aria-label="احجز موعدك"
      className="relative overflow-hidden rounded-3xl bg-[#111111] p-6 text-[#F6F1E8] shadow-luxe ring-1 ring-white/10 dark:bg-[#141414] dark:ring-white/5"
    >
      {/* Subtle geometric line art background */}
      <span
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-10 h-44 w-44 rounded-full border border-white/5"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -end-4 -top-4 h-28 w-28 rounded-full border border-white/10"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[#F6F1E8]">
            <Scissors className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="font-display text-[0.75rem] font-bold tracking-wide text-[#8A857D]">
            حلاقة راقية • عناية متكاملة
          </span>
        </div>

        <h2 className="mt-3 font-display text-[1.45rem] font-black leading-snug text-[#FFFFFF]">
          يسعدنا خدمتك في {shopName}
        </h2>
        <p className="mt-1.5 font-display text-[0.85rem] font-medium text-[#8A857D]">
          اختر خدمتك وحلاقك المفضل واحجز في ثوانٍ
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#F6F1E8] py-3.5 font-display text-[1.05rem] font-black text-[#111111] shadow-card transition-all duration-200 hover:bg-[#FFFFFF] active:bg-[#EFE8DC] press"
        >
          <CalendarDays className="h-5 w-5 text-[#111111]" strokeWidth={2} />
          <span>ابدأ الحجز الآن</span>
        </button>
      </div>
    </section>
  );
}
