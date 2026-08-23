import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
          className="rounded-xl border border-border bg-card p-4 shadow-card animate-fade-in-up transition-all duration-300 hover:shadow-elevated hover:border-primary/15"
          style={{ animationDelay: `${0.03 * i}s` }}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    strokeWidth={n <= r.rating ? 0 : 1.5}
                    className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <div className="mt-1.5 truncate text-sm font-bold text-foreground">
                {r.customer_name} ← {r.barber_name}
              </div>
              {r.comment && <div className="mt-1 text-xs text-muted-foreground font-medium">{r.comment}</div>}
            </div>
            <button
              onClick={() => del.mutate(r.id)}
              aria-label="حذف التقييم"
              className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 transition-all duration-200 hover:bg-destructive/20 active:scale-90 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
      {!list.data?.length && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/15 p-8 text-center text-xs font-medium text-muted-foreground">
          لا توجد تقييمات
        </div>
      )}
    </div>
  );
}
