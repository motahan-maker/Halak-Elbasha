export function CurvedWorkingAnimation() {
  return (
    <svg
      width="26"
      height="12"
      viewBox="0 0 26 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0 overflow-visible align-middle"
    >
      <defs>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Background smooth wave curve */}
      <path
        d="M 1 6 C 5 1, 9 11, 13 6 C 17 1, 21 11, 25 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="opacity-25"
      />
      {/* Animated glowing wave beam moving along curve */}
      <path
        d="M 1 6 C 5 1, 9 11, 13 6 C 17 1, 21 11, 25 6"
        stroke="url(#wave-grad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="animate-wave-pulse"
        style={{
          strokeDasharray: "8 18",
        }}
      />
    </svg>
  );
}

