import { CalendarDays, Home, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomerTab = "home" | "bookings" | "offers" | "profile";

interface CustomerBottomNavProps {
  tab: CustomerTab;
  onChange: (tab: CustomerTab) => void;
}

const ITEMS: { key: CustomerTab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "الرئيسية", icon: Home },
  { key: "offers", label: "العروض", icon: Tag },
  { key: "bookings", label: "حجوزاتي", icon: CalendarDays },
  { key: "profile", label: "حسابي", icon: User },
];

/** Fixed white bottom navigation; home is highlighted in gold. */
export function CustomerBottomNav({ tab, onChange }: CustomerBottomNavProps) {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#24130D]/8 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-15px_rgba(36,19,13,0.25)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2">
        {ITEMS.map((item) => {
          const active = tab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 press",
                active ? "text-[#C99A35]" : "text-[#24130D]/45 hover:text-[#24130D]",
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[0.68rem] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
