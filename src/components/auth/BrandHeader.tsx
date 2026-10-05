/**
 * Brand header: crossed-scissors emblem in obsidian #111111,
 * brand title in Cairo, and tagline.
 */
export function BrandHeader() {
  return (
    <header className="text-center">
      <div
        className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#111111] text-[#FFFFFF] shadow-luxe dark:bg-[#F6F1E8] dark:text-[#111111]"
        role="img"
        aria-label="شعار حلاق الباشا"
      >
        <svg viewBox="0 0 120 120" className="h-16 w-16" fill="currentColor" aria-hidden>
          {/* Subtle outer geometric ring */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 6"
            opacity="0.3"
          />
          {/* Crossed scissors blades */}
          <line
            x1="48"
            y1="22"
            x2="72"
            y2="82"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <line
            x1="72"
            y1="22"
            x2="48"
            y2="82"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Center pivot */}
          <circle cx="60" cy="52" r="3.5" fill="currentColor" />
          {/* Finger rings */}
          <circle cx="76" cy="92" r="9" fill="none" stroke="currentColor" strokeWidth="4.5" />
          <circle cx="44" cy="92" r="9" fill="none" stroke="currentColor" strokeWidth="4.5" />
        </svg>
      </div>

      <h1 className="mt-5 font-display text-[2.4rem] font-black leading-tight tracking-tight text-[#111111] dark:text-[#F6F1E8]">
        حلاق الباشا
      </h1>
      <p className="mt-1.5 font-display text-[0.95rem] font-medium text-[#8A857D]">
        احجز موعدك بلمسة واحدة
      </p>
    </header>
  );
}
