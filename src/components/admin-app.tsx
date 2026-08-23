import { useState, lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SkeletonStat } from "@/components/ui/skeleton";
import { LogOut, Users, Scissors, CalendarDays, Tag, Star, Settings as Cog, TrendingUp } from "lucide-react";

const Overview = lazy(() => import("./admin/overview").then((m) => ({ default: m.Overview })));
const BarbersAdmin = lazy(() => import("./admin/barbers").then((m) => ({ default: m.BarbersAdmin })));
const ServicesAdmin = lazy(() => import("./admin/services").then((m) => ({ default: m.ServicesAdmin })));
const BookingsAdmin = lazy(() => import("./admin/bookings").then((m) => ({ default: m.BookingsAdmin })));
const OffersAdmin = lazy(() => import("./admin/offers").then((m) => ({ default: m.OffersAdmin })));
const ReviewsAdmin = lazy(() => import("./admin/reviews").then((m) => ({ default: m.ReviewsAdmin })));

type AdminTab =
  | "overview"
  | "barbers"
  | "services"
  | "bookings"
  | "offers"
  | "reviews";

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
    { k: "overview", label: "نظرة عامة", icon: <TrendingUp className="h-4 w-4" strokeWidth={1.5} /> },
    { k: "barbers", label: "الحلاقون", icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
    { k: "services", label: "الخدمات", icon: <Scissors className="h-4 w-4" strokeWidth={1.5} /> },
    { k: "bookings", label: "الحجوزات", icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} /> },
    { k: "offers", label: "العروض", icon: <Tag className="h-4 w-4" strokeWidth={1.5} /> },
    { k: "reviews", label: "التقييمات", icon: <Star className="h-4 w-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto max-w-4xl px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Cog className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-foreground">لوحة المدير</div>
                <div className="truncate text-[11px] font-semibold text-muted-foreground mt-0.5">
                  {auth.profile?.full_name}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <ThemeToggle />
              <button
                onClick={signOut}
                aria-label="خروج"
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive active:scale-90"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div className="-mx-4 mt-3 overflow-x-auto px-4 scrollbar-none">
            <div className="inline-flex gap-1 bg-secondary/55 p-1 rounded-xl min-w-full border border-border/30">
              {tabs.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-[0.96] ${
                    tab === t.k
                      ? "bg-card text-foreground shadow-card border border-border/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={tab === t.k ? "text-primary" : "text-muted-foreground"}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
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
        </Suspense>
      </main>
    </div>
  );
}
