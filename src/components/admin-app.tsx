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
    { k: "overview", label: "نظرة عامة", icon: <TrendingUp className="h-4 w-4" /> },
    { k: "barbers", label: "الحلاقون", icon: <Users className="h-4 w-4" /> },
    { k: "services", label: "الخدمات", icon: <Scissors className="h-4 w-4" /> },
    { k: "bookings", label: "الحجوزات", icon: <CalendarDays className="h-4 w-4" /> },
    { k: "offers", label: "العروض", icon: <Tag className="h-4 w-4" /> },
    { k: "reviews", label: "التقييمات", icon: <Star className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground shadow-card">
                <Cog className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">لوحة المدير</div>
                <div className="truncate text-xs text-muted-foreground">
                  {auth.profile?.full_name}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="grid h-9 w-9 place-items-center rounded-full border border-border transition-all duration-200 hover:bg-muted active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="-mx-4 mt-3 overflow-x-auto px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    tab === t.k
                      ? "gradient-luxe text-primary-foreground shadow-card"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.icon}
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
