export function digitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const num = digitsOnly(phone);
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function arabicDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export function arabicShortDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const ARABIC_DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
