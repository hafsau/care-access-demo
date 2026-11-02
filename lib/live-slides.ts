/*
 * The slide ids of the live cardiometabolic pre-screen, as served on
 * 2026-11-02 (cardiometabolicscreening.careaccess.com, English). Only the ids,
 * so the ledger test can prove every live question is accounted for.
 */
export const LIVE_OBSERVED = "2026-11-02";
export const LIVE_SLIDES = [
  "age",
  "heightWeight",
  "heart-conditions",
  "surgery",
  "weight-and-diabetes",
  "medical-history",
  "lower-back-pain-occurrence",
  "lower-back-pain-scale",
  "type-one-diabetes-diagnosis",
  "type-two-diabetes-diagnosis",
  "pre-diabetes-diagnosis",
  "taking-medications",
  "medications",
  "using-cpap",
  "cancer-last-five-years",
  "alzheimers-diagnosis-year",
  "cognitive-impairment-level",
  "lar-explanation",
  "flare-up-past-12-months",
  "smoking",
  "smokingAmount",
  "quittingAttempts",
  "family-history-conditions",
  "finalSlide"
] as const;
export const LIVE_CONDITIONAL = ["surgery", "lower-back-pain-occurrence", "lower-back-pain-scale", "type-one-diabetes-diagnosis", "type-two-diabetes-diagnosis", "pre-diabetes-diagnosis", "taking-medications", "medications", "using-cpap", "cancer-last-five-years", "alzheimers-diagnosis-year", "cognitive-impairment-level", "lar-explanation", "flare-up-past-12-months", "smokingAmount", "quittingAttempts"] as const;
