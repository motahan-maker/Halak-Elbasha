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
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث (اسم/جوال/رقم)"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="all">الكل</option>
          <option value="booked">محجوز</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map((b: any, i: number) => (
          <div
            key={b.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-card animate-fade-in-up transition-all duration-200 hover:shadow-luxe"
            style={{ animationDelay: `${0.03 * i}s` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{b.customer_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {b.service_name} • {b.customer_phone}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {arabicDate(b.booking_date)} • {formatTime(b.booking_time)}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
                {b.booking_number}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {b.status === "booked" && (
                <>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "completed" })}
                    className="flex-1 rounded-lg gradient-luxe py-1.5 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
                  >
                    إكمال
                  </button>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "cancelled" })}
                    className="flex-1 rounded-lg border border-destructive/40 py-1.5 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-95"
                  >
                    إلغاء
                  </button>
                </>
              )}
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${b.status === "completed" ? "bg-success/15 text-success" : b.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
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
