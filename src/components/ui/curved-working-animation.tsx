export function CurvedWorkingAnimation() {
  return (
    <svg
      width="22"
      height="10"
      viewBox="0 0 22 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0 overflow-visible align-middle"
    >
      {/* Soft background curve path */}
      <path
        d="M 1 5 C 4 0, 7 10, 11 5 C 15 0, 18 10, 21 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="opacity-25"
      />
      {/* Animated glowing wave particle segment travelling along curve */}
      <path
        d="M 1 5 C 4 0, 7 10, 11 5 C 15 0, 18 10, 21 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="animate-wave-pulse"
        style={{
          strokeDasharray: "7 20",
        }}
      />
    </svg>
  );
}
