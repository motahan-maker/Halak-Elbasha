import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { deleteService } from "@/lib/admin.functions";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Scissors, Plus, Trash2, Edit2, Power } from "lucide-react";

export function ServicesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () =>
      (await supabase.from("services").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });

  const create = useMutation({
    mutationFn: async (d: any) => {
      const { error } = await supabase.from("services").insert(d);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تمت إضافة الخدمة بنجاح");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (d: any) => {
      const { id, ...rest } = d;
      const { error } = await supabase.from("services").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  const delServer = useServerFn(deleteService);
  const del = useMutation({
    mutationFn: async (id: string) => {
      await delServer({ data: { service_id: id } });
    },
    onSuccess: () => {
      toast.success("تم حذف الخدمة");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
        <Plus className="h-4 w-4" strokeWidth={2.2} /> إضافة خدمة جديدة
      </button>

      {open && <ServiceForm onCancel={() => setOpen(false)} onSave={(d) => create.mutate(d)} />}

      <div className="space-y-3">
        {list.data?.map((s: any) => (
          <ServiceRow
            key={s.id}
            s={s}
            onToggle={() => update.mutate({ id: s.id, is_active: !s.is_active })}
            onSave={(d: any) => update.mutate({ id: s.id, ...d })}
            onDelete={() => {
              if (confirm(`حذف خدمة «${s.name}» نهائياً؟`)) del.mutate(s.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceForm({
  onCancel,
  onSave,
  initial,
}: {
  onCancel: () => void;
  onSave: (d: any) => void;
  initial?: any;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-elevated animate-fade-in">
      <h3 className="font-display text-sm font-bold text-foreground">
        {initial ? "تعديل الخدمة" : "بيانات الخدمة الجديدة"}
      </h3>
      <InputField label="اسم الخدمة" value={name} onChange={setName} />
      <InputField label="الوصف (اختياري)" value={desc} onChange={setDesc} />
      <InputField
        label="السعر (جنيه مصري)"
        value={String(price)}
        onChange={(v) => setPrice(Number(v) || 0)}
        type="number"
      />
      <div className="flex gap-2.5 pt-2">
        <button
          onClick={() => onSave({ name, description: desc, price })}
          disabled={!name || price <= 0}
          className="flex-1 rounded-xl bg-[#111111] py-2.5 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
        >
          حفظ الخدمة
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

function ServiceRow({
  s,
  onToggle,
  onSave,
  onDelete,
}: {
  s: any;
  onToggle: () => void;
  onSave: (d: any) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);

  if (edit) {
    return (
      <ServiceForm
        initial={s}
        onCancel={() => setEdit(false)}
        onSave={(d) => {
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
            <Scissors className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-[1rem] font-bold text-foreground">
                {s.name}
              </span>
              <span className={`chip ${s.is_active ? "chip-success" : "chip-muted"}`}>
                {s.is_active ? "متاحة" : "معطلة"}
              </span>
            </div>
            {s.description && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {s.description}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 text-end">
          <div className="font-display text-[1.15rem] font-black tnum text-foreground">
            {s.price}
          </div>
          <div className="text-[9px] font-bold text-muted-foreground">ج.م</div>
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
            s.is_active
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
          {s.is_active ? "تعطيل" : "تفعيل"}
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
