/*
 * The eligibility rules table, evaluated. One table drives three things: which
 * matching questions the participant is asked, the coordinator's
 * met / not met / not known yet view, and the generated tests. Nothing here is
 * a diagnosis; a "possible match" only means "worth a conversation".
 */
import table from "./studies.json";

export type Lang = "en" | "es";
export type Text = Record<Lang, string>;
export type Tri = "met" | "notMet" | "unknown";
export type ResolvedAt = "prescreen" | "screening" | "call";
export type Op = "between" | "anyOf" | "equals";

/** Fields the rules can read. Age is derived from date of birth, never asked twice. */
export type MatchField = "age" | "heart" | "kidney" | "cancer5y" | "smoking";
export type Answers = Partial<{ age: number; heart: string[]; kidney: string[]; cancer5y: string; smoking: string }>;

export type Criterion = {
  id: string;
  kind: "include" | "exclude";
  label: Text;
  resolvedAt: ResolvedAt;
  field?: MatchField;
  op?: Op;
  value?: unknown;
  examples?: { pass: unknown; fail: unknown };
};

export type Amendment = { id: string; title: Text; criterion: Criterion };
export type Study = { id: string; name: Text; summary: Text; criteria: Criterion[]; amendments: Amendment[] };

export const STUDIES = table.studies as Study[];

/** "Not sure" and an unanswered question both leave a criterion unknown. */
export const UNSURE = "unsure";

function predicate(c: Criterion, v: unknown): boolean | null {
  if (v === undefined || v === null || v === "" || v === UNSURE) return null;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (c.op !== "anyOf") return null;
    const hit = v.some((x) => (c.value as string[]).includes(x));
    // Only "not sure" ticked, or nothing relevant but "not sure" alongside: we can't say no.
    if (!hit && v.includes(UNSURE)) return null;
    return hit;
  }
  switch (c.op) {
    case "between": {
      const [lo, hi] = c.value as [number, number];
      return typeof v === "number" && v >= lo && v <= hi;
    }
    case "equals":
      return v === c.value;
    case "anyOf":
      return (c.value as unknown[]).includes(v);
    default:
      return null;
  }
}

export function evaluate(c: Criterion, answers: Answers): Tri {
  if (c.resolvedAt !== "prescreen" || !c.field) return "unknown";
  const p = predicate(c, answers[c.field]);
  if (p === null) return "unknown";
  if (c.kind === "include") return p ? "met" : "notMet";
  return p ? "notMet" : "met";
}

export type CriterionResult = Criterion & { result: Tri; confirmedOnCall?: boolean; source?: { field: MatchField; value: unknown } };
export type StudyStatus = "possible" | "notAMatch";
export type StudyResult = { study: Study; status: StudyStatus; criteria: CriterionResult[]; met: number; notMet: number; unknown: number };

/** The study's criteria with any switched-on amendments appended. */
export function criteriaFor(study: Study, amendments: string[] = []): Criterion[] {
  return [...study.criteria, ...study.amendments.filter((a) => amendments.includes(a.id)).map((a) => a.criterion)];
}

/** `confirmed` holds answers a coordinator recorded on a call, keyed "STUDY:criterion"; they settle criteria the form couldn't. */
export function evaluateStudy(study: Study, answers: Answers, amendments: string[] = [], confirmed: Record<string, Tri> = {}): StudyResult {
  const criteria = criteriaFor(study, amendments).map((c) => ({
    ...c,
    result: confirmed[`${study.id}:${c.id}`] ?? evaluate(c, answers),
    confirmedOnCall: confirmed[`${study.id}:${c.id}`] !== undefined,
    source: c.field && answers[c.field] !== undefined ? { field: c.field, value: answers[c.field] } : undefined,
  }));
  const count = (t: Tri) => criteria.filter((c) => c.result === t).length;
  return { study, status: count("notMet") > 0 ? "notAMatch" : "possible", criteria, met: count("met"), notMet: count("notMet"), unknown: count("unknown") };
}

export function evaluateAll(studyIds: string[], answers: Answers, amendments: string[] = [], confirmed: Record<string, Tri> = {}): StudyResult[] {
  return STUDIES.filter((s) => studyIds.includes(s.id)).map((s) => evaluateStudy(s, answers, amendments, confirmed));
}

/**
 * Which matching fields are worth asking, given the studies enrolling at her
 * site and what she's answered so far. A field is asked only when some study
 * that's still possible needs it to decide. Asked once, for a reason.
 */
export function fieldsToAsk(studyIds: string[], answers: Answers, amendments: string[] = []): MatchField[] {
  const out = new Set<MatchField>();
  for (const s of STUDIES.filter((x) => studyIds.includes(x.id))) {
    const crit = criteriaFor(s, amendments);
    // Judge the study on the fields other than this one: a study already ruled out by
    // an earlier answer doesn't justify asking more.
    for (const c of crit) {
      if (c.resolvedAt !== "prescreen" || !c.field || c.field === "age") continue;
      const others = crit.filter((o) => o.field !== c.field);
      const ruledOut = others.some((o) => evaluate(o, answers) === "notMet");
      if (!ruledOut) out.add(c.field);
    }
  }
  return ORDER.filter((f) => out.has(f));
}

/** Question order in the flow: the broad history questions first, then the yes/no ones. */
export const ORDER: MatchField[] = ["heart", "kidney", "cancer5y", "smoking"];

/** Every criterion with examples, expanded into test cases. Used by tests and shown on /system. */
export function generatedCases(amendments: string[] = []) {
  return STUDIES.flatMap((s) =>
    criteriaFor(s, amendments)
      .filter((c) => c.examples && c.field)
      .flatMap((c) => [
        { study: s.id, criterion: c.id, given: c.examples!.pass, expect: "met" as Tri, criterionDef: c },
        { study: s.id, criterion: c.id, given: c.examples!.fail, expect: "notMet" as Tri, criterionDef: c },
        { study: s.id, criterion: c.id, given: undefined, expect: "unknown" as Tri, criterionDef: c },
      ]),
  );
}

export function ageOn(dob: string, today: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!m || !t) return undefined;
  let age = +t[1] - +m[1];
  if (+t[2] < +m[2] || (+t[2] === +m[2] && +t[3] < +m[3])) age--;
  return age;
}
