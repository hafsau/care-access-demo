import { describe, expect, it } from "vitest";
import { can, canBook, STAFF_ACTIONS, NEEDS, type StaffAction } from "@/lib/consent";
import { matches, rosaBooked, setChoice, QUEUE, emptyParticipant, TODAY, type Participant } from "@/lib/record";
import { blockedReason, callLang, consentMeta, nextStep, prefsOf, reach, SCRIPT } from "@/lib/staff";

const gate = (a: StaffAction, p: Participant) => can(a, p.consent, p.consentLog, prefsOf(p));

describe("consent gates what staff can do", () => {
  const rosa = rosaBooked();

  it("blocks automated calls for Rosa, and says she declined, when and in which language", () => {
    const g = gate("autoCall", rosa);
    expect(g.allowed).toBe(false);
    if (!g.allowed) {
      expect(g.reason).toBe("declined");
      expect(g.since?.lang).toBe("es");
      expect(g.since?.at.startsWith(TODAY)).toBe(true);
    }
  });

  it("allows a call from a person, appointment texts, study texts and talking about studies", () => {
    for (const a of ["humanCall", "textAppointment", "textStudies", "discussStudies", "referToStudyTeam"] as const) expect(gate(a, rosa).allowed, a).toBe(true);
  });

  it("knows the difference between declined and turned off later", () => {
    const later = setChoice(rosa, "texts", false, `${TODAY}T19:30`);
    const g = gate("textAppointment", later);
    expect(g.allowed === false && g.reason).toBe("revoked");
  });

  it("drops matching answers, and anything confirmed on a call, when matching is turned off", () => {
    const later = setChoice({ ...rosa, callAnswers: { "HL-204:otherStudy": "met" } }, "matching", false, `${TODAY}T19:31`);
    expect(later.answers).toEqual({});
    expect(later.callAnswers).toEqual({});
    expect(gate("discussStudies", later).allowed).toBe(false);
  });

  it("a shared phone still gets texts, but never health details", () => {
    const marisol = QUEUE.find((p) => p.contact.first === "Marisol")!;
    expect(gate("textAppointment", marisol)).toEqual({ allowed: true, note: "noHealthDetails" });
    expect(gate("leaveVoicemail", marisol)).toMatchObject({ allowed: false, reason: "noVoicemail" });
  });

  it("only the screening choice is needed to book", () => {
    const p = setChoice(emptyParticipant(), "screening", true, TODAY);
    expect(canBook(p.consent)).toBe(true);
    expect(canBook(emptyParticipant().consent)).toBe(false);
  });
});

describe("purpose and channel together", () => {
  const base = rosaBooked();

  it("news by text needs a yes to news AND to texts", () => {
    const newsNoTexts = setChoice(setChoice(base, "news", true, TODAY), "texts", false, TODAY);
    const g = gate("newsByText", newsNoTexts);
    expect(g.allowed).toBe(false);
    if (!g.allowed) expect(g.choice).toBe("texts");
    expect(gate("newsByText", setChoice(base, "news", true, TODAY)).allowed).toBe(true);
  });

  it("a text about studies needs a yes to matching AND to texts", () => {
    const noMatching = setChoice(base, "matching", false, TODAY);
    const g = gate("textStudies", noMatching);
    expect(g.allowed === false && g.choice).toBe("matching");
  });

  it("news by email needs an email address", () => {
    const g = gate("newsByEmail", setChoice(base, "news", true, TODAY));
    expect(g.allowed === false && g.reason).toBe("noEmail");
  });

  it("every action names at least one choice it depends on", () => {
    for (const a of STAFF_ACTIONS) expect(NEEDS[a].length).toBeGreaterThan(0);
  });
});

describe("what a call changes", () => {
  it("a wrong number blocks every phone action, and says so", () => {
    const p = { ...rosaBooked(), wrongNumber: true };
    for (const a of ["humanCall", "textAppointment", "autoCall", "leaveVoicemail"] as const) expect(gate(a, p).allowed, a).toBe(false);
    expect(blockedReason(gate("humanCall", p), p)).toMatch(/marked wrong/);
    expect(nextStep(p)).toMatch(/Wrong number/);
  });

  it("an answer confirmed on the call settles a criterion the form couldn't", () => {
    const p = { ...rosaBooked(), callAnswers: { "HL-204:otherStudy": "met" as const } };
    const c = matches(p).find((r) => r.study.id === "HL-204")!.criteria.find((x) => x.id === "otherStudy")!;
    expect(c.result).toBe("met");
    expect(c.confirmedOnCall).toBe(true);
  });
});

describe("representatives", () => {
  const walter = QUEUE.find((p) => p.filledBy === "lar")!;

  it("logs a representative's choices as theirs, by name", () => {
    expect(walter.consentLog.every((e) => e.by === "representative" && e.name === "Denise Brooks")).toBe(true);
    expect(consentMeta(walter.consentLog[0], walter)).toMatch(/^By Denise Brooks \(representative\)/);
  });

  it("calls the representative, and checks their authority", () => {
    expect(SCRIPT[callLang(walter)].repVerify).toMatch(/paperwork/);
  });
});

describe("staff copy", () => {
  it("never assumes a participant's gender", () => {
    for (const p of [...QUEUE, rosaBooked()]) {
      const text = [...reach(p).map((r) => `${r.reason ?? ""} ${r.instead ?? ""}`), nextStep(p), ...p.consentLog.map((e) => consentMeta(e, p))].join(" ");
      expect(text, p.contact.first).not.toMatch(/\b(she|her|hers|herself|he|him|his|himself)\b/i);
    }
  });
});
