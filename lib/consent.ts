/*
 * Consent as four separate choices instead of one bundled checkbox, plus the
 * existing optional news opt-in. Every choice is logged with the version and
 * language she saw, and the log is what staff tools read: a disabled action
 * always says which choice blocks it, when it was made, and what to do instead.
 *
 * The wording is a content proposal pending legal and regulatory review. It is
 * not study informed consent, which happens later, with the study team.
 */
import type { Lang } from "./rules/engine";

export type Choice = "screening" | "matching" | "texts" | "autoVoice" | "news";
export const CHOICES: Choice[] = ["screening", "matching", "texts", "autoVoice", "news"];
/** Only the screening choice is needed to book. Everything else is optional and off until she turns it on. */
export const REQUIRED: Choice[] = ["screening"];

export const CONSENT_VERSION = "draft v1";

export type ConsentState = Record<Choice, boolean | undefined>;
export type ConsentEvent = { at: string; choice: Choice; value: boolean; by: "participant" | "staff"; lang: Lang; version: string };

export const NO_CHOICES: ConsentState = { screening: undefined, matching: undefined, texts: undefined, autoVoice: undefined, news: undefined };

export type StaffAction = "humanCall" | "autoCall" | "sendText" | "leaveVoicemail" | "discussStudies" | "referToStudyTeam" | "sendNews";
export const STAFF_ACTIONS: StaffAction[] = ["humanCall", "leaveVoicemail", "sendText", "autoCall", "discussStudies", "referToStudyTeam", "sendNews"];

/** Which choice each staff action depends on. */
export const NEEDS: Record<StaffAction, Choice> = {
  humanCall: "screening",
  leaveVoicemail: "screening",
  sendText: "texts",
  autoCall: "autoVoice",
  discussStudies: "matching",
  referToStudyTeam: "matching",
  sendNews: "news",
};

export type ContactPrefs = { voicemail: boolean; sharedPhone: boolean };

export type Gate = { allowed: true; note?: GateNote } | { allowed: false; reason: GateReason; since?: ConsentEvent };
export type GateNote = "noHealthDetails";
export type GateReason = "declined" | "notAsked" | "revoked" | "noVoicemail";

/** The latest event for a choice, so a block can say when she decided. */
export function lastEvent(log: ConsentEvent[], choice: Choice) {
  return [...log].reverse().find((e) => e.choice === choice);
}

export function can(action: StaffAction, consent: ConsentState, log: ConsentEvent[], prefs: ContactPrefs): Gate {
  const choice = NEEDS[action];
  const value = consent[choice];
  const since = lastEvent(log, choice);
  if (value !== true) {
    const revoked = since && since.value === false && log.some((e) => e.choice === choice && e.value === true);
    return { allowed: false, reason: value === undefined ? "notAsked" : revoked ? "revoked" : "declined", since };
  }
  if (action === "leaveVoicemail" && !prefs.voicemail) return { allowed: false, reason: "noVoicemail" };
  // A shared phone, or any voicemail: reach her, never the details.
  if (action === "leaveVoicemail" || ((action === "sendText" || action === "autoCall") && prefs.sharedPhone)) return { allowed: true, note: "noHealthDetails" };
  return { allowed: true };
}

export function canBook(consent: ConsentState) {
  return REQUIRED.every((c) => consent[c] === true);
}
