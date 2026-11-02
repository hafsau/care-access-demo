import { describe, expect, it } from "vitest";
import { LIVE_SLIDES } from "@/lib/live-slides";
import { COPY } from "@/lib/copy";
import { LEDGER } from "@/lib/ledger";
import { fernandezHuerta, fleschKincaidGrade } from "@/lib/readability";

describe("ledger", () => {
  it("accounts for every slide in the live pre-screen", () => {
    const slides: readonly string[] = LIVE_SLIDES;
    const covered = LEDGER.flatMap((r) => r.slide.split("/").map((x) => x.trim()));
    for (const id of slides) {
      expect(covered, `ledger is missing live slide "${id}"`).toContain(id);
    }
    for (const c of covered) expect(slides, `ledger names a slide the live form doesn't have: "${c}"`).toContain(c);
  });
});

function keys(o: unknown, prefix = ""): string[] {
  if (o === null || typeof o !== "object") return [prefix];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === "function" ? [`${prefix}${k}()`] : keys(v, `${prefix}${k}.`)));
}

describe("copy", () => {
  it("Spanish has every English key", () => {
    expect(keys(COPY.es).sort()).toEqual(keys(COPY.en).sort());
  });

  it("consent summaries read at about grade 8 or below in English", () => {
    for (const c of ["screening", "matching", "texts", "autoVoice", "news"] as const) {
      const g = fleschKincaidGrade(COPY.en.choices[c].summary);
      expect(g, `${c}: grade ${g.toFixed(1)}`).toBeLessThanOrEqual(8.5);
    }
  });

  it("consent summaries are easy to read in Spanish (Fernández-Huerta 60 or higher)", () => {
    for (const c of ["screening", "matching", "texts", "autoVoice", "news"] as const) {
      const g = fernandezHuerta(COPY.es.choices[c].summary);
      expect(g, `${c}: ease ${g.toFixed(0)}`).toBeGreaterThanOrEqual(60);
    }
  });

  it("never promises a diagnosis or a result value", () => {
    const all = JSON.stringify(COPY.en).toLowerCase();
    for (const banned of ["diagnose you", "your risk is", "mg/dl", "nmol/l", "you have high", "guarantee"]) expect(all).not.toContain(banned);
  });
});
