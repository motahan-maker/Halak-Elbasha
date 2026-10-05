import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { v: "light", icon: <Sun className="h-4 w-4" strokeWidth={1.8} />, label: "نهاري" },
    { v: "dark", icon: <Moon className="h-4 w-4" strokeWidth={1.8} />, label: "ليلي" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setMode(o.v)}
          aria-label={o.label}
          aria-pressed={mode === o.v}
          className={`grid h-7 w-7 cursor-pointer place-items-center rounded-full transition-all duration-200 press ${
            mode === o.v
              ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
