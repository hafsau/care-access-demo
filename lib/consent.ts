/*
 * Consent as four separate choices instead of one bundled checkbox, plus the
 * existing optional news opt-in. Every choice is logged with who made it, the
 * version and the language they saw, and the log is what staff tools read:
 * a disabled action always says which choice blocks it, when it was made,
 * and what to do instead.
 *
 * Staff actions are gated on purpose AND channel: a news text needs a yes to
 * news and to texts; a text about studies needs a yes to matching and to texts.
 *
 * The wording is a content proposal pending legal and regulatory review. It is
 * not study informed consent, which happens later, with the study team.
 */
import type { Lang } from "./rules/engine";

export type Choice = "screening" | "matching" | "texts" | "autoVoice" | "news";
export const CHOICES: Choice[] = ["screening", "matching", "texts", "autoVoice", "news"];
/** Only the screening choice is needed to book. Everything else is optional and off until it's turned on. */
export const REQUIRED: Choice[] = ["screening"];

export const CONSENT_VERSION = "draft v1";

export type ConsentState = Record<Choice, boolean | undefined>;
export type ConsentBy = "participant" | "representative" | "staff";
export type ConsentEvent = { at: string; choice: Choice; value: boolean; by: ConsentBy; name?: string; lang: Lang; version: string };

export const NO_CHOICES: ConsentState = { screening: undefined, matching: undefined, texts: undefined, autoVoice: undefined, news: undefined };

export type StaffAction = "humanCall" | "leaveVoicemail" | "textAppointment" | "textStudies" | "autoCall" | "discussStudies" | "referToStudyTeam" | "newsByText" | "newsByEmail";
export const STAFF_ACTIONS: StaffAction[] = ["humanCall", "leaveVoicemail", "textAppointment", "autoCall", "discussStudies", "referToStudyTeam", "textStudies", "newsByText", "newsByEmail"];

/** Every choice an action needs: its purpose, and its channel when the channel has its own choice. */
export const NEEDS: Record<StaffAction, Choice[]> = {
  humanCall: ["screening"],
  leaveVoicemail: ["screening"],
  textAppointment: ["texts"],
  autoCall: ["autoVoice"],
  discussStudies: ["matching"],
  referToStudyTeam: ["matching"],
  textStudies: ["matching", "texts"],
  newsByText: ["news", "texts"],
  newsByEmail: ["news"],
};

const PHONE: StaffAction[] = ["humanCall", "leaveVoicemail", "textAppointment", "textStudies", "autoCall", "newsByText"];
const TO_PHONE_UNSUPERVISED: StaffAction[] = ["textAppointment", "textStudies", "autoCall", "newsByText"];

export type ContactPrefs = { voicemail: boolean; sharedPhone: boolean; hasEmail?: boolean; wrongNumber?: boolean };

export type Gate = { allowed: true; note?: GateNote } | { allowed: false; reason: GateReason; choice?: Choice; since?: ConsentEvent };
export type GateNote = "noHealthDetails";
export type GateReason = "declined" | "notAsked" | "revoked" | "noVoicemail" | "noEmail" | "wrongNumber";

/** The latest event for a choice, so a block can say when it was decided. */
export function lastEvent(log: ConsentEvent[], choice: Choice) {
  return [...log].reverse().find((e) => e.choice === choice);
}

export function can(action: StaffAction, consent: ConsentState, log: ConsentEvent[], prefs: ContactPrefs): Gate {
  if (prefs.wrongNumber && PHONE.includes(action)) return { allowed: false, reason: "wrongNumber" };
  for (const choice of NEEDS[action]) {
    const value = consent[choice];
    if (value === true) continue;
    const since = lastEvent(log, choice);
    const revoked = since && since.value === false && log.some((e) => e.choice === choice && e.value === true);
    return { allowed: false, reason: value === undefined ? "notAsked" : revoked ? "revoked" : "declined", choice, since };
  }
  if (action === "leaveVoicemail" && !prefs.voicemail) return { allowed: false, reason: "noVoicemail" };
  if (action === "newsByEmail" && prefs.hasEmail === false) return { allowed: false, reason: "noEmail" };
  // A shared phone, or any voicemail: reach them, never the details.
  if (action === "leaveVoicemail" || (TO_PHONE_UNSUPERVISED.includes(action) && prefs.sharedPhone)) return { allowed: true, note: "noHealthDetails" };
  return { allowed: true };
}

export function canBook(consent: ConsentState) {
  return REQUIRED.every((c) => consent[c] === true);
}
