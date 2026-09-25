import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CustomerApp } from "@/components/customer-app";
import { BarberApp } from "@/components/barber-app";
import { AdminApp } from "@/components/admin-app";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حلاق الباشا - حجوزات" },
      { name: "description", content: "احجز موعدك مع حلاق الباشا بضغطة واحدة" },
    ],
  }),
  component: Index,
});

function Index() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading && !auth.user) navigate({ to: "/auth", replace: true });
  }, [auth.loading, auth.user, navigate]);

  if (auth.loading || !auth.user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background" dir="rtl">
        <div className="animate-fade-in-up text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.6rem] gradient-gold shadow-glow-gold ring-1 ring-inset ring-gold/35 animate-glow-pulse">
            <Scissors className="h-12 w-12 text-gold-foreground animate-pulse-soft" strokeWidth={1.5} />
          </div>
          <div className="mt-6 font-display text-sm font-extrabold text-foreground">حلاق الباشا</div>
          <div className="mt-1 text-[11px] font-semibold text-muted-foreground">جارٍ التحميل...</div>
          <div className="mx-auto mt-4 h-1 w-32 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full animate-shimmer rounded-full gradient-gold" />
          </div>
        </div>
      </div>
    );
  }

  if (auth.role === "admin") return <AdminApp />;
  if (auth.role === "barber") return <BarberApp />;
  return <CustomerApp />;
}
