import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, Power, Tag } from "lucide-react";

export function OffersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () =>
      (await supabase.from("offers").select("*").order("created_at", { ascending: false })).data ??
      [],
  });
  const create = useMutation({
    mutationFn: async (d: any) => {
      const { error } = await supabase.from("offers").insert(d);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("تمت الإضافة");
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { error } = await supabase.from("offers").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
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
    <div className="space-y-2.5">
      <button
        onClick={() => setOpen(true)}
        className="press flex w-full items-center justify-center gap-2 rounded-2xl gradient-gold px-4 py-3.5 font-display text-sm font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-110"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} /> إضافة عرض
      </button>
      {open && <OfferForm onCancel={() => setOpen(false)} onSave={(d: any) => create.mutate(d)} />}
      {list.data?.map((o: any, i: number) => (
        <div key={o.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
          <OfferRow
            o={o}
            onSave={(d: any) => update.mutate({ id: o.id, ...d })}
            onToggle={() => update.mutate({ id: o.id, is_active: !o.is_active })}
            onDelete={() => {
              if (confirm(`حذف عرض «${o.title}» نهائياً؟`)) del.mutate(o.id);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function OfferForm({ onCancel, onSave, initial }: any) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [pct, setPct] = useState(initial?.discount_percent ?? "");
  return (
    <div className="animate-scale-in space-y-3 rounded-2xl border border-gold/25 bg-card p-4 shadow-elevated">
      <Input label="عنوان العرض" value={title} onChange={setTitle} />
      <Input label="الوصف" value={desc} onChange={setDesc} />
      <Input label="نسبة الخصم %" value={String(pct)} onChange={setPct} type="number" />
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() =>
            onSave({ title, description: desc, discount_percent: pct === "" ? null : Number(pct) })
          }
          disabled={!title}
          className="press flex-1 rounded-xl bg-primary py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-105 disabled:opacity-50"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="press rounded-xl border border-border/70 bg-secondary px-4 py-2.5 text-[12px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground">
          إلغاء
        </button>
      </div>
    </div>
  );
}

function OfferRow({ o, onSave, onToggle, onDelete }: any) {
  const [edit, setEdit] = useState(false);
  if (edit)
    return (
      <OfferForm
        initial={o}
        onCancel={() => setEdit(false)}
        onSave={(d: any) => {
          onSave(d);
          setEdit(false);
        }}
      />
    );
  return (
    <div className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="relative grid h-9.5 w-9.5 place-items-center rounded-xl bg-accent text-accent-foreground ring-1 ring-inset ring-gold/25 shrink-0">
        <Tag className="h-4.5 w-4.5" strokeWidth={1.7} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="truncate font-display text-[0.9rem] font-extrabold text-foreground">{o.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-muted-foreground">
          <span className="truncate">{o.description || "—"}</span>
          {o.discount_percent != null && (
            <span className="shrink-0 tnum font-bold text-accent-foreground">-{o.discount_percent}٪</span>
          )}
        </div>
      </div>
      <div className="relative flex shrink-0 gap-1.5">
        <button
          onClick={() => setEdit(true)}
          aria-label="تعديل"
          className="press grid h-8 w-8 place-items-center rounded-xl border border-border/70 bg-secondary text-muted-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
        >
          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
        <button
          onClick={onToggle}
          aria-label="تفعيل"
          className={`press grid h-8 w-8 place-items-center rounded-xl border transition-all duration-200 ${o.is_active ? "border-success/25 bg-success/10 text-success" : "border-border/70 bg-secondary text-muted-foreground"}`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
        <button
          onClick={onDelete}
          aria-label="حذف"
          className="press grid h-8 w-8 place-items-center rounded-xl border border-destructive/25 bg-destructive/[0.06] text-destructive transition-all duration-200 hover:bg-destructive/12"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-[11.5px] font-semibold text-foreground outline-none transition-all duration-200 focus:border-gold/45 focus:bg-card focus:ring-2 focus:ring-gold/20"
      />
    </div>
  );
}
