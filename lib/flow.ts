/*
 * The participant flow as data: which steps apply to this person right now,
 * and what each step needs before she can continue. The matching questions come
 * from the rules engine, so a study amendment changes the flow without touching
 * the UI.
 */
import { fieldsToAsk, ORDER, type MatchField } from "./rules/engine";
import { age, matchAnswers, site, type Participant } from "./record";
import type { Choice } from "./consent";

export type StepId = "where" | "who" | "dob" | "choices" | `health:${MatchField}` | "contact" | "about" | "time" | "review";

/** Matching questions: only with a yes to matching, only what a nearby study still needs, plus anything already answered. */
export function healthFields(p: Participant, amendments: string[] = []): MatchField[] {
  const s = site(p);
  if (!s || p.consent.matching !== true) return [];
  const ask = new Set(fieldsToAsk(s.studies, matchAnswers(p), amendments));
  for (const f of ORDER) if (p.answers[f as keyof Participant["answers"]] !== undefined) ask.add(f);
  return ORDER.filter((f) => ask.has(f) && f !== "age");
}

export function steps(p: Participant, amendments: string[] = []): StepId[] {
  return ["where", "who", "dob", "choices", ...healthFields(p, amendments).map((f) => `health:${f}` as StepId), "contact", "about", "time", "review"];
}

/** How many nearby studies a matching question serves, for the "why we ask" line. */
export function studiesNeeding(p: Participant, field: MatchField, amendments: string[] = []) {
  const s = site(p);
  if (!s) return 0;
  return s.studies.filter((id) => fieldsToAsk([id], matchAnswers(p), amendments).includes(field)).length;
}

export type Problem = { field: string; key: string };

/** Choices she must answer yes or no to. News is an opt-in checkbox, off unless ticked. */
export const ASKED_CHOICES: Choice[] = ["screening", "matching", "texts", "autoVoice"];

export function validDob(dob?: string) {
  if (!dob) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] && +m[1] >= 1900 && dob <= "2026-11-02";
}

export function problems(step: StepId, p: Participant): Problem[] {
  const out: Problem[] = [];
  switch (step) {
    case "where":
      if (!/^\d{5}$/.test(p.zip)) out.push({ field: "zip", key: "where.zipError" });
      else if (!p.siteId) out.push({ field: "site", key: "where.pickError" });
      break;
    case "who":
      if (!p.filledBy) out.push({ field: "filledBy", key: "who.error" });
      break;
    case "dob":
      if (!validDob(p.dob)) out.push({ field: "dob-month", key: "dob.error" });
      break;
    case "choices":
      if (p.consent.screening !== true) out.push({ field: "choice-screening", key: "choices.screening.error" });
      for (const c of ASKED_CHOICES.slice(1)) if (p.consent[c] === undefined) out.push({ field: `choice-${c}`, key: `choices.${c}.error` });
      break;
    case "contact":
      if (!p.contact.first.trim() || !p.contact.last.trim()) out.push({ field: "first", key: "contact.nameError" });
      if (p.contact.phone.replace(/\D/g, "").length !== 10) out.push({ field: "phone", key: "contact.phoneError" });
      if (p.contact.sharedPhone === undefined) out.push({ field: "shared", key: "contact.sharedError" });
      if (p.contact.voicemail === undefined) out.push({ field: "voicemail", key: "contact.voicemailError" });
      if (!p.contact.bestTime) out.push({ field: "bestTime", key: "contact.timeError" });
      break;
    case "about":
      if (p.about.race.length === 0) out.push({ field: "race", key: "about.raceError" });
      if (!p.about.sex) out.push({ field: "sex", key: "about.sexError" });
      break;
    case "time":
      if (!p.slot) out.push({ field: "slot", key: "time.error" });
      break;
    case "review":
      break;
    default: {
      const f = step.slice("health:".length) as MatchField;
      const v = p.answers[f as keyof Participant["answers"]];
      if (v === undefined || (Array.isArray(v) && v.length === 0)) out.push({ field: f, key: "health.error" });
    }
  }
  return out;
}

/** A hard stop that ends the flow kindly instead of showing an error. (No site nearby is handled on the "where" step.) */
export function under18(p: Participant) {
  return validDob(p.dob) && (age(p) ?? 0) < 18;
}
