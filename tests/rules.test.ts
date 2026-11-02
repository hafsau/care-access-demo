import { describe, expect, it } from "vitest";
import { STUDIES, evaluate, evaluateStudy, fieldsToAsk, generatedCases, ageOn } from "@/lib/rules/engine";
import { matchAnswers, rosaBooked, matches } from "@/lib/record";

describe("rules table", () => {
  it("every criterion is tri-state and labelled in both languages", () => {
    for (const s of STUDIES)
      for (const c of [...s.criteria, ...s.amendments.map((a) => a.criterion)]) {
        expect(c.label.en.length, `${s.id}/${c.id}`).toBeGreaterThan(0);
        expect(c.label.es.length, `${s.id}/${c.id}`).toBeGreaterThan(0);
        if (c.resolvedAt === "prescreen") expect(c.field && c.op && c.examples, `${s.id}/${c.id} needs field, op and examples`).toBeTruthy();
        else expect(evaluate(c, { age: 50, heart: ["stent"] })).toBe("unknown");
      }
  });

  // One test per row of the table, generated from its examples, amendments included.
  const amendments = STUDIES.flatMap((s) => s.amendments.map((a) => a.id));
  for (const t of generatedCases(amendments)) {
    it(`${t.study} ${t.criterion}: ${JSON.stringify(t.given)} → ${t.expect}`, () => {
      const c = t.criterionDef;
      expect(evaluate(c, t.given === undefined ? {} : { [c.field!]: t.given })).toBe(t.expect);
    });
  }

  it("treats \"not sure\" as unknown, never as no", () => {
    const heart = STUDIES[0].criteria.find((c) => c.id === "heartHistory")!;
    expect(evaluate(heart, { heart: ["unsure"] })).toBe("unknown");
    expect(evaluate(heart, { heart: ["highChol", "unsure"] })).toBe("unknown");
    expect(evaluate(heart, { heart: ["stent", "unsure"] })).toBe("met");
    const cancer = STUDIES[0].criteria.find((c) => c.id === "cancer")!;
    expect(evaluate(cancer, { cancer5y: "unsure" })).toBe("unknown");
  });

  it("derives age from date of birth, including the day before a birthday", () => {
    expect(ageOn("1968-03-14", "2026-11-02")).toBe(58);
    expect(ageOn("2008-11-03", "2026-11-02")).toBe(17);
    expect(ageOn("2008-11-02", "2026-11-02")).toBe(18);
  });
});

describe("Rosa", () => {
  const rosa = rosaBooked();

  it("is a possible match for HL-204 on 3 answers, with 2 things still unknown", () => {
    const hl = matches(rosa).find((r) => r.study.id === "HL-204")!;
    expect(hl.status).toBe("possible");
    expect(hl.criteria.filter((c) => c.result === "met").map((c) => c.id)).toEqual(["age", "heartHistory", "cancer"]);
    expect(hl.criteria.filter((c) => c.result === "unknown").map((c) => c.id)).toEqual(["lpa", "otherStudy"]);
  });

  it("is not a match for KD-118, and the reason is her own answer", () => {
    const kd = matches(rosa).find((r) => r.study.id === "KD-118")!;
    expect(kd.status).toBe("notAMatch");
    const why = kd.criteria.find((c) => c.result === "notMet")!;
    expect(why.id).toBe("t2d");
    expect(why.source?.value).toEqual(["prediabetes"]);
  });

  it("an amendment adds a criterion she was never asked, so it's unknown, not a no", () => {
    const hl = evaluateStudy(STUDIES[0], matchAnswers(rosa), ["amend-2"]);
    expect(hl.criteria.find((c) => c.id === "smoking")!.result).toBe("unknown");
    expect(hl.status).toBe("possible");
  });
});

describe("asking only what a nearby study needs", () => {
  const both = ["HL-204", "KD-118"];

  it("asks the history questions first, and nothing for a study an earlier answer ruled out", () => {
    expect(fieldsToAsk(both, { age: 58 })).toEqual(["heart", "kidney", "cancer5y"]);
    // No heart history rules out HL-204; prediabetes rules out KD-118. Cancer serves neither, so it isn't asked.
    expect(fieldsToAsk(both, { age: 58, heart: ["none"], kidney: ["prediabetes"] })).toEqual(["heart", "kidney"]);
  });

  it("asks nothing when her age already rules out every study", () => {
    expect(fieldsToAsk(both, { age: 22 })).toEqual([]);
  });

  it("only asks about smoking once the amendment is on", () => {
    expect(fieldsToAsk(["HL-204"], { age: 58 })).not.toContain("smoking");
    expect(fieldsToAsk(["HL-204"], { age: 58 }, ["amend-2"])).toContain("smoking");
  });
});
