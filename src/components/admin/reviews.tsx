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
      toast.success("تم حذف التقييم");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
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
    <div className="space-y-3">
      {list.data?.map((r: any) => (
        <div
          key={r.id}
          className="rounded-3xl border border-border bg-card p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${
                        n <= r.rating
                          ? "fill-[#111111] text-[#111111] dark:fill-[#F6F1E8] dark:text-[#F6F1E8]"
                          : "text-muted-foreground/30"
                      }`}
                      strokeWidth={n <= r.rating ? 0 : 1.5}
                    />
                  ))}
                </div>
                <span className="ms-1 font-display text-xs font-bold tnum text-foreground">
                  {Number(r.rating).toFixed(1)}
                </span>
              </div>

              <div className="mt-2 truncate font-display text-[0.95rem] font-bold text-foreground">
                {r.customer_name} <span className="text-muted-foreground">←</span> {r.barber_name}
              </div>

              {r.comment && (
                <p className="mt-1.5 font-display text-xs leading-relaxed text-muted-foreground">
                  {r.comment}
                </p>
              )}

              {r.created_at && (
                <div className="mt-2 text-[10px] font-bold tnum text-muted-foreground">
                  {arabicDate(String(r.created_at).slice(0, 10))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (confirm("حذف هذا التقييم نهائياً؟")) del.mutate(r.id);
              }}
              aria-label="حذف التقييم"
              className="grid h-8 w-8 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition-all duration-200 hover:bg-destructive/20 shrink-0 press"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      ))}

      {!list.data?.length && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <div className="font-display text-xs font-bold text-foreground">لا توجد تقييمات</div>
          <div className="mt-1 text-[11px] text-muted-foreground">ستظهر هنا تقييمات العملاء فور إرسالها</div>
        </div>
      )}
    </div>
  );
}
