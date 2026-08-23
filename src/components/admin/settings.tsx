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
    <div className="space-y-3.5">
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-primary">
        النظام يُولِّد المواعيد تلقائياً من ساعات العمل وأيام العمل والاستراحة. لا حاجة لإنشاء مواعيد يدوياً.
      </div>
      <Group title="أيام العمل">
        <div className="flex flex-wrap gap-1.5">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${(f.working_days ?? []).includes(i) ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-muted border border-border/30"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </Group>
      <Group title="ساعات العمل">
        <div className="grid grid-cols-2 gap-2.5">
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
        className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
      >
        حفظ الإعدادات
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all duration-200">
      <div className="ios-grouped-section-title px-0 pb-1">{title}</div>
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
        className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all duration-200"
      />
    </div>
  );
}
