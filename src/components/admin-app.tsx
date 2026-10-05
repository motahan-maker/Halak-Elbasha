import { useState, lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Users,
  Scissors,
  CalendarDays,
  Tag,
  Star,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";

const Overview = lazy(() => import("./admin/overview").then((m) => ({ default: m.Overview })));
const BarbersAdmin = lazy(() =>
  import("./admin/barbers").then((m) => ({ default: m.BarbersAdmin })),
);
const ServicesAdmin = lazy(() =>
  import("./admin/services").then((m) => ({ default: m.ServicesAdmin })),
);
const BookingsAdmin = lazy(() =>
  import("./admin/bookings").then((m) => ({ default: m.BookingsAdmin })),
);
const OffersAdmin = lazy(() => import("./admin/offers").then((m) => ({ default: m.OffersAdmin })));
const ReviewsAdmin = lazy(() =>
  import("./admin/reviews").then((m) => ({ default: m.ReviewsAdmin })),
);
const SettingsAdmin = lazy(() =>
  import("./admin/settings").then((m) => ({ default: m.SettingsAdmin })),
);

type AdminTab =
  | "overview"
  | "barbers"
  | "services"
  | "bookings"
  | "offers"
  | "reviews"
  | "settings";

function TabLoader() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    </div>
  );
}

const TABS: { k: AdminTab; label: string; icon: React.ReactNode }[] = [
  { k: "overview", label: "نظرة عامة", icon: <TrendingUp className="h-4 w-4" strokeWidth={1.8} /> },
  { k: "barbers", label: "الحلاقون", icon: <Users className="h-4 w-4" strokeWidth={1.8} /> },
  { k: "services", label: "الخدمات", icon: <Scissors className="h-4 w-4" strokeWidth={1.8} /> },
  {
    k: "bookings",
    label: "الحجوزات",
    icon: <CalendarDays className="h-4 w-4" strokeWidth={1.8} />,
  },
  { k: "offers", label: "العروض", icon: <Tag className="h-4 w-4" strokeWidth={1.8} /> },
  { k: "reviews", label: "التقييمات", icon: <Star className="h-4 w-4" strokeWidth={1.8} /> },
  {
    k: "settings",
    label: "الإعدادات",
    icon: <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />,
  },
];

export function AdminApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-10 md:pb-0">
      {/* ---------- Mobile header (tabs below) ---------- */}
      <header className="sticky top-0 z-30 glass md:hidden">
        <div className="mx-auto max-w-4xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <BrandMark name="لوحة المدير" sub={auth.profile?.full_name} />
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <SignOutButton onSignOut={signOut} />
            </div>
          </div>
          <nav
            aria-label="أقسام الإدارة"
            className="scrollbar-none -mx-4 mt-2.5 overflow-x-auto px-4"
          >
            <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/70 bg-secondary/50 p-1">
              {TABS.map((t) => {
                const active = tab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "press flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11.5px] font-extrabold transition-all duration-200",
                      active
                        ? "border-[#C99A35]/35 bg-card text-[#8A6414] shadow-card dark:text-[#E3B95A]"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* ---------- Desktop: premium RTL sidebar ---------- */}
      <div className="mx-auto hidden max-w-6xl gap-6 px-6 py-6 md:flex">
        <aside className="sticky top-6 flex h-[calc(100vh-3rem)] w-60 shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 px-1 pb-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-gold-foreground shadow-glow-gold">
              <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-extrabold text-foreground">
                حلاق الباشا
              </div>
              <div className="truncate text-[10.5px] font-semibold text-muted-foreground">
                لوحة المدير
              </div>
            </div>
          </div>
          <nav aria-label="أقسام الإدارة" className="flex-1 space-y-1 overflow-y-auto">
            {TABS.map((t) => {
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[0.83rem] font-extrabold transition-all duration-200",
                    active
                      ? "bg-[#C99A35]/12 text-[#8A6414] ring-1 ring-inset ring-[#C99A35]/30 dark:text-[#E3B95A]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {t.icon}
                  {t.label}
                  {active && (
                    <span aria-hidden className="ms-auto h-5 w-1 rounded-full bg-[#C99A35]" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border/60 pt-3">
            <div className="flex items-center gap-2.5 px-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C99A35]/15 font-display text-sm font-black text-[#8A6414] dark:text-[#E3B95A]">
                {(auth.profile?.full_name ?? "م").charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-extrabold text-foreground">
                  {auth.profile?.full_name ?? "المدير"}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground">مدير النظام</div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={signOut}
              className="press mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 py-2.5 text-xs font-bold text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4 pt-1">
          <Suspense fallback={<TabLoader />}>
            {tab === "overview" && <Overview />}
            {tab === "barbers" && <BarbersAdmin />}
            {tab === "services" && <ServicesAdmin />}
            {tab === "bookings" && <BookingsAdmin />}
            {tab === "offers" && <OffersAdmin />}
            {tab === "reviews" && <ReviewsAdmin />}
            {tab === "settings" && <SettingsAdmin />}
          </Suspense>
        </main>
      </div>

      {/* ---------- Mobile content ---------- */}
      <main className="mx-auto max-w-4xl space-y-4 px-4 pt-5 md:hidden">
        <Suspense fallback={<TabLoader />}>
          {tab === "overview" && <Overview />}
          {tab === "barbers" && <BarbersAdmin />}
          {tab === "services" && <ServicesAdmin />}
          {tab === "bookings" && <BookingsAdmin />}
          {tab === "offers" && <OffersAdmin />}
          {tab === "reviews" && <ReviewsAdmin />}
          {tab === "settings" && <SettingsAdmin />}
        </Suspense>
      </main>
    </div>
  );
}

function BrandMark({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-gold-foreground shadow-glow-gold">
        <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-[15px] font-extrabold leading-tight text-foreground">
          {name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_18%,transparent)] animate-pulse" />
          <span className="truncate text-[10.5px] font-semibold text-muted-foreground">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      onClick={onSignOut}
      aria-label="خروج"
      className="press hit-area grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition-all duration-200 hover:border-destructive/40 hover:text-destructive"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.7} />
    </button>
  );
}
