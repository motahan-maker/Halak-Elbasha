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
      toast.success("تمت الإضافة");
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
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
    <div className="space-y-2.5">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} /> إضافة خدمة
      </button>
      {open && <ServiceForm onCancel={() => setOpen(false)} onSave={(d) => create.mutate(d)} />}
      {list.data?.map((s: any, i: number) => (
        <div key={s.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
          <ServiceRow
            s={s}
            onToggle={() => update.mutate({ id: s.id, is_active: !s.is_active })}
            onSave={(d: any) => update.mutate({ id: s.id, ...d })}
            onDelete={() => {
              if (confirm("حذف؟")) del.mutate(s.id);
            }}
          />
        </div>
      ))}
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
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card animate-scale-in">
      <Input label="اسم الخدمة" value={name} onChange={setName} />
      <Input label="الوصف" value={desc} onChange={setDesc} />
      <Input
        label="السعر"
        value={String(price)}
        onChange={(v) => setPrice(Number(v) || 0)}
        type="number"
      />
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onSave({ name, description: desc, price })}
          disabled={!name}
          className="flex-1 rounded-xl bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50 transition-all duration-200 hover:brightness-105 active:scale-95 shadow-sm"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-xl bg-secondary px-4 py-2.5 font-semibold transition-all duration-200 hover:bg-muted active:scale-95 border border-border/30">
          إلغاء
        </button>
      </div>
    </div>
  );
}

function ServiceRow({ s, onToggle, onSave, onDelete }: any) {
  const [edit, setEdit] = useState(false);
  if (edit)
    return (
      <ServiceForm
        initial={s}
        onCancel={() => setEdit(false)}
        onSave={(d: any) => {
          onSave(d);
          setEdit(false);
        }}
      />
    );
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/15">
      <div className="grid h-9.5 w-9.5 place-items-center squircle glass-icon text-primary shrink-0">
        <Scissors className="h-4.5 w-4.5" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-sm text-foreground">{s.name}</div>
        <div className="truncate text-xs font-semibold text-muted-foreground mt-0.5">
          {s.description || "—"} • {s.price} ج.م
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={() => setEdit(true)}
          aria-label="تعديل"
          className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-muted-foreground transition-all duration-200 hover:bg-muted active:scale-90 border border-border/30"
        >
          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          onClick={onToggle}
          aria-label="تفعيل"
          className={`grid h-8 w-8 place-items-center rounded-xl transition-all duration-200 active:scale-90 border ${s.is_active ? "bg-success/10 text-success border-success/20" : "bg-secondary text-muted-foreground border-border/30"}`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          aria-label="حذف"
          className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 transition-all duration-200 hover:bg-destructive/20 active:scale-90"
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
      <label className="mb-1 block text-xs font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all duration-200"
      />
    </div>
  );
}
