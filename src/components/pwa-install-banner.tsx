import { useState, useEffect } from "react";
import { Smartphone, X } from "lucide-react";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
  }
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<WindowEventMap["beforeinstallprompt"] | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as WindowEventMap["beforeinstallprompt"]);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShow(true);
    };

    const installedHandler = () => {
      setInstalled(true);
      setShow(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }
    setDeferred(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (installed || !show || !deferred) return null;

  return (
    <div className="pwa-banner-animate fixed bottom-4 right-4 left-4 z-50 md:left-auto md:w-96">
      <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-card p-4 shadow-elevated">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent"
        />
        <button
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="press absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-3 pe-7">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-gold text-gold-foreground shadow-glow-gold ring-1 ring-inset ring-gold/35">
            <Smartphone className="h-5.5 w-5.5" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[0.88rem] font-extrabold text-foreground">تثبيت حلاق الباشا</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
              أضف التطبيق إلى شاشة هاتفك للوصول السريع
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex gap-2">
          <button
            onClick={handleInstall}
            className="press flex-1 rounded-xl gradient-gold px-4 py-2.5 font-display text-[12.5px] font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-200 hover:brightness-110"
          >
            تثبيت الآن
          </button>
          <button
            onClick={handleDismiss}
            className="press rounded-xl border border-border/70 bg-secondary px-4 py-2.5 text-[12px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
