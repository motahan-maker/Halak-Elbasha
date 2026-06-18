import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "basha-theme";

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as ThemeMode | null) ?? "system";
    setMode(stored);
    applyTheme(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => stored === "system" && applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const update = (next: ThemeMode) => {
    setMode(next);
    localStorage.setItem(KEY, next);
    applyTheme(next);
  };
  return { mode, setMode: update };
}
