import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  createBarberAccount,
  resetBarberPassword,
  deleteBarberAccount,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { arabicDate, isoDate } from "@/lib/format";
import { formatTime } from "@/lib/slots";
import {
  LogOut,
  Users,
  Scissors,
  CalendarDays,
  Tag,
  Star,
  Settings as Cog,
  TrendingUp,
  Plus,
  Trash2,
  KeyRound,
  X,
  Edit2,
  Power,
  Search,
} from "lucide-react";

type AdminTab =
  | "overview"
  | "barbers"
  | "services"
  | "bookings"
  | "offers"
  | "reviews"
  | "settings";

export function AdminApp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  };

  const tabs: { k: AdminTab; label: string; icon: React.ReactNode }[] = [
    { k: "overview", label: "نظرة عامة", icon: <TrendingUp className="h-4 w-4" /> },
    { k: "barbers", label: "الحلاقون", icon: <Users className="h-4 w-4" /> },
    { k: "services", label: "الخدمات", icon: <Scissors className="h-4 w-4" /> },
    { k: "bookings", label: "الحجوزات", icon: <CalendarDays className="h-4 w-4" /> },
    { k: "offers", label: "العروض", icon: <Tag className="h-4 w-4" /> },
    { k: "reviews", label: "التقييمات", icon: <Star className="h-4 w-4" /> },
    { k: "settings", label: "الإعدادات", icon: <Cog className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-luxe text-primary-foreground shadow-card">
                <Cog className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">لوحة المدير</div>
                <div className="truncate text-xs text-muted-foreground">
                  {auth.profile?.full_name}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="grid h-9 w-9 place-items-center rounded-full border border-border"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="-mx-4 mt-3 overflow-x-auto px-4">
            <div className="flex gap-2 pb-1">
              {tabs.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                    tab === t.k
                      ? "gradient-luxe text-primary-foreground shadow-card"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 pt-5">
        {tab === "overview" && <Overview />}
        {tab === "barbers" && <BarbersAdmin />}
        {tab === "services" && <ServicesAdmin />}
        {tab === "bookings" && <BookingsAdmin />}
        {tab === "offers" && <OffersAdmin />}
        {tab === "reviews" && <ReviewsAdmin />}
        {tab === "settings" && <SettingsAdmin />}
      </main>
    </div>
  );
}

/* OVERVIEW */
function Overview() {
  const today = isoDate(new Date());
  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [b, c, s, barbersRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("status, booking_date, service_price, service_name, barber_id"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("barbers").select("id, name"),
      ]);
      const bookings = (b.data ?? []) as any[];
      const todayBookings = bookings.filter((x) => x.booking_date === today);
      const completed = bookings.filter((x) => x.status === "completed");
      const cancelled = bookings.filter((x) => x.status === "cancelled");
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);
      const revDay = completed
        .filter((x) => x.booking_date === today)
        .reduce((a, x) => a + Number(x.service_price), 0);
      const revWeek = completed
        .filter((x) => new Date(x.booking_date) >= weekStart)
        .reduce((a, x) => a + Number(x.service_price), 0);
      const revMonth = completed
        .filter((x) => new Date(x.booking_date) >= monthStart)
        .reduce((a, x) => a + Number(x.service_price), 0);
      const svcCount: Record<string, number> = {};
      completed.forEach((x) => (svcCount[x.service_name] = (svcCount[x.service_name] ?? 0) + 1));
      const topService = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      const { data: reviewAgg } = await supabase.from("reviews").select("barber_id, rating");
      const ratings: Record<string, { s: number; c: number }> = {};
      (reviewAgg ?? []).forEach((r: any) => {
        ratings[r.barber_id] ??= { s: 0, c: 0 };
        ratings[r.barber_id].s += r.rating;
        ratings[r.barber_id].c += 1;
      });
      let topBarber = "—";
      let topAvg = 0;
      Object.entries(ratings).forEach(([id, v]) => {
        const a = v.s / v.c;
        if (a > topAvg) {
          topAvg = a;
          topBarber = (barbersRes.data ?? []).find((x: any) => x.id === id)?.name ?? "—";
        }
      });
      return {
        todayCount: todayBookings.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        customers: c.count ?? 0,
        services: s.count ?? 0,
        barbers: (barbersRes.data ?? []).length,
        revDay,
        revWeek,
        revMonth,
        topService,
        topBarber,
      };
    },
  });

  const d = stats.data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <KPI label="حجوزات اليوم" value={d?.todayCount ?? "—"} />
        <KPI label="مكتملة" value={d?.completedCount ?? "—"} />
        <KPI label="ملغية" value={d?.cancelledCount ?? "—"} />
        <KPI label="العملاء" value={d?.customers ?? "—"} />
        <KPI label="الحلاقون" value={d?.barbers ?? "—"} />
        <KPI label="الخدمات" value={d?.services ?? "—"} />
      </div>
      <h3 className="px-1 pt-2 text-sm font-bold text-muted-foreground">الإيرادات</h3>
      <div className="grid grid-cols-3 gap-2">
        <KPI label="اليوم" value={`${d?.revDay ?? 0} ج.م`} />
        <KPI label="الأسبوع" value={`${d?.revWeek ?? 0} ج.م`} />
        <KPI label="الشهر" value={`${d?.revMonth ?? 0} ج.م`} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Card
          title="الأكثر طلباً"
          value={d?.topService ?? "—"}
          icon={<Scissors className="h-5 w-5" />}
        />
        <Card
          title="أفضل حلاق تقييماً"
          value={d?.topBarber ?? "—"}
          icon={<Star className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-card">
      <div className="text-xl font-black text-gradient-gold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
function Card({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground">
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

/* BARBERS */
function BarbersAdmin() {
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
        "break_start",
        "break_end",
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

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe"
      >
        <Plus className="h-4 w-4" /> إضافة حلاق
      </button>
      {open && (
        <NewBarberForm
          onCancel={() => setOpen(false)}
          onSave={(d) => createMut.mutate(d)}
          loading={createMut.isPending}
        />
      )}
      <div className="space-y-2">
        {list.data?.map((b: any) => (
          <BarberRow
            key={b.id}
            b={b}
            onToggle={() => toggle.mutate(b)}
            onSave={(d) => update.mutate({ ...b, ...d })}
            onReset={async (pwd) => {
              try {
                await reset({ data: { user_id: b.user_id, password: pwd } });
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
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <Input label="الاسم" value={name} onChange={setName} />
      <Input label="رقم الجوال" value={phone} onChange={setPhone} type="tel" />
      <Input label="كلمة المرور" value={password} onChange={setPassword} type="password" />
      <Input label="التخصص" value={spec} onChange={setSpec} />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({ name, phone, password, specialization: spec })}
          disabled={loading || !name || !phone || password.length < 6}
          className="flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "..." : "حفظ"}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 font-bold">
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
    break_start: (b.break_start ?? "").slice(0, 5),
    break_end: (b.break_end ?? "").slice(0, 5),
    slot_minutes: b.slot_minutes ?? 40,
  });
  const toggleDay = (n: number) => {
    const set = new Set(sched.working_days);
    set.has(n) ? set.delete(n) : set.add(n);
    setSched({ ...sched, working_days: Array.from(set).sort() });
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {!edit ? (
            <>
              <div className="truncate font-bold">{b.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.specialization || "—"} • {b.phone}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {(b.start_time ?? "10:00").slice(0, 5)} - {(b.end_time ?? "23:00").slice(0, 5)} • كل{" "}
                {b.slot_minutes ?? 40} د
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Input label="الاسم" value={name} onChange={setName} />
              <Input label="التخصص" value={spec} onChange={setSpec} />
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${b.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
        >
          {b.is_active ? "نشط" : "موقوف"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!edit ? (
          <button
            onClick={() => setEdit(true)}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
          >
            <Edit2 className="h-3 w-3" /> تعديل
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                onSave({ name, specialization: spec });
                setEdit(false);
              }}
              className="rounded-lg gradient-luxe px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              حفظ
            </button>
            <button
              onClick={() => setEdit(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              إلغاء
            </button>
          </>
        )}
        <button
          onClick={() => setScheduling((s) => !s)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
        >
          <CalendarDays className="h-3 w-3" /> المواعيد
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
        >
          <Power className="h-3 w-3" /> {b.is_active ? "إيقاف" : "تفعيل"}
        </button>
        <button
          onClick={() => setResetting((s) => !s)}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
        >
          <KeyRound className="h-3 w-3" /> كلمة المرور
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive"
        >
          <Trash2 className="h-3 w-3" /> حذف
        </button>
      </div>
      {resetting && (
        <div className="mt-2 flex gap-2">
          <input
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="كلمة المرور الجديدة"
            type="password"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              if (pwd.length < 6) return toast.error("٦ أحرف على الأقل");
              onReset(pwd);
              setPwd("");
              setResetting(false);
            }}
            className="rounded-lg gradient-luxe px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            تأكيد
          </button>
        </div>
      )}
      {scheduling && (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-background/60 p-3">
          <div className="rounded-lg bg-primary/5 p-2 text-[11px] text-muted-foreground">
            يولّد النظام مواعيد كل {sched.slot_minutes} دقيقة من بداية العمل حتى نهايته (مع استثناء
            الاستراحة).
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold text-muted-foreground">أيام العمل</div>
            <div className="flex flex-wrap gap-1">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${sched.working_days.includes(i) ? "gradient-luxe text-primary-foreground" : "border-border"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
              label="بداية الاستراحة"
              type="time"
              value={sched.break_start}
              onChange={(v) => setSched({ ...sched, break_start: v })}
            />
            <Input
              label="نهاية الاستراحة"
              type="time"
              value={sched.break_end}
              onChange={(v) => setSched({ ...sched, break_end: v })}
            />
            <Input
              label="مدة الموعد (د)"
              type="number"
              value={String(sched.slot_minutes)}
              onChange={(v) => setSched({ ...sched, slot_minutes: Number(v) || 40 })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSave({
                  working_days: sched.working_days,
                  start_time: sched.start_time,
                  end_time: sched.end_time,
                  break_start: sched.break_start || null,
                  break_end: sched.break_end || null,
                  slot_minutes: sched.slot_minutes,
                });
                setScheduling(false);
              }}
              className="flex-1 rounded-lg gradient-luxe py-2 text-xs font-bold text-primary-foreground"
            >
              حفظ المواعيد
            </button>
            <button
              onClick={() => setScheduling(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* SERVICES */
function ServicesAdmin() {
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
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe"
      >
        <Plus className="h-4 w-4" /> إضافة خدمة
      </button>
      {open && <ServiceForm onCancel={() => setOpen(false)} onSave={(d) => create.mutate(d)} />}
      {list.data?.map((s: any) => (
        <ServiceRow
          key={s.id}
          s={s}
          onToggle={() => update.mutate({ id: s.id, is_active: !s.is_active })}
          onSave={(d: any) => update.mutate({ id: s.id, ...d })}
          onDelete={() => {
            if (confirm("حذف؟")) del.mutate(s.id);
          }}
        />
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
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
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
          className="flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 font-bold">
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
        onSave={(d) => {
          onSave(d);
          setEdit(false);
        }}
      />
    );
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
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
          className="grid h-8 w-8 place-items-center rounded-lg border border-border"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className={`grid h-8 w-8 place-items-center rounded-lg border ${s.is_active ? "border-success/40 text-success" : "border-border"}`}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* BOOKINGS */
function BookingsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const list = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () =>
      (
        await supabase
          .from("bookings")
          .select("*")
          .order("booking_date", { ascending: false })
          .order("booking_time", { ascending: false })
          .limit(500)
      ).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
  });
  const filtered = (list.data ?? []).filter((b: any) => {
    if (status !== "all" && b.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      b.customer_name?.toLowerCase().includes(s) ||
      b.customer_phone?.includes(q) ||
      b.booking_number?.toLowerCase().includes(s)
    );
  });
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث (اسم/جوال/رقم)"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="all">الكل</option>
          <option value="booked">محجوز</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>
      <div className="space-y-2">
        {filtered.map((b: any) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{b.customer_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {b.service_name} • {b.customer_phone}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {arabicDate(b.booking_date)} • {formatTime(b.booking_time)}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">
                {b.booking_number}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {b.status === "booked" && (
                <>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "completed" })}
                    className="flex-1 rounded-lg gradient-luxe py-1.5 text-xs font-bold text-primary-foreground"
                  >
                    إكمال
                  </button>
                  <button
                    onClick={() => update.mutate({ id: b.id, status: "cancelled" })}
                    className="flex-1 rounded-lg border border-destructive/40 py-1.5 text-xs font-bold text-destructive"
                  >
                    إلغاء
                  </button>
                </>
              )}
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${b.status === "completed" ? "bg-success/15 text-success" : b.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
              >
                {b.status === "booked" ? "محجوز" : b.status === "completed" ? "مكتمل" : "ملغي"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* OFFERS */
function OffersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () =>
      (await supabase.from("offers").select("*").order("created_at", { ascending: false })).data ??
      [],
  });
  const create = useMutation({
    mutationFn: async (d: any) => {
      const { error } = await supabase.from("offers").insert(d);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("تمت الإضافة");
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { error } = await supabase.from("offers").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });
  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe"
      >
        <Plus className="h-4 w-4" /> إضافة عرض
      </button>
      {open && <OfferForm onCancel={() => setOpen(false)} onSave={(d: any) => create.mutate(d)} />}
      {list.data?.map((o: any) => (
        <OfferRow
          key={o.id}
          o={o}
          onSave={(d: any) => update.mutate({ id: o.id, ...d })}
          onToggle={() => update.mutate({ id: o.id, is_active: !o.is_active })}
          onDelete={() => {
            if (confirm("حذف؟")) del.mutate(o.id);
          }}
        />
      ))}
    </div>
  );
}
function OfferForm({ onCancel, onSave, initial }: any) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [pct, setPct] = useState(initial?.discount_percent ?? "");
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <Input label="عنوان العرض" value={title} onChange={setTitle} />
      <Input label="الوصف" value={desc} onChange={setDesc} />
      <Input label="نسبة الخصم %" value={String(pct)} onChange={setPct} type="number" />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onSave({ title, description: desc, discount_percent: pct === "" ? null : Number(pct) })
          }
          disabled={!title}
          className="flex-1 rounded-xl gradient-luxe py-2 font-bold text-primary-foreground disabled:opacity-50"
        >
          حفظ
        </button>
        <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 font-bold">
          إلغاء
        </button>
      </div>
    </div>
  );
}
function OfferRow({ o, onSave, onToggle, onDelete }: any) {
  const [edit, setEdit] = useState(false);
  if (edit)
    return (
      <OfferForm
        initial={o}
        onCancel={() => setEdit(false)}
        onSave={(d: any) => {
          onSave(d);
          setEdit(false);
        }}
      />
    );
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-luxe text-primary-foreground">
        <Tag className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{o.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {o.description || "—"} {o.discount_percent != null && `• -${o.discount_percent}٪`}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => setEdit(true)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className={`grid h-8 w-8 place-items-center rounded-lg border ${o.is_active ? "border-success/40 text-success" : "border-border"}`}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* REVIEWS */
function ReviewsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const [{ data: rev }, { data: bar }] = await Promise.all([
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("barbers").select("id, name"),
      ]);
      const map = new Map((bar ?? []).map((b: any) => [b.id, b.name]));
      return (rev ?? []).map((r: any) => ({ ...r, barber_name: map.get(r.barber_id) ?? "—" }));
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
  return (
    <div className="space-y-2">
      {list.data?.map((r: any) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= r.rating ? "fill-primary text-primary" : "text-muted"}`}
                  />
                ))}
              </div>
              <div className="mt-1 truncate text-sm font-bold">
                {r.customer_name} ← {r.barber_name}
              </div>
              {r.comment && <div className="mt-1 text-sm text-muted-foreground">{r.comment}</div>}
            </div>
            <button
              onClick={() => del.mutate(r.id)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      {!list.data?.length && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد تقييمات
        </div>
      )}
    </div>
  );
}

/* SETTINGS */
function SettingsAdmin() {
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
      break_start: f.break_start || null,
      break_end: f.break_end || null,
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${(f.working_days ?? []).includes(i) ? "gradient-luxe text-primary-foreground" : "border-border"}`}
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
      <Group title="الاستراحة">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="بداية الاستراحة"
            value={f.break_start?.slice(0, 5) ?? ""}
            onChange={(v) => set("break_start", v || null)}
            type="time"
          />
          <Input
            label="نهاية الاستراحة"
            value={f.break_end?.slice(0, 5) ?? ""}
            onChange={(v) => set("break_end", v || null)}
            type="time"
          />
        </div>
      </Group>
      <button
        onClick={save}
        className="w-full rounded-2xl gradient-luxe px-4 py-3 font-bold text-primary-foreground shadow-luxe"
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
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
