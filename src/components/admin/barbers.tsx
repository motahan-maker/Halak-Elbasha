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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-card transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} /> إضافة حلاق
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
                if (!confirm(`حذف ${b.name}؟`)) return;
                try {
                  await del({ data: { barber_id: b.id } });
                  toast.success("تم الحذف");
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
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4 shadow-card animate-scale-in">
      <Input label="الاسم" value={name} onChange={setName} />
      <Input label="رقم الجوال" value={phone} onChange={setPhone} type="tel" />
      <Input label="كلمة المرور" value={password} onChange={setPassword} type="password" />
      <Input label="التخصص" value={spec} onChange={setSpec} />
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => onSave({ name, phone, password, specialization: spec })}
          disabled={loading || !name || !phone || password.length < 6}
          className="flex-1 rounded-2xl bg-primary py-2 font-bold text-primary-foreground disabled:opacity-50 transition-all duration-300 hover:brightness-110 active:scale-95"
        >
          {loading ? "..." : "حفظ"}
        </button>
        <button onClick={onCancel} className="rounded-2xl bg-secondary px-4 py-2 font-bold transition-all duration-300 hover:bg-accent active:scale-95">
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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-elevated">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          {!edit ? (
            <>
              <div className="truncate font-bold text-[15px]">{b.name}</div>
              <div className="truncate text-[13px] font-semibold text-muted-foreground">
                {b.specialization || "—"} • {b.phone}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-muted-foreground">
                {(b.start_time ?? "10:00").slice(0, 5)} - {(b.end_time ?? "23:00").slice(0, 5)} • كل{" "}
                {b.slot_minutes ?? 40} د
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              <Input label="الاسم" value={name} onChange={setName} />
              <Input label="التخصص" value={spec} onChange={setSpec} />
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${b.is_active ? "bg-success/10 text-success border border-success/20" : "bg-secondary text-muted-foreground border border-border/40"}`}
        >
          {b.is_active ? "نشط" : "موقوف"}
        </span>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground border border-border/30 transition-all duration-200 hover:bg-muted active:scale-95"
          >
            <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} /> تعديل
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                onSave({ name, specialization: spec });
                setEdit(false);
              }}
              className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-95 shadow-sm"
            >
              حفظ
            </button>
            <button
              onClick={() => setEdit(false)}
              className="rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:bg-muted active:scale-95 border border-border/30"
            >
              إلغاء
            </button>
          </>
        )}
        <button
          onClick={() => setScheduling((s) => !s)}
          className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground border border-border/30 transition-all duration-200 hover:bg-muted active:scale-95"
        >
          <CalendarDays className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} /> المواعيد
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground border border-border/30 transition-all duration-200 hover:bg-muted active:scale-95"
        >
          <Power className="h-3.5 w-3.5" strokeWidth={1.5} /> {b.is_active ? "إيقاف" : "تفعيل"}
        </button>
        <button
          onClick={() => setResetting((s) => !s)}
          className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground border border-border/30 transition-all duration-200 hover:bg-muted active:scale-95"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} /> كلمة المرور
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive border border-destructive/20 transition-all duration-200 hover:bg-destructive/20 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> حذف
        </button>
      </div>
      {resetting && (
        <div className="mt-3 flex gap-2 animate-scale-in">
          <input
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="كلمة المرور الجديدة"
            type="password"
            className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all"
          />
          <button
            onClick={() => {
              if (pwd.length < 6) return toast.error("٦ أحرف على الأقل");
              onReset(pwd);
              setPwd("");
              setResetting(false);
            }}
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-95"
          >
            تأكيد
          </button>
        </div>
      )}
      {scheduling && (
        <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 animate-scale-in">
          <div className="rounded-xl bg-primary/10 border border-primary/15 p-2.5 text-xs font-semibold text-primary">
            يولّد النظام مواعيد كل {sched.slot_minutes} دقيقة من بداية العمل حتى نهايته.
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold text-muted-foreground">أيام العمل</div>
            <div className="flex flex-wrap gap-1.5">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-200 active:scale-95 ${sched.working_days.includes(i) ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-muted border border-border/30"}`}
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
              className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-105 active:scale-95 shadow-sm"
            >
              حفظ المواعيد
            </button>
            <button
              onClick={() => setScheduling(false)}
              className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:bg-muted active:scale-95 border border-border/30"
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
