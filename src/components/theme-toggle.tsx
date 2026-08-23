import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { v: "light", icon: <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "نهاري" },
    { v: "dark", icon: <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "ليلي" },
    { v: "system", icon: <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "تلقائي" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary/80 p-0.5 border border-border/40">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setMode(o.v)}
          aria-label={o.label}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            mode === o.v
              ? "bg-card text-foreground shadow-sm border border-border/20"
              : "text-muted-foreground/80 hover:text-foreground"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
