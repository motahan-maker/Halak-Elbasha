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
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#111111] text-[#FFFFFF] shadow-luxe dark:bg-[#F6F1E8] dark:text-[#111111]">
            <Scissors className="h-10 w-10 animate-pulse-soft" strokeWidth={1.8} />
          </div>
          <div className="mt-5 font-display text-base font-black text-foreground">حلاق الباشا</div>
          <div className="mt-1 font-display text-xs text-muted-foreground">جارٍ التحميل...</div>
          <div className="mx-auto mt-4 h-1 w-28 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full animate-shimmer rounded-full bg-[#111111] dark:bg-[#F6F1E8]" />
          </div>
        </div>
      </div>
    );
  }

  if (auth.role === "admin") return <AdminApp />;
  if (auth.role === "barber") return <BarberApp />;
  return <CustomerApp />;
}
