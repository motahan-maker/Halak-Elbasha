/**
 * Brand header: crossed-scissors logo in an open orange ring,
 * brand name, and tagline. Matches the reference screen.
 */
export function BrandHeader() {
  return (
    <header className="text-center">
      <div
        className="mx-auto grid h-28 w-28 place-items-center"
        role="img"
        aria-label="شعار حلاق الباشا"
      >
        <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
          {/* Open orange ring — gap at the top */}
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="#E8892F"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="250 39"
            transform="rotate(294 60 60)"
          />
          {/* Blade 1: top-left to bottom-right */}
          <line
            x1="52"
            y1="16"
            x2="72"
            y2="88"
            stroke="#171717"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Blade 2: top-right to bottom-left */}
          <line
            x1="68"
            y1="16"
            x2="48"
            y2="88"
            stroke="#171717"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Pivot screw */}
          <circle cx="60" cy="52" r="3.5" fill="#171717" />
          {/* Finger rings */}
          <circle cx="76" cy="98" r="9" fill="none" stroke="#171717" strokeWidth="5" />
          <circle cx="44" cy="98" r="9" fill="none" stroke="#171717" strokeWidth="5" />
        </svg>
      </div>

      <h1 className="mt-5 font-display text-[2.9rem] font-black leading-none tracking-tight text-[#171717]">
        حلاق الباشا
      </h1>
      <p className="mt-3 text-[1.05rem] font-medium text-[#171717]">احجز موعدك بلمسة واحدة</p>
    </header>
  );
}
