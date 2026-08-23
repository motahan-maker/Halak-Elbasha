import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { arabicDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export function BookingsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const list = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () =>
      (
        await supabase
          .from("bookings")
          .select(
            "id, booking_number, customer_name, customer_phone, service_name, service_price, booking_date, booking_time, status, barber_id"
          )
          .order("booking_date", { ascending: false })
          .order("booking_time", { ascending: false })
          .limit(200)
      ).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
  });
  const filtered = (list.data ?? []).filter((b: any) => {
    if (status !== "all" && b.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      b.customer_name?.toLowerCase().includes(s) ||
      b.customer_phone?.includes(q) ||
      b.booking_number?.toLowerCase().includes(s)
    );
  });

  if (list.isLoading) {
    return (
      <div className="space-y-2.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2.5">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3.5 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-card focus-within:border-primary">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث (اسم / جوال / رقم)"
            className="w-full bg-transparent py-2 text-xs font-semibold outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold outline-none text-foreground cursor-pointer transition-all focus:border-primary"
        >
          <option value="all">الكل</option>
          <option value="booked">محجوز</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map((b: any, i: number) => (
          <div
            key={b.id}
            className="rounded-xl border border-border bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:shadow-elevated hover:border-primary/15"
            style={{ animationDelay: `${0.03 * i}s` }}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-sm text-foreground">{b.customer_name}</div>
                <div className="truncate text-xs font-semibold text-muted-foreground mt-0.5">
                  {b.service_name} • {b.customer_phone}
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground/80">
                  {arabicDate(b.booking_date)} • {formatTime(b.booking_time)}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold text-primary">
                {b.booking_number}
              </span>
            </div>
            <div className="mt-3 flex gap-2.5">
              {b.status === "booked" && (
                <>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "completed" })}
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.96] shadow-sm"
                  >
                    إكمال
                  </button>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "cancelled" })}
                    className="flex-1 rounded-xl bg-destructive/10 border border-destructive/20 py-2 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/20 active:scale-[0.96]"
                  >
                    إلغاء
                  </button>
                </>
              )}
              <span
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${b.status === "completed" ? "bg-success/10 text-success border border-success/20" : b.status === "cancelled" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-primary/10 text-primary border border-primary/20"}`}
              >
                {b.status === "booked" ? "محجوز" : b.status === "completed" ? "مكتمل" : "ملغي"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
