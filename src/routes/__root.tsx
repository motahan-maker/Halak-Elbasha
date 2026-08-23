import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { PwaInstallBanner } from "../components/pwa-install-banner";
import { OfflineIndicator } from "../components/offline-indicator";
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center animate-fade-in-up">
        <h1 className="text-8xl font-black text-gradient-gold animate-float">٤٠٤</h1>
        <h2 className="mt-5 text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground font-medium">الصفحة التي تبحث عنها غير موجودة.</p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl gradient-luxe px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow-primary transition-all duration-300 hover:brightness-110 hover:shadow-elevated active:scale-[0.97]"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center animate-fade-in-up">
        <h1 className="text-2xl font-black text-foreground">حدث خطأ</h1>
        <p className="mt-2 text-sm text-muted-foreground font-medium">حاول إعادة المحاولة</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl gradient-luxe px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow-primary transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-foreground border border-border/30 transition-all duration-200 hover:bg-muted active:scale-95"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: "حلاق الباشا - حجوزات" },
      { name: "description", content: "احجز موعدك مع حلاق الباشا — أفضل خدمة حلاقة في المنطقة" },
      { name: "theme-color", content: "#d4a857" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "حلاق الباشا" },
      { property: "og:title", content: "حلاق الباشا - حجوزات" },
      { property: "og:description", content: "احجز موعدك مع حلاق الباشا" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Apply theme before paint
    const stored = (localStorage.getItem("basha-theme") as string) ?? "system";
    const dark =
      stored === "dark" ||
      (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);

  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineIndicator />
      <Outlet />
      <Toaster position="top-center" richColors closeButton dir="rtl" />
      <PwaInstallBanner />
    </QueryClientProvider>
  );
}
