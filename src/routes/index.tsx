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
        <div className="text-center animate-fade-in-up">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] bg-primary shadow-luxe">
            <Scissors className="h-10 w-10 text-primary-foreground animate-pulse-soft" strokeWidth={1.5} />
          </div>
          <div className="mt-6 text-sm font-medium text-muted-foreground">جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  if (auth.role === "admin") return <AdminApp />;
  if (auth.role === "barber") return <BarberApp />;
  return <CustomerApp />;
}
