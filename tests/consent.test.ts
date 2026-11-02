import { describe, expect, it } from "vitest";
import { can, canBook, STAFF_ACTIONS, NEEDS } from "@/lib/consent";
import { rosaBooked, setChoice, QUEUE, emptyParticipant, TODAY } from "@/lib/record";

const prefs = (p: ReturnType<typeof rosaBooked>) => ({ voicemail: !!p.contact.voicemail, sharedPhone: !!p.contact.sharedPhone });

describe("consent gates what staff can do", () => {
  const rosa = rosaBooked();

  it("blocks automated calls for Rosa, and says she declined and when", () => {
    const g = can("autoCall", rosa.consent, rosa.consentLog, prefs(rosa));
    expect(g.allowed).toBe(false);
    if (!g.allowed) {
      expect(g.reason).toBe("declined");
      expect(g.since?.lang).toBe("es");
      expect(g.since?.at.startsWith(TODAY)).toBe(true);
    }
  });

  it("allows a call from a person, texts, and talking about studies", () => {
    for (const a of ["humanCall", "sendText", "discussStudies", "referToStudyTeam"] as const) expect(can(a, rosa.consent, rosa.consentLog, prefs(rosa)).allowed, a).toBe(true);
  });

  it("knows the difference between declined and turned off later", () => {
    const later = setChoice(rosa, "texts", false, `${TODAY}T19:30`);
    const g = can("sendText", later.consent, later.consentLog, prefs(later));
    expect(g.allowed === false && g.reason).toBe("revoked");
  });

  it("drops matching answers when she stops study matching", () => {
    const later = setChoice(rosa, "matching", false, `${TODAY}T19:31`);
    expect(later.answers).toEqual({});
    expect(can("discussStudies", later.consent, later.consentLog, prefs(later)).allowed).toBe(false);
  });

  it("a shared phone still gets texts, but never health details", () => {
    const marisol = QUEUE.find((p) => p.contact.first === "Marisol")!;
    const g = can("sendText", marisol.consent, marisol.consentLog, prefs(marisol));
    expect(g).toEqual({ allowed: true, note: "noHealthDetails" });
    expect(can("leaveVoicemail", marisol.consent, marisol.consentLog, prefs(marisol))).toMatchObject({ allowed: false, reason: "noVoicemail" });
  });

  it("every staff action depends on exactly one choice", () => {
    for (const a of STAFF_ACTIONS) expect(NEEDS[a]).toBeTruthy();
  });

  it("only the screening choice is needed to book", () => {
    const p = setChoice(emptyParticipant(), "screening", true, TODAY);
    expect(canBook(p.consent)).toBe(true);
    expect(canBook(emptyParticipant().consent)).toBe(false);
  });
});
