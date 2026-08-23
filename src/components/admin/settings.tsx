import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SettingsAdmin() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () =>
      (await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  const save = useMutation({
    mutationFn: async (d: any) => {
      const { error } = await supabase
        .from("settings")
        .update({ ...d, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const s = settings.data;
  if (!s) return null;
  return <SettingsForm key={s.updated_at} initial={s} onSave={(d) => save.mutate(d)} />;
}

function SettingsForm({ initial, onSave }: { initial: any; onSave: (d: any) => void }) {
  const [f, setF] = useState({ ...initial });
  const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const toggleDay = (n: number) => {
    const arr = new Set<number>(f.working_days ?? []);
    arr.has(n) ? arr.delete(n) : arr.add(n);
    set("working_days", Array.from(arr).sort());
  };
  const save = () => {
    onSave({
      working_days: f.working_days ?? [],
      start_time: f.start_time,
      end_time: f.end_time,
    });
  };
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        النظام يُولِّد المواعيد تلقائياً من ساعات العمل وأيام العمل والاستراحة. لا حاجة لإنشاء
        مواعيد يدوياً.
      </div>
      <Group title="أيام العمل">
        <div className="flex flex-wrap gap-1">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${(f.working_days ?? []).includes(i) ? "gradient-luxe text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </Group>
      <Group title="ساعات العمل">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="بداية العمل"
            value={f.start_time?.slice(0, 5) ?? ""}
            onChange={(v) => set("start_time", v)}
            type="time"
          />
          <Input
            label="نهاية العمل"
            value={f.end_time?.slice(0, 5) ?? ""}
            onChange={(v) => set("end_time", v)}
            type="time"
          />
        </div>
      </Group>
      <button
        onClick={save}
        className="w-full rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
      >
        حفظ الإعدادات
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-sm font-bold text-muted-foreground">{title}</div>
      {children}
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
