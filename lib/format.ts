import type { Lang } from "./rules/engine";

const LOCALE: Record<Lang, string> = { en: "en-US", es: "es-US" };

/** Demo timestamps are wall-clock strings ("2026-11-14T09:20"); format them as written, without time-zone shifts. */
function date(s: string) {
  return new Date(`${s.length === 16 ? s + ":00" : s}Z`);
}

export function fmtSlot(s: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date(s));
}

export function fmtDay(s: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(date(s));
}

export function fmtTime(s: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date(s));
}

export function fmtStamp(s: string, lang: Lang = "en") {
  return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date(s));
}

export function fmtDob(dob: string, lang: Lang) {
  return new Intl.DateTimeFormat(LOCALE[lang], { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date(`${dob}T00:00`));
}

/** Read a dotted key like "where.zipError" out of a copy object. */
export function pick(obj: unknown, key: string): string {
  const v = key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
  return typeof v === "string" ? v : key;
}
