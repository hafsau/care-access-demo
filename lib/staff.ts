/*
 * What the coordinator sees, derived from the record. Staff UI is English;
 * the participant's language is shown as a routing fact, and the call script
 * is in her language.
 */
import { COPY } from "./copy";
import { can, STAFF_ACTIONS, type Choice, type ConsentEvent, type Gate, type StaffAction } from "./consent";
import { fmtStamp } from "./format";
import { matches, type Participant } from "./record";
import type { CriterionResult, Lang } from "./rules/engine";

export const ACTION_LABEL: Record<StaffAction, string> = {
  humanCall: "Call (a person)",
  leaveVoicemail: "Leave a voicemail",
  sendText: "Send a text",
  autoCall: "Automated voice call",
  discussStudies: "Talk about studies",
  referToStudyTeam: "Refer to a study team",
  sendNews: "Send news and events",
};

export const CHOICE_LABEL: Record<Choice, string> = {
  screening: "Screening data",
  matching: "Study matching",
  texts: "Text messages",
  autoVoice: "Automated voice calls",
  news: "News and events",
};

export const LANG_NAME: Record<Lang, string> = { en: "English", es: "Spanish" };

/** Plain-English reason a staff action is blocked, naming her choice, when and in which language. */
export function blockedReason(g: Gate, p: Participant): string | null {
  if (g.allowed) return null;
  const who = p.contact.first || "She";
  const when = g.since ? ` on ${fmtStamp(g.since.at)} (${LANG_NAME[g.since.lang]}, wording ${g.since.version})` : "";
  switch (g.reason) {
    case "declined":
      return `${who} said no${when}.`;
    case "revoked":
      return `${who} turned this off${when}.`;
    case "notAsked":
      return `${who} hasn't made this choice.`;
    case "noVoicemail":
      return `${who} asked us not to leave voicemails.`;
  }
}

export const INSTEAD: Partial<Record<StaffAction, string>> = {
  autoCall: "Call her yourself.",
  sendText: "Call her instead.",
  leaveVoicemail: "Try again in her call window.",
  discussStudies: "Results only on the call. Don't mention studies.",
  referToStudyTeam: "Don't share her answers with any study team.",
};

export function reach(p: Participant) {
  const prefs = { voicemail: !!p.contact.voicemail, sharedPhone: !!p.contact.sharedPhone };
  return STAFF_ACTIONS.map((action) => {
    const gate = can(action, p.consent, p.consentLog, prefs);
    return { action, gate, reason: blockedReason(gate, p), instead: gate.allowed ? undefined : INSTEAD[action] };
  });
}

/** Her answer in staff English: "Stent in a heart artery, High cholesterol". */
export function answerLabel(field: string, value: unknown): string {
  const en = COPY.en;
  const opts: Record<string, string> = {
    ...(field === "heart" ? en.health.heart.options : field === "kidney" ? en.health.kidney.options : field === "smoking" ? en.health.smoking.options : {}),
    none: "None of these",
    unsure: "Not sure",
    yes: "Yes",
    no: "No",
  };
  if (field === "age") return `${value} (from date of birth)`;
  return (Array.isArray(value) ? value : [value]).map((x) => opts[String(x)] ?? String(x)).join(", ");
}

export const RESOLVED_LABEL = { prescreen: "From her answers", screening: "Known after the screening", call: "Ask on the call" } as const;

/** Unknowns a coordinator can close on the call (not the ones that need the blood test). */
export function toConfirm(p: Participant, amendments: string[] = []): { study: string; c: CriterionResult }[] {
  return matches(p, amendments)
    .filter((r) => r.status === "possible")
    .flatMap((r) => r.criteria.filter((c) => c.result === "unknown" && c.resolvedAt !== "screening").map((c) => ({ study: r.study.id, c })));
}

export function nextStep(p: Participant, amendments: string[] = []) {
  if (!p.consent.screening) return "Not booked";
  const possible = matches(p, amendments).some((r) => r.status === "possible");
  if (p.calls.some((c) => c.disposition === "reached")) return "Reached; screening booked";
  return possible ? "Pre-visit call: confirm study questions" : "Reminder before the visit";
}

export function filledByLabel(p: Participant) {
  return p.filledBy === "lar" ? "Her legally authorized representative" : p.filledBy === "helper" ? "A helper, with her answers" : "Herself";
}

export function consentLine(e: ConsentEvent) {
  return `${CHOICE_LABEL[e.choice]}: ${e.value ? "yes" : "no"}`;
}

/** The call opener in her language. Identity first, no health details until it's her. */
export const SCRIPT: Record<Lang, { opener: string; verify: string; purpose: string }> = {
  en: {
    opener: "Hi, this is [your name] calling from Care Access. May I speak with [first name]?",
    verify: "Before we talk, can you confirm your date of birth?",
    purpose: "I'm calling about your free screening on [date]. Do you have a few minutes?",
  },
  es: {
    opener: "Hola, le habla [su nombre] de Care Access. ¿Puedo hablar con [nombre]?",
    verify: "Antes de seguir, ¿me puede confirmar su fecha de nacimiento?",
    purpose: "Le llamo sobre su chequeo gratis del [fecha]. ¿Tiene unos minutos?",
  },
};
