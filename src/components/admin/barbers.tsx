import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createBarberAccount,
  resetBarberPassword,
  deleteBarberAccount,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  KeyRound,
  Edit2,
  Power,
  CalendarDays,
  Clock,
  User,
} from "lucide-react";

export function BarbersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => (await supabase.from("barbers").select("*").order("name")).data ?? [],
  });
  const create = useServerFn(createBarberAccount);
  const reset = useServerFn(resetBarberPassword);
  const del = useServerFn(deleteBarberAccount);

  const createMut = useMutation({
    mutationFn: (data: any) => create({ data }),
    onSuccess: () => {
      toast.success("تمت إضافة الحلاق بنجاح");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (b: any) => {
      const { error } = await supabase
        .from("barbers")
        .update({ is_active: !b.is_active })
        .eq("id", b.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-barbers"] }),
  });

  const update = useMutation({
    mutationFn: async (b: any) => {
      const { id, ...rest } = b;
      const allowed: any = {};
      [
        "name",
        "specialization",
        "working_days",
        "start_time",
        "end_time",
        "slot_minutes",
      ].forEach((k) => {
        if (k in rest) allowed[k] = (rest as any)[k];
      });
      const { error } = await supabase.from("barbers").update(allowed).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
    },
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
        <Plus className="h-4 w-4" strokeWidth={2.2} /> إضافة حلاق جديد
      </button>

      {open && (
        <NewBarberForm
          onCancel={() => setOpen(false)}
          onSave={(d) => createMut.mutate(d)}
          loading={createMut.isPending}
        />
      )}

      <div className="space-y-3">
        {list.data?.map((b: any) => (
          <BarberRow
            key={b.id}
            b={b}
            onToggle={() => toggle.mutate(b)}
            onSave={(d) => update.mutate({ ...b, ...d })}
            onReset={async (pwd) => {
              try {
                await reset({ data: { barber_id: b.id, password: pwd } });
                toast.success("تم إعادة تعيين كلمة المرور");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
            onDelete={async () => {
              if (
                !confirm(
                  `إيقاف حساب ${b.name} وحذف وصوله؟\nسيبقى سجل مواعيده وتقييماته محفوظاً.`,
                )
              )
                return;
              try {
                await del({ data: { barber_id: b.id } });
                toast.success("تم إيقاف الحلاق وحذف وصوله");
                qc.invalidateQueries({ queryKey: ["admin-barbers"] });
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NewBarberForm({
  onCancel,
  onSave,
  loading,
}: {
  onCancel: () => void;
  onSave: (d: any) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [spec, setSpec] = useState("");

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-elevated animate-fade-in">
      <h3 className="font-display text-sm font-bold text-foreground">بيانات الحلاق الجديد</h3>
      <InputField label="الاسم الكامل" value={name} onChange={setName} />
      <InputField label="رقم الجوال (01XXXXXXXXX)" value={phone} onChange={setPhone} type="tel" />
      <InputField label="كلمة المرور (6 أحرف على الأقل)" value={password} onChange={setPassword} type="password" />
      <InputField label="التخصص / اللقب (اختياري)" value={spec} onChange={setSpec} />
      <div className="flex gap-2.5 pt-2">
        <button
          onClick={() => onSave({ name, phone, password, specialization: spec })}
          disabled={loading || !name || !phone || password.length < 6}
          className="flex-1 rounded-xl bg-[#111111] py-2.5 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ الحلاق"}
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

function BarberRow({
  b,
  onToggle,
  onSave,
  onReset,
  onDelete,
}: {
  b: any;
  onToggle: () => void;
  onSave: (d: any) => void;
  onReset: (p: string) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState(b.name);
  const [spec, setSpec] = useState(b.specialization ?? "");

  const days = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  const [sched, setSched] = useState({
    working_days: (b.working_days ?? [0, 1, 2, 3, 4, 6]) as number[],
    start_time: (b.start_time ?? "10:00").slice(0, 5),
    end_time: (b.end_time ?? "23:00").slice(0, 5),
    slot_minutes: b.slot_minutes ?? 40,
  });

  const toggleDay = (n: number) => {
    const set = new Set(sched.working_days);
    set.has(n) ? set.delete(n) : set.add(n);
    setSched({ ...sched, working_days: Array.from(set).sort() });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!edit ? (
            <>
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-[1rem] font-bold text-foreground">
                  {b.name}
                </span>
                <span
                  className={`chip ${b.is_active ? "chip-success" : "chip-muted"}`}
                >
                  {b.is_active ? "نشط" : "موقوف"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{b.specialization || "حلاق محترف"}</span>
                <span>•</span>
                <span className="tnum font-bold" dir="ltr">{b.phone}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span className="tnum">{(b.start_time ?? "10:00").slice(0, 5)} - {(b.end_time ?? "23:00").slice(0, 5)}</span>
                <span>•</span>
                <span>كل {b.slot_minutes ?? 40} دقيقة</span>
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              <InputField label="الاسم" value={name} onChange={setName} />
              <InputField label="التخصص" value={spec} onChange={setSpec} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2 border-t border-border/70 pt-3">
        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
          >
            <Edit2 className="h-3.5 w-3.5" strokeWidth={1.8} /> تعديل
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                onSave({ name, specialization: spec });
                setEdit(false);
              }}
              className="rounded-xl bg-[#111111] px-3.5 py-1.5 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press"
            >
              حفظ
            </button>
            <button
              onClick={() => setEdit(false)}
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 font-display text-xs font-bold text-foreground press"
            >
              إلغاء
            </button>
          </>
        )}

        <button
          onClick={() => setScheduling(!scheduling)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} /> جدول العمل
        </button>

        <button
          onClick={() => setResetting(!resetting)}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-display text-xs font-bold text-foreground transition-all duration-200 hover:border-foreground press"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.8} /> كلمة المرور
        </button>

        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-display text-xs font-bold transition-all duration-200 press ${
            b.is_active
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
          {b.is_active ? "تعطيل" : "تفعيل"}
        </button>

        <button
          onClick={onDelete}
          aria-label="حذف"
          className="ms-auto grid h-8 w-8 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition-all duration-200 hover:bg-destructive/20 press"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>

      {/* Working Schedule Form */}
      {scheduling && (
        <div className="mt-3.5 space-y-3 rounded-2xl border border-border bg-secondary/30 p-4 animate-fade-in">
          <div className="font-display text-xs font-bold text-foreground">أيام وساعات العمل الخاصة بالحلاق</div>
          <div className="flex flex-wrap gap-1.5">
            {days.map((d, i) => {
              const active = sched.working_days.includes(i);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-xl px-2.5 py-1 font-display text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111]"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <InputField
              label="من الساعة"
              value={sched.start_time}
              onChange={(v) => setSched({ ...sched, start_time: v })}
              type="time"
            />
            <InputField
              label="إلى الساعة"
              value={sched.end_time}
              onChange={(v) => setSched({ ...sched, end_time: v })}
              type="time"
            />
            <InputField
              label="مدة الحجز (د)"
              value={String(sched.slot_minutes)}
              onChange={(v) => setSched({ ...sched, slot_minutes: Number(v) || 40 })}
              type="number"
            />
          </div>
          <button
            onClick={() => {
              onSave(sched);
              setScheduling(false);
            }}
            className="rounded-xl bg-[#111111] px-4 py-2 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press"
          >
            حفظ جدول العمل
          </button>
        </div>
      )}

      {/* Password Reset Form */}
      {resetting && (
        <div className="mt-3.5 flex gap-2 rounded-2xl border border-border bg-secondary/30 p-3 animate-fade-in">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="كلمة المرور الجديدة (6+)"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 font-display text-xs outline-none focus:border-foreground"
          />
          <button
            disabled={pwd.length < 6}
            onClick={() => {
              onReset(pwd);
              setResetting(false);
              setPwd("");
            }}
            className="rounded-xl bg-[#111111] px-4 py-2 font-display text-xs font-bold text-[#FFFFFF] dark:bg-[#F6F1E8] dark:text-[#111111] press disabled:opacity-50"
          >
            تغيير
          </button>
        </div>
      )}
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
