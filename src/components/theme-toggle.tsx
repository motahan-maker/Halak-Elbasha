import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { v: "light", icon: <Sun className="h-4 w-4" strokeWidth={1.5} />, label: "نهاري" },
    { v: "dark", icon: <Moon className="h-4 w-4" strokeWidth={1.5} />, label: "ليلي" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full glass-pill p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setMode(o.v)}
          aria-label={o.label}
          aria-pressed={mode === o.v}
          className={`grid h-8 w-8 cursor-pointer place-items-center rounded-full transition-all duration-300 press ${
            mode === o.v
              ? "bg-accent text-accent-foreground ring-1 ring-inset ring-gold/30 shadow-card"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
