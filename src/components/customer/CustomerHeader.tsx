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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#111111] font-display text-base font-bold text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
        >
          {firstName ? firstName.charAt(0) : <User className="h-5 w-5" strokeWidth={1.8} />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[1rem] font-extrabold text-foreground">
            مرحباً، {firstName || "صديقنا"}
          </p>
          <p className="truncate text-[0.75rem] font-medium text-muted-foreground">
            صالون حلاق الباشا
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="تسجيل الخروج"
        className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-display text-[0.8rem] font-bold text-muted-foreground transition-all duration-200 hover:border-destructive/30 hover:text-destructive active:scale-95 press"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.8} />
        <span>خروج</span>
      </button>
    </header>
  );
}
