import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { arabicDate } from "@/lib/format";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Star, Trash2 } from "lucide-react";

export function ReviewsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const [{ data: rev }, { data: bar }] = await Promise.all([
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("barbers").select("id, name"),
      ]);
      const map = new Map((bar ?? []).map((b: any) => [b.id, b.name]));
      return (rev ?? []).map((r: any) => ({ ...r, barber_name: map.get(r.barber_id) ?? "—" }));
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  if (list.isLoading) {
    return (
      <div className="space-y-2.5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.data?.map((r: any, i: number) => (
        <div
          key={r.id}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated"
          style={{ animationDelay: `${0.03 * i}s` }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="relative flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      strokeWidth={n <= r.rating ? 0 : 1.6}
                      className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </span>
                <span className="font-display text-[11px] font-black tnum text-accent-foreground">
                  {Number(r.rating).toFixed(1)}
                </span>
              </div>
              <div className="mt-2 truncate font-display text-[0.88rem] font-extrabold text-foreground">
                {r.customer_name} <span className="text-muted-foreground/60">←</span> {r.barber_name}
              </div>
              {r.comment && (
                <p className="mt-1.5 text-[11.5px] font-medium leading-relaxed text-muted-foreground">
                  {r.comment}
                </p>
              )}
              {r.created_at && (
                <div className="mt-2 text-[10px] font-bold tnum text-muted-foreground/70">
                  {arabicDate(String(r.created_at).slice(0, 10))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (confirm("حذف هذا التقييم نهائياً؟")) del.mutate(r.id);
              }}
              aria-label="حذف التقييم"
              className="press grid h-8 w-8 place-items-center rounded-xl border border-destructive/25 bg-destructive/[0.06] text-destructive transition-all duration-200 hover:bg-destructive/12 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      ))}
      {!list.data?.length && (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/15 p-8 text-center">
          <div className="font-display text-[0.82rem] font-extrabold text-foreground">لا توجد تقييمات</div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">ستظهر هنا بعد تقييم العملاء لخدماتهم</div>
        </div>
      )}
    </div>
  );
}
