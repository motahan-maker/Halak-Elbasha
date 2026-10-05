import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { arabicDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Search, CalendarDays, Clock, User, Phone, Check, XCircle } from "lucide-react";

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
      toast.success("تم تحديث حالة الحجز");
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-border bg-card px-4 shadow-card focus-within:border-foreground">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو رقم الجوال أو رقم الحجز..."
            className="w-full bg-transparent py-3 font-display text-xs font-medium outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-2xl border border-border bg-card px-4 py-3 font-display text-xs font-bold text-foreground outline-none shadow-card focus:border-foreground"
        >
          <option value="all">جميع الحالات</option>
          <option value="booked">محجوز</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled_by_barber">ملغي بواسطة الحلاق</option>
          <option value="cancelled_by_customer">ملغي بواسطة العميل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.map((b: any) => (
          <div
            key={b.id}
            className="rounded-3xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-[1rem] font-bold text-foreground">
                    {b.customer_name}
                  </span>
                  <span
                    className={`chip ${
                      b.status === "completed"
                        ? "chip-success"
                        : String(b.status).startsWith("cancelled")
                          ? "chip-danger"
                          : "chip-gold"
                    }`}
                  >
                    {b.status === "completed"
                      ? "مكتمل"
                      : String(b.status).startsWith("cancelled")
                        ? "ملغي"
                        : "محجوز"}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{b.service_name}</span>
                  <span>•</span>
                  <span className="font-bold tnum text-foreground">{b.service_price} ج.م</span>
                  <span>•</span>
                  <span className="tnum" dir="ltr">{b.customer_phone}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {arabicDate(b.booking_date)}
                  </span>
                  <span className="flex items-center gap-1 tnum">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {formatTime(b.booking_time)}
                  </span>
                </div>
              </div>

              <div className="text-end shrink-0">
                <span className="font-display text-xs font-bold tnum text-muted-foreground">
                  #{b.booking_number}
                </span>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2 border-t border-border/70 pt-3">
              <a
                href={`tel:${b.customer_phone}`}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.8} /> اتصال
              </a>

              {b.status === "booked" && (
                <>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "completed" })}
                    className="flex min-h-9 items-center justify-center gap-1 rounded-xl bg-[#111111] px-3 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> تم
                  </button>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "cancelled" })}
                    className="flex min-h-9 items-center justify-center gap-1 rounded-xl border border-destructive/30 bg-destructive/10 px-3 font-display text-xs font-bold text-destructive hover:bg-destructive/20 press"
                  >
                    <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> إلغاء
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            لا توجد حجوزات مطابقة للبحث
          </div>
        )}
      </div>
    </div>
  );
}
