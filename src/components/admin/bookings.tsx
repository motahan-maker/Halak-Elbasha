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
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-border/70 bg-secondary/30 px-3.5 transition-all duration-200 focus-within:border-gold/45 focus-within:bg-card focus-within:ring-2 focus-within:ring-gold/20">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث (اسم / جوال / رقم)"
            className="w-full bg-transparent py-2.5 text-[11.5px] font-semibold outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-[11.5px] font-bold text-foreground outline-none transition-all duration-200 focus:border-gold/45 focus:ring-2 focus:ring-gold/20"
        >
          <option value="all">الكل</option>
          <option value="booked">محجوز</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled_by_barber">ملغي بواسطة الحلاق</option>
          <option value="cancelled_by_customer">ملغي بواسطة العميل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map((b: any, i: number) => (
          <div
            key={b.id}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated"
            style={{ animationDelay: `${0.03 * i}s` }}
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            <div className="relative flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[0.9rem] font-extrabold text-foreground">{b.customer_name}</div>
                <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-muted-foreground">
                  <span className="truncate">{b.service_name}</span>
                  <span aria-hidden className="text-border">|</span>
                  <span className="tnum shrink-0" dir="ltr">{b.customer_phone}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/85">
                  <span>{arabicDate(b.booking_date)}</span>
                  <span aria-hidden className="text-border">|</span>
                  <span className="tnum font-bold text-foreground/80">{formatTime(b.booking_time)}</span>
                </div>
              </div>
              <span className="chip chip-gold tnum shrink-0">{b.booking_number}</span>
            </div>
            <div className="relative mt-3 flex items-center gap-2.5">
              {b.status === "booked" && (
                <>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "completed" })}
                    className="press flex-1 rounded-xl gradient-gold py-2 text-[11.5px] font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-200 hover:brightness-110"
                  >
                    إكمال
                  </button>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "cancelled_by_barber" })}
                    className="press flex-1 rounded-xl border border-destructive/25 bg-destructive/[0.06] py-2 text-[11.5px] font-bold text-destructive transition-all duration-200 hover:bg-destructive/12"
                  >
                    إلغاء
                  </button>
                </>
              )}
              <span
                className={`chip ${
                  b.status === "completed"
                    ? "chip-success"
                    : String(b.status).startsWith("cancelled")
                    ? "chip-danger"
                    : "chip-gold"
                }`}
              >
                {b.status === "completed" && (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
                {b.status === "booked"
                  ? "محجوز"
                  : b.status === "completed"
                  ? "مكتمل"
                  : b.status === "cancelled_by_barber"
                  ? "ملغي بواسطة الحلاق"
                  : b.status === "cancelled_by_customer"
                  ? "ملغي بواسطة العميل"
                  : "ملغي"}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/15 p-8 text-center">
            <div className="font-display text-[0.82rem] font-extrabold text-foreground">لا توجد حجوزات مطابقة</div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground">جرّب تغيير كلمة البحث أو الفلتر</div>
          </div>
        )}
      </div>
    </div>
  );
}
