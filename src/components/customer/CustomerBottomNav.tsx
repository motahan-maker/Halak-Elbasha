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

/**
 * Floating luxury pill navigation bar matching the Design System Reference Image.
 * Active item is a circular obsidian #111111 button with pure white icon.
 */
export function CustomerBottomNav({ tab, onChange }: CustomerBottomNavProps) {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-[340px] px-2"
    >
      <div className="flex items-center justify-between rounded-full border border-[#DAD6CF] bg-[#F6F1E8]/92 p-1.5 shadow-elevated backdrop-blur-xl dark:border-[#2A2A2A] dark:bg-[#141414]/92">
        {ITEMS.map((item) => {
          const active = tab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-all duration-200 press",
                active
                  ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
                  : "text-[#8A857D] hover:bg-[#EFE8DC] hover:text-[#111111] dark:hover:bg-[#202020] dark:hover:text-[#F6F1E8]",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
