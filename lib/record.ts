/*
 * One synthetic participant record, read by both sides: the participant's
 * phone writes it, and the coordinator's view reads it once she books. Before
 * she books, nothing leaves her phone, so staff see nothing.
 */
import { ageOn, evaluateAll, type Answers, type Lang } from "./rules/engine";
import { CONSENT_VERSION, NO_CHOICES, type Choice, type ConsentEvent, type ConsentState } from "./consent";

/** The demo's clock. Fixed, so tests and screenshots are repeatable. */
export const TODAY = "2026-11-02";

export type Site = { id: string; name: string; area: string; zip: string; miles: number; spanishStaff: boolean; studies: string[]; slots: string[] };

export const SITES: Site[] = [
  {
    id: "maple",
    name: "Maple Street Community Center",
    area: "East Los Angeles",
    zip: "90022",
    miles: 1.2,
    spanishStaff: true,
    studies: ["HL-204", "KD-118"],
    slots: ["2026-11-14T09:00", "2026-11-14T09:20", "2026-11-14T10:40", "2026-11-14T13:00", "2026-11-15T10:00", "2026-11-15T11:20"],
  },
  {
    id: "library",
    name: "Riverside Branch Library",
    area: "Montebello",
    zip: "90640",
    miles: 4.8,
    spanishStaff: false,
    studies: ["HL-204"],
    slots: ["2026-11-21T09:00", "2026-11-21T09:40", "2026-11-21T11:00"],
  },
];

/** Sites "near" a ZIP. The demo knows two LA ZIPs; anything else has no site yet. */
export function sitesNear(zip: string): Site[] {
  return ["90022", "90023", "90063", "90640"].includes(zip) ? SITES : [];
}

export type FilledBy = "self" | "helper" | "lar";
export type BestTime = "morning" | "afternoon" | "evening";

export type Participant = {
  id: string;
  lang: Lang; // the language she used, and the one to call her in
  zip: string;
  siteId?: string;
  filledBy?: FilledBy;
  dob?: string; // YYYY-MM-DD
  answers: Omit<Answers, "age">; // matching answers, only if she said yes to matching
  consent: ConsentState;
  consentLog: ConsentEvent[];
  contact: { first: string; middle: string; last: string; phone: string; sharedPhone?: boolean; voicemail?: boolean; bestTime?: BestTime; email: string; noEmail: boolean };
  about: { race: string[]; sex?: string };
  slot?: string;
  bookedAt?: string;
  calls: CallAttempt[];
};

export type Disposition = "reached" | "voicemail" | "noAnswer" | "callBack" | "wrongNumber" | "declined";
export type CallAttempt = { at: string; by: string; disposition: Disposition; lang: Lang; note: string };

export function emptyParticipant(lang: Lang = "en"): Participant {
  return {
    id: "new",
    lang,
    zip: "",
    answers: {},
    consent: { ...NO_CHOICES },
    consentLog: [],
    contact: { first: "", middle: "", last: "", phone: "", email: "", noEmail: false },
    about: { race: [] },
    calls: [],
  };
}

export function age(p: Participant) {
  return p.dob ? ageOn(p.dob, TODAY) : undefined;
}

/** The answers the rules engine reads, with age derived from date of birth. */
export function matchAnswers(p: Participant): Answers {
  return { ...p.answers, age: age(p) };
}

export function site(p: Participant) {
  return SITES.find((s) => s.id === p.siteId);
}

export function matches(p: Participant, amendments: string[] = []) {
  const s = site(p);
  if (!s || p.consent.matching !== true) return [];
  return evaluateAll(s.studies, matchAnswers(p), amendments);
}

export function setChoice(p: Participant, choice: Choice, value: boolean, at: string, by: "participant" | "staff" = "participant"): Participant {
  const event: ConsentEvent = { at, choice, value, by, lang: p.lang, version: CONSENT_VERSION };
  const next = { ...p, consent: { ...p.consent, [choice]: value }, consentLog: [...p.consentLog, event] };
  // Stopping study matching drops the matching answers: they were only collected for it.
  if (choice === "matching" && value === false) next.answers = {};
  return next;
}

// ---------------------------------------------------------------------------
// Rosa: the hero scenario. Spanish, booking for herself, says yes to screening,
// matching and texts, no to automated voice calls.

export const ROSA_INPUT = {
  lang: "es" as Lang,
  zip: "90022",
  siteId: "maple",
  filledBy: "self" as FilledBy,
  dob: "1968-03-14",
  choices: { screening: true, matching: true, texts: true, autoVoice: false, news: false } as Record<Choice, boolean>,
  answers: { heart: ["highChol", "stent"], kidney: ["prediabetes"], cancer5y: "no" },
  contact: { first: "Rosa", middle: "", last: "Delgado", phone: "(323) 555-0148", sharedPhone: false, voicemail: true, bestTime: "evening" as BestTime, email: "", noEmail: true },
  about: { race: ["hispanic"], sex: "female" },
  slot: "2026-11-14T09:20",
};

/** Rosa's record as if she'd completed the flow: used by the states gallery and tests. */
export function rosaBooked(): Participant {
  let p: Participant = {
    ...emptyParticipant("es"),
    id: "CA-24117",
    zip: ROSA_INPUT.zip,
    siteId: ROSA_INPUT.siteId,
    filledBy: ROSA_INPUT.filledBy,
    dob: ROSA_INPUT.dob,
    contact: { ...ROSA_INPUT.contact },
    about: { ...ROSA_INPUT.about },
    slot: ROSA_INPUT.slot,
  };
  let minute = 41;
  for (const [choice, value] of Object.entries(ROSA_INPUT.choices) as [Choice, boolean][]) {
    p = setChoice(p, choice, value, `${TODAY}T18:${String(minute++).padStart(2, "0")}`);
  }
  p.answers = { ...ROSA_INPUT.answers };
  p.bookedAt = `${TODAY}T18:52`;
  return p;
}

// ---------------------------------------------------------------------------
// The rest of the coordinator's queue. Synthetic people, each showing one rule.

function booked(partial: Partial<Participant> & { id: string; first: string; last: string; lang: Lang; dob: string }, choices: Record<Choice, boolean>): Participant {
  let p: Participant = {
    ...emptyParticipant(partial.lang),
    ...partial,
    zip: "90022",
    siteId: "maple",
    contact: { first: partial.first, middle: "", last: partial.last, phone: "(323) 555-01" + partial.id.slice(-2), sharedPhone: false, voicemail: true, bestTime: "afternoon", email: "", noEmail: false, ...partial.contact },
  } as Participant;
  for (const [c, v] of Object.entries(choices) as [Choice, boolean][]) p = setChoice(p, c, v, "2026-10-30T15:10");
  p.answers = partial.answers ?? p.answers;
  if (choices.matching === false) p.answers = {};
  return p;
}

export const QUEUE: Participant[] = [
  booked(
    { id: "CA-24098", first: "James", last: "Carter", lang: "en", dob: "1959-07-02", filledBy: "self", answers: { heart: ["heartAttack", "highBp"], kidney: ["t2d"], cancer5y: "no" }, slot: "2026-11-14T09:00", bookedAt: "2026-10-30T15:12" },
    { screening: true, matching: true, texts: true, autoVoice: true, news: true },
  ),
  booked(
    { id: "CA-24103", first: "Linh", last: "Tran", lang: "en", dob: "1974-11-20", filledBy: "self", slot: "2026-11-14T10:40", bookedAt: "2026-10-31T09:03" },
    { screening: true, matching: false, texts: true, autoVoice: false, news: false },
  ),
  booked(
    {
      id: "CA-24109",
      first: "Marisol",
      last: "Peña",
      lang: "es",
      dob: "1981-05-09",
      filledBy: "self",
      answers: { heart: ["unsure"], kidney: ["t2d", "ckd"], cancer5y: "unsure" },
      slot: "2026-11-15T10:00",
      bookedAt: "2026-11-01T20:41",
      contact: { first: "Marisol", middle: "", last: "Peña", phone: "(323) 555-0109", sharedPhone: true, voicemail: false, bestTime: "evening", email: "", noEmail: true },
    },
    { screening: true, matching: true, texts: true, autoVoice: false, news: false },
  ),
  booked(
    { id: "CA-24112", first: "Walter", last: "Brooks", lang: "en", dob: "1953-02-17", filledBy: "lar", answers: { heart: ["stroke"], kidney: ["none"], cancer5y: "no" }, slot: "2026-11-15T11:20", bookedAt: "2026-11-02T11:30" },
    { screening: true, matching: true, texts: false, autoVoice: false, news: false },
  ),
];

/** The ROSA_INPUT choices in the order the flow asks them. */
export const CHOICE_ORDER: Choice[] = ["screening", "matching", "texts", "autoVoice", "news"];
