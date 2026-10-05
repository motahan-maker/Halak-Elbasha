import { LogOut, User } from "lucide-react";

interface CustomerHeaderProps {
  userName: string | undefined;
  onSignOut: () => void;
}

/** Greeting + customer avatar on one side, logout on the other. */
export function CustomerHeader({ userName, onSignOut }: CustomerHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";
  return (
    <header className="flex min-h-14 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#C99A35] font-display text-lg font-black text-white shadow-[0_8px_18px_-8px_rgba(201,154,53,0.8)]"
        >
          {firstName ? firstName.charAt(0) : <User className="h-5 w-5" strokeWidth={2} />}
        </span>
        <p className="truncate font-display text-[1.05rem] font-extrabold text-[#24130D]">
          مرحباً، {firstName || "صديقنا"}
        </p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="تسجيل الخروج"
        className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[0.85rem] font-bold text-[#24130D]/70 transition-colors duration-200 hover:text-[#D86620] press"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
        تسجيل الخروج
      </button>
    </header>
  );
}
