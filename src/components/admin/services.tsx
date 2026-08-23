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
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> إضافة خدمة
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
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card animate-scale-in">
      <Input label="اسم الخدمة" value={name} onChange={setName} />
      <Input label="الوصف" value={desc} onChange={setDesc} />
      <Input
        label="السعر"
        value={String(price)}
        onChange={(v) => setPrice(Number(v) || 0)}
        type="number"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({ name, description: desc, price })}
          disabled={!name}
          className="flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50 transition-all duration-200 hover:brightness-110 active:scale-95"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 font-bold transition-all duration-200 hover:bg-muted active:scale-95">
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
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-luxe">
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground">
        <Scissors className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{s.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {s.description || "—"} • {s.price} ج.م
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => setEdit(true)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-all duration-200 hover:bg-muted active:scale-95"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className={`grid h-8 w-8 place-items-center rounded-lg border transition-all duration-200 hover:bg-muted active:scale-95 ${s.is_active ? "border-success/40 text-success" : "border-border"}`}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
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
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
      />
    </div>
  );
}
