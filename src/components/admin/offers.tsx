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
      toast.success("تمت إضافة العرض بنجاح");
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
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#111111] py-3.5 font-display text-sm font-bold text-[#FFFFFF] shadow-card transition-all duration-200 hover:bg-[#262626] dark:bg-[#F6F1E8] dark:text-[#111111] press"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} /> إضافة عرض جديد
      </button>

      {open && <OfferForm onCancel={() => setOpen(false)} onSave={(d: any) => create.mutate(d)} />}

      <div className="space-y-3">
        {list.data?.map((o: any) => (
          <OfferRow
            key={o.id}
            o={o}
            onSave={(d: any) => update.mutate({ id: o.id, ...d })}
            onToggle={() => update.mutate({ id: o.id, is_active: !o.is_active })}
            onDelete={() => {
              if (confirm(`حذف عرض «${o.title}» نهائياً؟`)) del.mutate(o.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function OfferForm({ onCancel, onSave, initial }: any) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [pct, setPct] = useState(initial?.discount_percent ?? "");

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-elevated animate-fade-in">
      <h3 className="font-display text-sm font-bold text-foreground">
        {initial ? "تعديل العرض" : "بيانات العرض الجديد"}
      </h3>
      <InputField label="عنوان العرض" value={title} onChange={setTitle} />
      <InputField label="تفاصيل العرض (اختياري)" value={desc} onChange={setDesc} />
      <InputField
        label="نسبة الخصم % (اختياري)"
        value={String(pct)}
        onChange={setPct}
        type="number"
      />
      <div className="flex gap-2.5 pt-2">
        <button
          onClick={() =>
            onSave({ title, description: desc, discount_percent: pct === "" ? null : Number(pct) })
          }
          disabled={!title}
          className="flex-1 rounded-xl bg-[#111111] py-2.5 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
        >
          حفظ العرض
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-border bg-secondary px-4 py-2.5 font-display text-xs font-bold text-foreground press"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

function OfferRow({ o, onSave, onToggle, onDelete }: any) {
  const [edit, setEdit] = useState(false);

  if (edit) {
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
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground">
            <Tag className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-[1rem] font-bold text-foreground">
                {o.title}
              </span>
              {o.discount_percent != null && (
                <span className="chip chip-gold font-display tnum">
                  -{o.discount_percent}٪
                </span>
              )}
            </div>
            {o.description && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {o.description}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2 border-t border-border/70 pt-3">
        <button
          onClick={() => setEdit(true)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
        >
          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.8} /> تعديل
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-display text-xs font-bold transition-all duration-200 press ${
            o.is_active
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
          {o.is_active ? "نشط" : "معطل"}
        </button>
        <button
          onClick={onDelete}
          aria-label="حذف"
          className="ms-auto grid h-8 w-8 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition-all duration-200 hover:bg-destructive/20 press"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function InputField({
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
      <label className="mb-1 block font-display text-[11px] font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 font-display text-xs font-medium text-foreground outline-none transition-colors duration-200 focus:border-foreground"
      />
    </div>
  );
}
