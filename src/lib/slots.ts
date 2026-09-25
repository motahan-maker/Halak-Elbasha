// Slot generation: deterministic from settings. Admin never creates slots manually.
export interface SlotConfig {
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  slot_minutes: number;
  break_start?: string | null;
  break_end?: string | null;
}

export type SlotKind = "available" | "booked" | "past" | "break";
export interface Slot {
  time: string; // "HH:MM"
  label: string;
  kind: SlotKind;
}

export const timeToMinutes = (t: string) => {
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

interface Window {
  start: number;
  end: number;
}

/** Working hours that cross midnight (e.g. 16:00 → 02:00). */
export function isOvernight(cfg: { start_time: string; end_time: string }) {
  const start = timeToMinutes(cfg.start_time);
  const end = timeToMinutes(cfg.end_time);
  if (isNaN(start) || isNaN(end)) return false;
  return start >= end;
}

function windowFrom(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null;
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (isNaN(s) || isNaN(e) || s === e) return null;
  return { start: s, end: e } as Window;
}

function insideWindow(w: Window, t: number) {
  return w.start < w.end ? t >= w.start && t < w.end : t >= w.start || t < w.end;
}

/** A slot belongs to the "past" only for today's date. */
function isPastSlot(cfg: SlotConfig, slotMin: number, nowMin: number) {
  const start = timeToMinutes(cfg.start_time);
  if (isOvernight(cfg)) {
    // Morning hours belong to the previous day's shift.
    if (nowMin >= start) return slotMin >= start && slotMin < nowMin;
    return slotMin >= start || slotMin < nowMin;
  }
  return slotMin < nowMin;
}

/**
 * Deterministic slots between start/end with a fixed step.
 * `bookedTimes` come from the get_booked_times RPC, `nowMinutes` is only passed for today.
 */
export function generateSlots(
  cfg: SlotConfig,
  bookedTimes: string[] = [],
  nowMinutes: number | null = null,
): Slot[] {
  const start = timeToMinutes(cfg.start_time);
  const end = timeToMinutes(cfg.end_time);
  const dur = cfg.slot_minutes || 40;

  if (isNaN(start) || isNaN(end) || isNaN(dur) || dur <= 0) {
    return [];
  }

  const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)));
  const brk = windowFrom(cfg.break_start, cfg.break_end);
  const overnight = isOvernight(cfg);

  const times: number[] = [];
  if (!overnight) {
    for (let t = start; t < end; t += dur) times.push(t);
  } else {
    for (let t = start; t < 1440; t += dur) times.push(t);
    for (let t = 0; t < end; t += dur) times.push(t);
  }

  return times.map((t) => {
    const time = fromMin(t % 1440);
    let kind: SlotKind = "available";
    if (booked.has(time)) kind = "booked";
    else if (nowMinutes != null && isPastSlot(cfg, t % 1440, nowMinutes)) kind = "past";
    else if (brk && insideWindow(brk, t % 1440)) kind = "break";
    return { time, label: arabicHour12(time), kind };
  });
}

/** True when the working day still has remaining time (used to enable "today" in the date picker). */
export function hasRemainingTime(
  cfg: { start_time: string; end_time: string },
  nowMinutes: number,
) {
  const end = timeToMinutes(cfg.end_time);
  const start = timeToMinutes(cfg.start_time);
  if (isNaN(end) || isNaN(start)) return true;
  if (isOvernight({ start_time: cfg.start_time, end_time: cfg.end_time })) {
    return nowMinutes >= start || nowMinutes < end;
  }
  return nowMinutes < end;
}

export const formatTime = arabicHour12;
