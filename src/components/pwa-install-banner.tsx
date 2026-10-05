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
    <div className="fixed bottom-20 right-4 left-4 z-50 md:left-auto md:w-96" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-luxe">
        <button
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="absolute end-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground press"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-3 pe-7">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]">
            <Smartphone className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-foreground">تثبيت تطبيق حلاق الباشا</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              أضف التطبيق لشاشة هاتفك لحجز أسرع وتنبيهات فورية
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-[#111111] py-2.5 font-display text-xs font-bold text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111] press"
          >
            تثبيت التطبيق
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-xl border border-border bg-secondary px-4 py-2.5 font-display text-xs font-bold text-foreground press"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
