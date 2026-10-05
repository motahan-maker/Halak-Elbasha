import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlidersHorizontal, Store, Clock, Calendar, Coffee, Share2, Save } from "lucide-react";

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
      if (error && /break_start|break_end/.test(error.message)) {
        const { break_start: _bs, break_end: _be, ...legacy } = payload;
        const retry = await supabase.from("settings").update(legacy).eq("id", 1);
        if (retry.error) throw new Error(retry.error.message);
        toast.message("تم الحفظ بنجاح");
        return;
      }
      if (error) throw new Error(error.message);
      toast.success("تم حفظ إعدادات الصالون بنجاح");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const s = settings.data;
  if (settings.isLoading) {
    return (
      <div className="space-y-3.5">
        <div className="h-28 animate-shimmer rounded-3xl border border-border bg-muted" />
        <div className="h-28 animate-shimmer rounded-3xl border border-border bg-muted" />
      </div>
    );
  }

  if (!s) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <div className="font-display text-sm font-bold text-foreground">لا يمكن قراءة الإعدادات</div>
        <div className="mt-1 text-xs text-muted-foreground">تأكد من صلاحيات حسابك</div>
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

  const handleSave = () => {
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
    <div className="space-y-4">
      {/* Information Notice */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <span className="font-display text-xs font-bold text-foreground">
            توليد المواعيد الذكي
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          النظام يُولّد فترات الحجز تلقائياً وفقاً لساعات العمل والاستراحة ومدة الموعد.
        </p>
      </div>

      {/* Group 1: Shop Information */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
          <Store className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <span>بيانات الصالون الأساسية</span>
        </div>
        <InputField label="اسم الصالون" value={f.shop_name ?? ""} onChange={(v) => set("shop_name", v)} />
        <InputField
          label="رقم واتساب للتواصل وتأكيد الحجوزات"
          value={f.whatsapp ?? ""}
          onChange={(v) => set("whatsapp", v)}
          type="tel"
          placeholder="01XXXXXXXXX"
        />
        <InputField
          label="عنوان الصالون على الخريطة"
          value={f.address ?? ""}
          onChange={(v) => set("address", v)}
          placeholder="المدينة، الشارع، المعلم المميز"
        />
      </div>

      {/* Group 2: Working Days */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <span>أيام العمل الأسبوعية</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {days.map((d, i) => {
            const active = (f.working_days ?? []).includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`rounded-2xl px-3.5 py-2 font-display text-xs font-bold transition-all duration-200 press ${
                  active
                    ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
                    : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group 3: Working Hours & Slots */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <span>ساعات العمل ومدة الموعد</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="بداية الدوام اليومي"
            value={f.start_time?.slice(0, 5) ?? "10:00"}
            onChange={(v) => set("start_time", v)}
            type="time"
          />
          <InputField
            label="نهاية الدوام اليومي"
            value={f.end_time?.slice(0, 5) ?? "23:00"}
            onChange={(v) => set("end_time", v)}
            type="time"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-display text-xs font-bold text-muted-foreground">
            مدة الموعد القياسية
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[20, 30, 40, 45, 60].map((m) => {
              const active = Number(f.slot_minutes) === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("slot_minutes", m)}
                  className={`rounded-xl py-2 font-display text-xs font-bold transition-all duration-200 press ${
                    active
                      ? "bg-[#111111] text-[#FFFFFF] shadow-sm dark:bg-[#F6F1E8] dark:text-[#111111]"
                      : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m} د
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group 4: Break Time */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
            <Coffee className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            <span>فترة الاستراحة اليومية</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasBreak}
            onClick={() =>
              hasBreak
                ? setF((x) => ({ ...x, break_start: null, break_end: null }))
                : setF((x) => ({ ...x, break_start: x.break_start ?? "19:00", break_end: x.break_end ?? "20:00" }))
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              hasBreak ? "bg-[#111111] dark:bg-[#F6F1E8]" : "bg-secondary"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
                hasBreak ? "start-0.5" : "start-[22px]"
              }`}
            />
          </button>
        </div>
        {hasBreak && (
          <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
            <InputField
              label="بداية الاستراحة"
              value={(f.break_start ?? "").slice(0, 5)}
              onChange={(v) => set("break_start", v)}
              type="time"
            />
            <InputField
              label="نهاية الاستراحة"
              value={(f.break_end ?? "").slice(0, 5)}
              onChange={(v) => set("break_end", v)}
              type="time"
            />
          </div>
        )}
      </div>

      {/* Group 5: Social Media */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-card space-y-3.5">
        <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
          <Share2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          <span>حسابات التواصل الاجتماعي</span>
        </div>
        <InputField label="رابط فيسبوك" value={f.facebook ?? ""} onChange={(v) => set("facebook", v)} placeholder="https://facebook.com/..." />
        <InputField label="رابط انستجرام" value={f.instagram ?? ""} onChange={(v) => set("instagram", v)} placeholder="https://instagram.com/..." />
        <InputField label="رابط تيك توك" value={f.tiktok ?? ""} onChange={(v) => set("tiktok", v)} placeholder="https://tiktok.com/@..." />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#111111] py-3.5 font-display text-sm font-bold text-[#FFFFFF] shadow-card transition-all duration-200 hover:bg-[#262626] dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
      >
        <Save className="h-4 w-4" strokeWidth={2} />
        {saving ? "جارٍ الحفظ..." : "حفظ جميع الإعدادات"}
      </button>
    </div>
  );
}

function InputField({
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
      <label className="mb-1 block font-display text-[11px] font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 font-display text-xs font-medium text-foreground outline-none transition-colors duration-200 focus:border-foreground"
      />
    </div>
  );
}
