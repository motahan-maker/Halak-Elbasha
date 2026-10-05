/**
 * Egyptian mobile phone normalization + validation.
 *
 * Canonical local form: 11 digits starting with 010 / 011 / 012 / 015
 * (e.g. "01012345678"). International form: "+201012345678".
 *
 * Accepts Arabic-Indic digits, spaces, dashes, and +20 / 0020 prefixes.
 */

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Loose digit extraction (Latin digits only) for legacy/staff accounts
 * whose phones were stored in arbitrary formats (backend accepts min 6).
 */
export function looseDigits(input: string): string {
  return toLatinDigits(input.trim()).replace(/[^\d]/g, "");
}

const EGYPTIAN_MOBILE_RE = /^01[0125]\d{8}$/;

/**
 * Normalize any user-entered phone to canonical local form.
 * Returns null when the input is not a valid Egyptian mobile number.
 */
export function normalizeEgyptianPhone(input: string): string | null {
  let digits = toLatinDigits(input.trim()).replace(/[^\d]/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  if (!EGYPTIAN_MOBILE_RE.test(digits)) return null;
  return digits;
}

/** Canonical local form -> international form (+20XXXXXXXXXX). */
export function toInternationalFormat(local: string): string {
  return `+20${local.slice(1)}`;
}

export function isValidEgyptianPhone(input: string): boolean {
  return normalizeEgyptianPhone(input) !== null;
}

export const PHONE_ERROR = "من فضلك أدخل رقم جوال صحيح";
export const NAME_ERROR = "من فضلك أدخل الاسم الكامل";

export function validateFullName(name: string): string | null {
  return name.trim().length === 0 ? NAME_ERROR : null;
}
