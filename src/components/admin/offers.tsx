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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-card transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} /> إضافة عرض
      </button>
      {open && <OfferForm onCancel={() => setOpen(false)} onSave={(d: any) => create.mutate(d)} />}
      {list.data?.map((o: any, i: number) => (
        <div key={o.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
          <OfferRow
            o={o}
            onSave={(d: any) => update.mutate({ id: o.id, ...d })}
            onToggle={() => update.mutate({ id: o.id, is_active: !o.is_active })}
            onDelete={() => {
              if (confirm("حذف؟")) del.mutate(o.id);
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
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-card animate-scale-in">
      <Input label="عنوان العرض" value={title} onChange={setTitle} />
      <Input label="الوصف" value={desc} onChange={setDesc} />
      <Input label="نسبة الخصم %" value={String(pct)} onChange={setPct} type="number" />
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() =>
            onSave({ title, description: desc, discount_percent: pct === "" ? null : Number(pct) })
          }
          disabled={!title}
          className="flex-1 rounded-2xl bg-primary py-2 font-bold text-primary-foreground disabled:opacity-50 transition-all duration-300 hover:brightness-110 active:scale-95"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-2xl bg-secondary px-4 py-2 font-bold transition-all duration-300 hover:bg-accent active:scale-95">
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
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated">
      <div className="grid h-10 w-10 place-items-center rounded-[0.85rem] bg-primary text-primary-foreground">
        <Tag className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-[15px]">{o.title}</div>
        <div className="truncate text-[13px] font-semibold text-muted-foreground">
          {o.description || "—"} {o.discount_percent != null && `• -${o.discount_percent}٪`}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => setEdit(true)}
          className="grid h-8 w-8 place-items-center rounded-[0.85rem] bg-secondary transition-all duration-300 hover:bg-accent active:scale-95"
        >
          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          onClick={onToggle}
          className={`grid h-8 w-8 place-items-center rounded-[0.85rem] transition-all duration-300 hover:bg-accent active:scale-95 ${o.is_active ? "bg-success/10 text-success" : "bg-secondary"}`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-[0.85rem] bg-destructive/10 text-destructive transition-all duration-300 hover:bg-destructive/20 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
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
      <label className="mb-1 block text-[13px] font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-2xl bg-secondary px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card transition-all duration-300"
      />
    </div>
  );
}
