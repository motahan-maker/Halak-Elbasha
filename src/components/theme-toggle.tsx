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
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
            mode === o.v
              ? "bg-card text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
