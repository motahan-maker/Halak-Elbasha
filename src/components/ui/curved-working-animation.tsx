export function CurvedWorkingAnimation() {
  return (
    <svg
      width="28"
      height="12"
      viewBox="0 0 28 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0 overflow-visible align-middle"
    >
      <defs>
        <linearGradient id="curved-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Background smooth wave curve */}
      <path
        d="M 2 6 C 6 1, 10 11, 14 6 C 18 1, 22 11, 26 6"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="opacity-30"
      />
      {/* Animated glowing wave beam moving along curve */}
      <path
        d="M 2 6 C 6 1, 10 11, 14 6 C 18 1, 22 11, 26 6"
        stroke="url(#curved-wave-gradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
        style={{
          strokeDasharray: "10 20",
          animation: "wave-pulse-dash 1.2s linear infinite",
        }}
      />
    </svg>
  );
}


