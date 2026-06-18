import { useState, useEffect } from "react";

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
      <div className="rounded-2xl bg-gradient-to-l from-amber-600 to-amber-500 p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
            📲
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">تثبيت حلاق الباشا</p>
            <p className="mt-0.5 text-xs text-white/80">أضف التطبيق إلى شاشة هاتفك للوصول السريع</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-amber-700 shadow-lg transition-transform active:scale-95"
          >
            تثبيت الآن
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
