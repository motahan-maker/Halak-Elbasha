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
import { AlertTriangle } from "lucide-react";

import appCss from "../styles.css?url";
import { PwaInstallBanner } from "../components/pwa-install-banner";
import { OfflineIndicator } from "../components/offline-indicator";
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md animate-fade-in-up text-center">
        <h1 className="font-display text-8xl font-black text-gradient-gold animate-float">٤٠٤</h1>
        <h2 className="mt-5 font-display text-xl font-extrabold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">الصفحة التي تبحث عنها غير موجودة.</p>
        <div className="mt-8">
          <Link
            to="/"
            className="press inline-flex items-center justify-center rounded-2xl gradient-gold px-8 py-3.5 font-display text-sm font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-110"
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
      <div className="max-w-md animate-fade-in-up text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive shadow-card">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.7} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-black text-foreground">حدث خطأ</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">حاول إعادة المحاولة</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press rounded-2xl gradient-gold px-6 py-3 font-display text-sm font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-110"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="press rounded-2xl border border-border/70 bg-secondary px-6 py-3 text-sm font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
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
