// Slot generation: deterministic from settings. Admin never creates slots manually.
export interface SlotConfig {
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  slot_minutes: number;
}

export type SlotKind = "available" | "break" | "booked" | "past";
export interface Slot {
  time: string; // "HH:MM"
  label: string;
  kind: SlotKind;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (n: number) => {
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const arabicHour12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "م" : "ص";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

export function generateSlots(cfg: SlotConfig, bookedTimes: string[] = []): Slot[] {
  const start = toMin(cfg.start_time);
  const end = toMin(cfg.end_time);
  const dur = cfg.slot_minutes || 40;

  if (isNaN(start) || isNaN(end) || isNaN(dur) || dur <= 0 || start >= end) {
    return [];
  }

  const bs = cfg.break_start ? toMin(cfg.break_start) : null;
  const be = cfg.break_end ? toMin(cfg.break_end) : null;
  const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)));

  const slots: Slot[] = [];
  for (let t = start; t < end; t += dur) {
    const time = fromMin(t);
    const isBreak = bs !== null && be !== null && t >= bs && t < be;
    const isBooked = booked.has(time);
    slots.push({
      time,
      label: arabicHour12(time),
      kind: isBreak ? "break" : isBooked ? "booked" : "available",
    });
  }
  return slots;
}

export const formatTime = arabicHour12;
