export function CurvedWorkingAnimation() {
  return (
    <svg
      width="34"
      height="16"
      viewBox="0 0 34 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0 align-middle overflow-visible"
    >
      <style>{`
        @keyframes wave-pulse-motion {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      {/* Background glowing curve line */}
      <path
        d="M 2 8 C 6 1, 11 15, 17 8 C 23 1, 28 15, 32 8"
        stroke="#d97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Animated active wave pulse beam */}
      <path
        d="M 2 8 C 6 1, 11 15, 17 8 C 23 1, 28 15, 32 8"
        stroke="#f59e0b"
        strokeWidth="3.5"
        strokeLinecap="round"
        style={{
          strokeDasharray: "14 18",
          animation: "wave-pulse-motion 1.1s linear infinite",
          filter: "drop-shadow(0 0 4px #f59e0b)",
        }}
      />
    </svg>
  );
}




