export function CurvedWorkingAnimation() {
  return (
    <svg
      width="32"
      height="14"
      viewBox="0 0 32 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block shrink-0 align-middle"
    >
      <style>{`
        @keyframes wave-beam-move {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      {/* Background soft curved path */}
      <path
        d="M 2 7 Q 8 1, 16 7 T 30 7"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Glowing animated wave beam path */}
      <path
        d="M 2 7 Q 8 1, 16 7 T 30 7"
        stroke="#f59e0b"
        strokeWidth="3.2"
        strokeLinecap="round"
        style={{
          strokeDasharray: "12 16",
          animation: "wave-beam-move 1.2s linear infinite",
          filter: "drop-shadow(0 0 3px rgba(245, 158, 11, 0.8))",
        }}
      />
    </svg>
  );
}



