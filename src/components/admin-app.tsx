import { useState, lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat } from "@/components/ui/skeleton";
import { LogOut, Users, Scissors, CalendarDays, Tag, Star, Settings as Cog, TrendingUp, SlidersHorizontal } from "lucide-react";

const Overview = lazy(() => import("./admin/overview").then((m) => ({ default: m.Overview })));
const BarbersAdmin = lazy(() => import("./admin/barbers").then((m) => ({ default: m.BarbersAdmin })));
const ServicesAdmin = lazy(() => import("./admin/services").then((m) => ({ default: m.ServicesAdmin })));
const BookingsAdmin = lazy(() => import("./admin/bookings").then((m) => ({ default: m.BookingsAdmin })));
const OffersAdmin = lazy(() => import("./admin/offers").then((m) => ({ default: m.OffersAdmin })));
const ReviewsAdmin = lazy(() => import("./admin/reviews").then((m) => ({ default: m.ReviewsAdmin })));
const SettingsAdmin = lazy(() => import("./admin/settings").then((m) => ({ default: m.SettingsAdmin })));

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

  const tabs: { k: AdminTab; label: string; icon: React.ReactNode }[] = [
    { k: "overview", label: "نظرة عامة", icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "barbers", label: "الحلاقون", icon: <Users className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "services", label: "الخدمات", icon: <Scissors className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "bookings", label: "الحجوزات", icon: <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "offers", label: "العروض", icon: <Tag className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "reviews", label: "التقييمات", icon: <Star className="h-3.5 w-3.5" strokeWidth={1.8} /> },
    { k: "settings", label: "الإعدادات", icon: <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto max-w-4xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center squircle gradient-gold text-gold-foreground shadow-glow-gold">
                <Cog className="h-[22px] w-[22px]" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-[15px] font-extrabold leading-tight text-foreground">
                  لوحة المدير
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_18%,transparent)] animate-pulse" />
                  <span className="truncate text-[10.5px] font-semibold text-muted-foreground">
                    {auth.profile?.full_name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                aria-label="خروج"
                className="press hit-area grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border/70 bg-card/70 text-muted-foreground transition-all duration-300 hover:border-destructive/40 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <div className="scrollbar-none -mx-4 mt-2.5 overflow-x-auto px-4">
            <div className="inline-flex min-w-full gap-1 rounded-2xl border border-border/70 bg-secondary/50 p-1">
              {tabs.map((t) => {
                const active = tab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    aria-current={active ? "page" : undefined}
                    className={`press flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11.5px] font-extrabold transition-all duration-300 ${
                      active
                        ? "border-gold/30 bg-card text-accent-foreground shadow-card"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 pt-5">
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
