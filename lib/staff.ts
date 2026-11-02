/*
 * What the coordinator sees, derived from the record. Staff UI is English and
 * neutral about the participant; their language is shown as a routing fact,
 * and the call script is in the language they asked to be called in.
 */
import { COPY } from "./copy";
import { can, STAFF_ACTIONS, type Choice, type ConsentEvent, type Gate, type StaffAction } from "./consent";
import { fmtStamp } from "./format";
import { matches, type Disposition, type Participant } from "./record";
import type { CriterionResult, Lang } from "./rules/engine";

export const ACTION_LABEL: Record<StaffAction, string> = {
  humanCall: "Call (a person)",
  leaveVoicemail: "Leave a voicemail",
  textAppointment: "Text about the appointment and results",
  autoCall: "Automated reminder call",
  discussStudies: "Talk about studies",
  referToStudyTeam: "Refer to a study team",
  textStudies: "Text about studies",
  newsByText: "Send news by text",
  newsByEmail: "Send news by email",
};

export const CHOICE_LABEL: Record<Choice, string> = {
  screening: "Screening data",
  matching: "Study matching",
  texts: "Text messages",
  autoVoice: "Automated voice calls",
  news: "News and events",
};

export const LANG_NAME: Record<Lang, string> = { en: "English", es: "Spanish" };

/** The language to call in: asked when someone else filled the form, otherwise the one they used. */
export function callLang(p: Participant): Lang {
  return p.callLang ?? p.lang;
}

const byLabel = (e: ConsentEvent, p: Participant) =>
  e.by === "representative" ? `${e.name ?? "Their representative"} (representative)` : e.by === "staff" ? "Staff, on a call" : p.contact.first || "The participant";

/** Plain-English reason a staff action is blocked: which choice, who made it, when, and in which language. */
export function blockedReason(g: Gate, p: Participant): string | null {
  if (g.allowed) return null;
  const name = p.contact.first || "The participant";
  const what = g.choice && g.choice !== "screening" ? `${CHOICE_LABEL[g.choice]}: ` : "";
  const who = g.since ? byLabel(g.since, p) : name;
  const when = g.since ? ` on ${fmtStamp(g.since.at)} (${LANG_NAME[g.since.lang]}, wording ${g.since.version})` : "";
  switch (g.reason) {
    case "declined":
      return `${what}${who} said no${when}.`;
    case "revoked":
      return `${what}${who} turned this off${when}.`;
    case "notAsked":
      return `${what}no choice made yet.`;
    case "noVoicemail":
      return `${name} asked us not to leave voicemails.`;
    case "noEmail":
      return `${name} doesn't use email.`;
    case "wrongNumber":
      return "The phone number was marked wrong on a call.";
  }
}

export const INSTEAD: Partial<Record<StaffAction, string>> = {
  autoCall: "Call yourself instead.",
  textAppointment: "Call instead.",
  textStudies: "Talk about studies on a call instead.",
  leaveVoicemail: "Try again in their call window.",
  discussStudies: "Results only on the call. Don't mention studies.",
  referToStudyTeam: "Don't share their answers with any study team.",
  humanCall: "Confirm the number at the visit.",
};

export function prefsOf(p: Participant) {
  return { voicemail: !!p.contact.voicemail, sharedPhone: !!p.contact.sharedPhone, hasEmail: !p.contact.noEmail && !!p.contact.email, wrongNumber: !!p.wrongNumber };
}

export function reach(p: Participant) {
  return STAFF_ACTIONS.map((action) => {
    const gate = can(action, p.consent, p.consentLog, prefsOf(p));
    return { action, gate, reason: blockedReason(gate, p), instead: gate.allowed ? undefined : INSTEAD[action] };
  });
}

/** An answer in staff English: "Stent in a heart artery, High cholesterol". */
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

export const RESOLVED_LABEL = { prescreen: "From the pre-screen", screening: "Known after the screening", call: "Ask on the call" } as const;

/** Unknowns a coordinator can close on the call (not the ones that need the blood test). */
export function toConfirm(p: Participant, amendments: string[] = []): { study: string; c: CriterionResult }[] {
  return matches(p, amendments)
    .filter((r) => r.status === "possible")
    .flatMap((r) => r.criteria.filter((c) => (c.result === "unknown" || c.confirmedOnCall) && c.resolvedAt !== "screening").map((c) => ({ study: r.study.id, c })));
}

export const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: "reached", label: "Reached them" },
  { value: "voicemail", label: "Left a voicemail (no health details)" },
  { value: "noAnswer", label: "No answer, no voicemail" },
  { value: "callBack", label: "Asked to call back" },
  { value: "wrongNumber", label: "Wrong number" },
  { value: "declined", label: "Declined to talk" },
];

export function nextStep(p: Participant, amendments: string[] = []) {
  if (!p.consent.screening) return "Not booked";
  if (p.wrongNumber) return "Wrong number: confirm contact details at the visit";
  const last = p.calls.at(-1)?.disposition;
  if (last === "callBack") return "Call back, in their call window";
  if (last === "declined") return "Declined to talk: reminder only";
  if (last === "noAnswer" || last === "voicemail") return `Try again (${p.calls.length} attempt${p.calls.length === 1 ? "" : "s"})`;
  if (last === "reached") return toConfirm(p, amendments).some((x) => x.c.result === "unknown") ? "Reached: still to confirm" : "Reached: see them at the screening";
  return matches(p, amendments).some((r) => r.status === "possible") ? "Pre-visit call: confirm study questions" : "Reminder before the visit";
}

export function filledByLabel(p: Participant) {
  if (p.filledBy === "lar") return p.rep ? `${p.rep.name}, legally authorized representative` : "Legally authorized representative";
  if (p.filledBy === "helper") return "A helper, with the participant's answers";
  return "The participant";
}

export function consentLine(e: ConsentEvent) {
  return `${CHOICE_LABEL[e.choice]}: ${e.value ? "yes" : "no"}`;
}

export function consentMeta(e: ConsentEvent, p: Participant) {
  return `By ${byLabel(e, p)}, ${LANG_NAME[e.lang]}, wording ${e.version}`;
}

/** The call opener. Identity first; no health details until it's the right person. */
export const SCRIPT: Record<Lang, { opener: string; verify: string; purpose: string; repOpener: string; repVerify: string }> = {
  en: {
    opener: "Hi, this is [your name] calling from Care Access. May I speak with [first name]?",
    verify: "Before we talk, can you confirm your date of birth?",
    purpose: "I'm calling about your free screening on [date]. Do you have a few minutes?",
    repOpener: "Hi, this is [your name] calling from Care Access. May I speak with [representative's name]?",
    repVerify: "You're listed as making medical decisions for [first name]. Can you bring the paperwork that shows that to the screening?",
  },
  es: {
    opener: "Hola, le habla [su nombre] de Care Access. ¿Puedo hablar con [nombre]?",
    verify: "Antes de seguir, ¿me puede confirmar su fecha de nacimiento?",
    purpose: "Le llamo sobre su chequeo gratis del [fecha]. ¿Tiene unos minutos?",
    repOpener: "Hola, le habla [su nombre] de Care Access. ¿Puedo hablar con [nombre del representante]?",
    repVerify: "Usted aparece como la persona que toma decisiones médicas por [nombre]. ¿Puede traer al chequeo los papeles que lo muestran?",
  },
};
