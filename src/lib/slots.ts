// Slot generation: deterministic from settings. Admin never creates slots manually.
export interface SlotConfig {
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  slot_minutes: number;
}

export type SlotKind = "available" | "booked" | "past";
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

  if (isNaN(start) || isNaN(end) || isNaN(dur) || dur <= 0) {
    return [];
  }

  const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)));

  const slots: Slot[] = [];
  if (start < end) {
    for (let t = start; t < end; t += dur) {
      const time = fromMin(t);
      slots.push({
        time,
        label: arabicHour12(time),
        kind: booked.has(time) ? "booked" : "available",
      });
    }
  } else {
    for (let t = start; t < 1440; t += dur) {
      const time = fromMin(t % 1440);
      slots.push({
        time,
        label: arabicHour12(time),
        kind: booked.has(time) ? "booked" : "available",
      });
    }
    for (let t = 0; t < end; t += dur) {
      const time = fromMin(t % 1440);
      slots.push({
        time,
        label: arabicHour12(time),
        kind: booked.has(time) ? "booked" : "available",
      });
    }
  }
  return slots;
}

export const formatTime = arabicHour12;
