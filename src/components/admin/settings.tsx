import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SettingsRow {
  id: number;
  shop_name: string;
  address: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  working_days: number[];
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  slot_minutes: number;
  updated_at?: string;
}

export function SettingsAdmin() {
  const qc = useQueryClient();
  const settings = useQuery<SettingsRow | null>({
    queryKey: ["settings"],
    queryFn: async () =>
      ((await supabase.from("settings").select("*").eq("id", 1).maybeSingle()).data ??
        null) as SettingsRow | null,
  });

  const save = useMutation({
    mutationFn: async (d: Partial<SettingsRow>) => {
      const payload = { ...d, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("settings").update(payload).eq("id", 1);
      // Break columns may not exist on older databases — retry without them.
      if (error && /break_start|break_end/.test(error.message)) {
        const { break_start: _bs, break_end: _be, ...legacy } = payload;
        const retry = await supabase.from("settings").update(legacy).eq("id", 1);
        if (retry.error) throw new Error(retry.error.message);
        toast.message("تم الحفظ (بدون الاستراحة — حدِّث قاعدة البيانات)");
        return;
      }
      if (error) throw new Error(error.message);
      toast.success("تم الحفظ");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const s = settings.data;
  if (settings.isLoading) {
    return (
      <div className="space-y-3.5">
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }
  if (!s) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/15 p-6 text-center text-xs font-medium text-muted-foreground">
        لا يمكن قراءة الإعدادات — تأكد من صلاحيات حسابك
      </div>
    );
  }
  return (
    <SettingsForm
      key={s.updated_at ?? "settings"}
      initial={s}
      saving={save.isPending}
      onSave={(d) => save.mutate(d)}
    />
  );
}

function SettingsForm({
  initial,
  saving,
  onSave,
}: {
  initial: SettingsRow;
  saving: boolean;
  onSave: (d: Partial<SettingsRow>) => void;
}) {
  const [f, setF] = useState<SettingsRow>({ ...initial });
  const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const set = <K extends keyof SettingsRow>(k: K, v: SettingsRow[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const toggleDay = (n: number) => {
    const arr = new Set<number>(f.working_days ?? []);
    if (arr.has(n)) arr.delete(n);
    else arr.add(n);
    set("working_days", Array.from(arr).sort((a, b) => a - b));
  };

  const hasBreak = !!(f.break_start && f.break_end);

  const save = () => {
    const slot = Number(f.slot_minutes) || 40;
    if (hasBreak && f.break_start! >= f.break_end!) {
      toast.error("بداية الاستراحة يجب أن تكون قبل نهايتها");
      return;
    }
    onSave({
      shop_name: f.shop_name.trim() || "حلاق الباشا",
      address: f.address?.trim() ?? "",
      whatsapp: f.whatsapp?.trim() ?? "",
      facebook: f.facebook?.trim() ?? "",
      instagram: f.instagram?.trim() ?? "",
      tiktok: f.tiktok?.trim() ?? "",
      working_days: f.working_days ?? [],
      start_time: f.start_time,
      end_time: f.end_time,
      break_start: hasBreak ? f.break_start : null,
      break_end: hasBreak ? f.break_end : null,
      slot_minutes: Math.min(180, Math.max(10, slot)),
    });
  };

  return (
    <div className="space-y-3.5">
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-primary">
        النظام يُولِّد المواعيد تلقائياً من ساعات العمل وأيام العمل والاستراحة ومدة الموعد. لا حاجة لإنشاء مواعيد يدوياً.
      </div>

      <Group title="بيانات الصالون">
        <Input label="اسم الصالون" value={f.shop_name ?? ""} onChange={(v) => set("shop_name", v)} />
        <Input
          label="رقم واتساب"
          value={f.whatsapp ?? ""}
          onChange={(v) => set("whatsapp", v)}
          type="tel"
          placeholder="+201018172606"
        />
        <Input
          label="العنوان"
          value={f.address ?? ""}
          onChange={(v) => set("address", v)}
          placeholder="شارع / منطقة"
        />
      </Group>

      <Group title="روابط التواصل">
        <Input label="فيسبوك" value={f.facebook ?? ""} onChange={(v) => set("facebook", v)} placeholder="https://" />
        <Input label="انستجرام" value={f.instagram ?? ""} onChange={(v) => set("instagram", v)} placeholder="https://" />
        <Input label="تيك توك" value={f.tiktok ?? ""} onChange={(v) => set("tiktok", v)} placeholder="https://" />
      </Group>

      <Group title="أيام العمل">
        <div className="flex flex-wrap gap-1.5">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                (f.working_days ?? []).includes(i)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-muted border border-border/30"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {(f.working_days ?? []).length === 0 && (
          <p className="text-[11px] font-bold text-destructive">
            لم تحدد أي يوم — سيُعتبر الصالون مغلقاً بالكامل. اختر يوماً واحداً على الأقل.
          </p>
        )}
      </Group>

      <Group title="ساعات العمل ومدة الموعد">
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
        <div>
          <label className="mb-1 block text-xs font-bold text-muted-foreground">مدة الموعد (دقيقة)</label>
          <div className="flex gap-1.5">
            {[20, 30, 40, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("slot_minutes", m)}
                className={`flex-1 cursor-pointer rounded-xl px-2 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  Number(f.slot_minutes) === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-muted border border-border/30"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">
          إذا كانت نهاية العمل قبل بدايتها يُعتبر الدوام ممتداً بعد منتصف الليل.
        </p>
      </Group>

      <Group title="الاستراحة">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-xs font-bold text-foreground">تفعيل وقت الاستراحة</span>
          <button
            type="button"
            role="switch"
            aria-checked={hasBreak}
            onClick={() =>
              hasBreak
                ? setF((x) => ({ ...x, break_start: null, break_end: null }))
                : setF((x) => ({ ...x, break_start: x.break_start ?? "19:00", break_end: x.break_end ?? "20:00" }))
            }
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${
              hasBreak ? "bg-primary" : "bg-muted-foreground/25"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                hasBreak ? "start-0.5" : "start-[22px]"
              }`}
            />
          </button>
        </label>
        {hasBreak && (
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="بداية الاستراحة"
              value={(f.break_start ?? "").slice(0, 5)}
              onChange={(v) => set("break_start", v)}
              type="time"
            />
            <Input
              label="نهاية الاستراحة"
              value={(f.break_end ?? "").slice(0, 5)}
              onChange={(v) => set("break_end", v)}
              type="time"
            />
          </div>
        )}
      </Group>

      <button
        onClick={save}
        disabled={saving}
        className="w-full cursor-pointer rounded-2xl gradient-luxe px-4 py-3.5 font-bold text-primary-foreground shadow-glow-primary transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs font-semibold outline-none transition-all duration-200 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/45"
      />
    </div>
  );
}
