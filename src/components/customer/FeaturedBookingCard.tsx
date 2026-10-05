import { CalendarDays } from "lucide-react";

interface FeaturedBookingCardProps {
  shopName: string;
  onStart: () => void;
}

/** Dark-brown hero with gold frame and the primary booking CTA. */
export function FeaturedBookingCard({ shopName, onStart }: FeaturedBookingCardProps) {
  return (
    <section
      aria-label="احجز موعدك"
      className="relative overflow-hidden rounded-[1.75rem] bg-[#24130D] p-6 shadow-[0_24px_50px_-20px_rgba(36,19,13,0.65)] ring-1 ring-[#C99A35]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-2 rounded-[1.3rem] border border-[#C99A35]/50"
      />
      <div className="relative">
        <p className="font-display text-[0.8rem] font-bold text-[#C99A35]">تجربة فاخرة</p>
        <h2 className="mt-2 font-display text-[1.5rem] font-black leading-snug text-white">
          يسعدنا خدمتك في {shopName}
        </h2>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#D86620] to-[#C99A35] py-4 font-display text-[1.1rem] font-extrabold text-white shadow-[0_16px_30px_-12px_rgba(216,102,32,0.8)] transition-all duration-200 hover:brightness-105 active:translate-y-px press"
        >
          <CalendarDays className="h-5 w-5" strokeWidth={2} />
          ابدأ الحجز
        </button>
      </div>
    </section>
  );
}
