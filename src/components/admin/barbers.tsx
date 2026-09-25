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
      toast.success("تمت إضافة الحلاق");
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
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
    },
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
        className="press flex w-full items-center justify-center gap-2 rounded-2xl gradient-gold px-4 py-3.5 font-display text-sm font-extrabold text-gold-foreground shadow-glow-gold transition-all duration-300 hover:brightness-110"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} /> إضافة حلاق
      </button>
      {open && (
        <NewBarberForm
          onCancel={() => setOpen(false)}
          onSave={(d) => createMut.mutate(d)}
          loading={createMut.isPending}
        />
      )}
      <div className="space-y-2.5">
        {list.data?.map((b: any, i: number) => (
          <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
            <BarberRow
              b={b}
              onToggle={() => toggle.mutate(b)}
              onSave={(d) => update.mutate({ ...b, ...d })}
              onReset={async (pwd) => {
                try {
                  await reset({ data: { barber_id: b.id, password: pwd } });
                  toast.success("تم إعادة التعيين");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              onDelete={async () => {
                if (
                  !confirm(
                    `إيقاف حساب ${b.name} وحذف وصوله للدخول؟\nسيبقى سجل مواعيده وتقييماته محفوظاً.`,
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
          </div>
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
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [spec, setSpec] = useState("");
  return (
    <div className="animate-scale-in space-y-2.5 rounded-2xl border border-gold/25 bg-card p-4 shadow-elevated">
      <Input label="الاسم" value={name} onChange={setName} />
      <Input label="رقم الجوال" value={phone} onChange={setPhone} type="tel" />
      <Input label="كلمة المرور" value={password} onChange={setPassword} type="password" />
      <Input label="التخصص" value={spec} onChange={setSpec} />
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onSave({ name, phone, password, specialization: spec })}
          disabled={loading || !name || !phone || password.length < 6}
          className="press flex-1 rounded-2xl bg-primary py-2.5 font-display text-sm font-extrabold text-primary-foreground shadow-card transition-all duration-300 hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "..." : "حفظ"}
        </button>
        <button onClick={onCancel} className="press rounded-2xl border border-border/70 bg-secondary px-4 py-2.5 text-[12px] font-bold text-foreground transition-all duration-300 hover:border-gold/45 hover:text-accent-foreground">
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
  const [name, setName] = useState(b.name),
    [spec, setSpec] = useState(b.specialization ?? "");
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-elevated">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="relative flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          {!edit ? (
            <>
              <div className="truncate font-display text-[0.95rem] font-extrabold text-foreground">{b.name}</div>
              <div className="mt-0.5 truncate text-[12px] font-semibold text-muted-foreground">
                {b.specialization || "—"} • <span className="tnum" dir="ltr">{b.phone}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0 text-accent-foreground/70" strokeWidth={1.8} />
                <span className="tnum">{(b.start_time ?? "10:00").slice(0, 5)} - {(b.end_time ?? "23:00").slice(0, 5)}</span>
                <span aria-hidden className="text-border">|</span>
                <span>كل {b.slot_minutes ?? 40} د</span>
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              <Input label="الاسم" value={name} onChange={setName} />
              <Input label="التخصص" value={spec} onChange={setSpec} />
            </div>
          )}
        </div>
        <span className={`chip shrink-0 ${b.is_active ? "chip-success" : "chip-muted"}`}>
          {b.is_active && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
          {b.is_active ? "نشط" : "موقوف"}
        </span>
      </div>
      <div className="relative mt-3.5 flex flex-wrap gap-2">
        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="press flex items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
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
              className="press rounded-xl bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-105"
            >
              حفظ
            </button>
            <button
              onClick={() => setEdit(false)}
              className="press rounded-xl border border-border/70 bg-secondary px-3.5 py-1.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
            >
              إلغاء
            </button>
          </>
        )}
        <button
          onClick={() => setScheduling((s) => !s)}
          className="press flex items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
        >
          <CalendarDays className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={1.8} /> المواعيد
        </button>
        <button
          onClick={onToggle}
          className="press flex items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.8} /> {b.is_active ? "إيقاف" : "تفعيل"}
        </button>
        <button
          onClick={() => setResetting((s) => !s)}
          className="press flex items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.8} /> كلمة المرور
        </button>
        <button
          onClick={onDelete}
          className="press flex cursor-pointer items-center gap-1 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3 py-1.5 text-[11.5px] font-bold text-destructive transition-all duration-200 hover:bg-destructive/12"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} /> إيقاف وحذف الوصول
        </button>
      </div>
      {resetting && (
        <div className="animate-scale-in relative mt-3 flex gap-2">
          <input
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="كلمة المرور الجديدة"
            type="password"
            className="flex-1 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-[11.5px] font-semibold outline-none transition-all duration-200 focus:border-gold/45 focus:bg-card focus:ring-2 focus:ring-gold/20"
          />
          <button
            onClick={() => {
              if (pwd.length < 6) return toast.error("٦ أحرف على الأقل");
              onReset(pwd);
              setPwd("");
              setResetting(false);
            }}
            className="press rounded-xl bg-primary px-3.5 py-2 text-[11.5px] font-extrabold text-primary-foreground transition-all duration-200 hover:brightness-105"
          >
            تأكيد
          </button>
        </div>
      )}
      {scheduling && (
        <div className="animate-scale-in relative mt-3 space-y-3 rounded-xl border border-border/70 bg-secondary/30 p-3.5">
          <div className="rounded-xl border border-gold/25 bg-gold/10 p-2.5 text-[11.5px] font-bold text-accent-foreground">
            يولّد النظام مواعيد كل {sched.slot_minutes} دقيقة من بداية العمل حتى نهايته.
          </div>
          <div>
            <div className="mb-1.5 text-[10.5px] font-bold text-muted-foreground">أيام العمل</div>
            <div className="flex flex-wrap gap-1.5">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`press rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 ${sched.working_days.includes(i) ? "gradient-gold text-gold-foreground shadow-glow-gold" : "border border-border/70 bg-card text-muted-foreground hover:border-gold/35 hover:text-foreground"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="بداية العمل"
              type="time"
              value={sched.start_time}
              onChange={(v) => setSched({ ...sched, start_time: v })}
            />
            <Input
              label="نهاية العمل"
              type="time"
              value={sched.end_time}
              onChange={(v) => setSched({ ...sched, end_time: v })}
            />
            <Input
              label="مدة الموعد (د)"
              type="number"
              value={String(sched.slot_minutes)}
              onChange={(v) => setSched({ ...sched, slot_minutes: Number(v) || 40 })}
            />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => {
                onSave({
                  working_days: sched.working_days,
                  start_time: sched.start_time,
                  end_time: sched.end_time,
                  slot_minutes: sched.slot_minutes,
                });
                setScheduling(false);
              }}
              className="press flex-1 rounded-xl bg-primary py-2.5 text-[11.5px] font-extrabold text-primary-foreground shadow-card transition-all duration-200 hover:brightness-105"
            >
              حفظ المواعيد
            </button>
            <button
              onClick={() => setScheduling(false)}
              className="press rounded-xl border border-border/70 bg-secondary px-4 py-2.5 text-[11.5px] font-bold text-foreground transition-all duration-200 hover:border-gold/45 hover:text-accent-foreground"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
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
      <label className="mb-1 block text-[10.5px] font-bold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="w-full rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-[11.5px] font-semibold text-foreground outline-none transition-all duration-200 focus:border-gold/45 focus:bg-card focus:ring-2 focus:ring-gold/20"
      />
    </div>
  );
}
