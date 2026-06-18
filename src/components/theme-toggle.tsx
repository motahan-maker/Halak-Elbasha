import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { v: "light", icon: <Sun className="h-4 w-4" />, label: "نهاري" },
    { v: "dark", icon: <Moon className="h-4 w-4" />, label: "ليلي" },
    { v: "system", icon: <Monitor className="h-4 w-4" />, label: "تلقائي" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 backdrop-blur">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setMode(o.v)}
          aria-label={o.label}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            mode === o.v
              ? "bg-primary text-primary-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
