/*
 * Every question in the live cardiometabolic pre-screen (as served on
 * 2026-11-02), and where it goes in the redesign. The point isn't "ask less";
 * it's "ask once, for a reason, at the moment the reason exists". Owners are my
 * assumption about who needs each answer, to be checked with the team.
 */

export type Disposition =
  | "upfront" // asked of everyone, before booking
  | "afterChoice" // asked after she's made her consent choices, with the reason shown
  | "ifStudyNeeds" // asked only if a study enrolling near her needs it to decide
  | "derived" // worked out from another answer, never asked
  | "onCall" // confirmed by a coordinator on the call
  | "atVisit"; // measured or collected at the screening visit

export type Owner = "screening" | "matching" | "compliance" | "operations" | "equity" | "marketing";

export type LedgerRow = {
  live: string; // the live question, paraphrased
  slide: string; // the live slide or field id
  liveRule: string; // when the live form shows it
  disposition: Disposition;
  owner: Owner;
  why: string;
};

export const LEDGER: LedgerRow[] = [
  { live: "Age", slide: "age", liveRule: "Everyone, required", disposition: "derived", owner: "screening", why: "Worked out from date of birth, so the two can't disagree." },
  { live: "Date of birth", slide: "age", liveRule: "Everyone, required", disposition: "upfront", owner: "screening", why: "Confirms she's 18 or older, and identifies her at the visit." },
  { live: "Height and weight", slide: "heightWeight", liveRule: "Everyone", disposition: "ifStudyNeeds", owner: "matching", why: "Only some studies have weight criteria. Otherwise it can be measured at the visit." },
  { live: "Heart conditions (12, plus none)", slide: "heart-conditions", liveRule: "Everyone, required", disposition: "ifStudyNeeds", owner: "matching", why: "Asked when a heart study is enrolling near her, with \"Not sure\" as an answer." },
  { live: "Type of heart surgery (5, plus other and don't know)", slide: "surgery", liveRule: "If stent or heart surgery", disposition: "onCall", owner: "matching", why: "A detail the coordinator confirms once there's a possible match." },
  { live: "Weight and diabetes conditions (6, plus none)", slide: "weight-and-diabetes", liveRule: "Everyone, required", disposition: "ifStudyNeeds", owner: "matching", why: "Asked when a kidney or metabolic study near her needs it." },
  { live: "Medical history (16 conditions, from asthma to back pain)", slide: "medical-history", liveRule: "Everyone, required", disposition: "ifStudyNeeds", owner: "matching", why: "Each condition is asked only if a study for it is enrolling near her site." },
  { live: "Back pain: how often", slide: "lower-back-pain-occurrence", liveRule: "If back pain", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a back pain study near her." },
  { live: "Back pain: how severe (1–10)", slide: "lower-back-pain-scale", liveRule: "If back pain", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a back pain study near her." },
  { live: "Month and year of diabetes diagnosis (3 slides)", slide: "type-one-diabetes-diagnosis/type-two-diabetes-diagnosis/pre-diabetes-diagnosis", liveRule: "If each is ticked", disposition: "onCall", owner: "matching", why: "Hard to recall on a phone; easier with a coordinator." },
  { live: "Taking medicines for these conditions?", slide: "taking-medications", liveRule: "If several conditions", disposition: "onCall", owner: "matching", why: "Confirmed on the call, with her medicine list in hand." },
  { live: "Which medicines (typeahead)", slide: "medications", liveRule: "If taking medicines", disposition: "onCall", owner: "matching", why: "Typeahead spelling is hard for many people, and harder in a second language." },
  { live: "Using a CPAP machine?", slide: "using-cpap", liveRule: "If sleep apnea", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a sleep study near her." },
  { live: "Cancer in the past 5 years?", slide: "cancer-last-five-years", liveRule: "If sleep apnea (English config); if cancer (Spanish config)", disposition: "ifStudyNeeds", owner: "matching", why: "Asked directly when a nearby study excludes recent cancer. See the note on the two configs." },
  { live: "Year of Alzheimer's or dementia diagnosis", slide: "alzheimers-diagnosis-year", liveRule: "If dementia", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a memory study near her." },
  { live: "Level of cognitive impairment", slide: "cognitive-impairment-level", liveRule: "If dementia", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a memory study near her." },
  { live: "Does someone help make your medical decisions?", slide: "lar-explanation", liveRule: "If dementia", disposition: "upfront", owner: "compliance", why: "Moved to the start for everyone as \"Who's filling this in?\", so a helper or representative is recognized before any health question." },
  { live: "Asthma or COPD flare-up in the past 12 months", slide: "flare-up-past-12-months", liveRule: "If asthma or COPD", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a lung study near her." },
  { live: "Smoking", slide: "smoking", liveRule: "Everyone, required", disposition: "ifStudyNeeds", owner: "matching", why: "Asked when a nearby study has a smoking criterion. A protocol amendment can add it (see /system)." },
  { live: "Cigarettes per day", slide: "smokingAmount", liveRule: "If current or past smoker", disposition: "ifStudyNeeds", owner: "matching", why: "Only when a study needs the amount." },
  { live: "Tried or considered quitting", slide: "quittingAttempts", liveRule: "If current smoker", disposition: "ifStudyNeeds", owner: "matching", why: "Only for a quit-smoking study near her." },
  { live: "Family history (5, plus none)", slide: "family-history-conditions", liveRule: "Everyone, required", disposition: "ifStudyNeeds", owner: "matching", why: "Only when a nearby study uses it." },
  { live: "First, middle and last name", slide: "finalSlide", liveRule: "Everyone (middle optional)", disposition: "upfront", owner: "operations", why: "Needed to book and to greet her at the visit." },
  { live: "Street address, city and state", slide: "finalSlide", liveRule: "Everyone, required", disposition: "atVisit", owner: "operations", why: "City and state come from the ZIP code. A street address isn't needed to book." },
  { live: "ZIP code", slide: "finalSlide", liveRule: "Everyone, required", disposition: "upfront", owner: "operations", why: "Asked first, because it decides which sites and studies apply." },
  { live: "Phone", slide: "finalSlide", liveRule: "Everyone, required", disposition: "upfront", owner: "operations", why: "Results come by phone. Now asked with \"Is this phone shared?\" and \"OK to leave a voicemail?\"" },
  { live: "Email", slide: "finalSlide", liveRule: "Everyone, required", disposition: "upfront", owner: "operations", why: "Optional, with \"I don't use email\". Results come by phone, not email." },
  { live: "Race (8 options, multi-select)", slide: "finalSlide", liveRule: "Everyone, required (includes \"Prefer not to answer\")", disposition: "afterChoice", owner: "equity", why: "Kept, and asked after her choices with the reason in plain words. Combined with ethnicity in the OMB SPD 15 format." },
  { live: "Ethnicity (3 options)", slide: "finalSlide", liveRule: "Everyone, required", disposition: "afterChoice", owner: "equity", why: "Merged into one combined race and ethnicity question (SPD 15), with \"Prefer not to say\"." },
  { live: "Sex", slide: "finalSlide", liveRule: "Everyone, required", disposition: "afterChoice", owner: "matching", why: "Kept with the reason shown: some studies and lab ranges depend on it." },
  { live: "Consent: personal data, sensitive data and clinical trial consideration (one checkbox)", slide: "finalSlide", liveRule: "Required to book", disposition: "upfront", owner: "compliance", why: "Split into two choices: screening data (needed to book) and study matching (her choice)." },
  { live: "Consent: calls or texts, including artificial or prerecorded voice", slide: "finalSlide", liveRule: "Optional", disposition: "upfront", owner: "compliance", why: "Split into two choices: text messages, and automated voice calls. Calls from a person about her results come with the screening." },
  { live: "News, events and health tips", slide: "finalSlide", liveRule: "Optional", disposition: "upfront", owner: "marketing", why: "Kept as it is: optional and separate." },
];

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  upfront: "Everyone, before booking",
  afterChoice: "After her choices, with the reason",
  ifStudyNeeds: "Only if a nearby study needs it",
  derived: "Worked out, not asked",
  onCall: "Confirmed on the call",
  atVisit: "At the visit",
};

export const OWNER_LABEL: Record<Owner, string> = {
  screening: "Screening",
  matching: "Study matching",
  compliance: "Compliance",
  operations: "Operations",
  equity: "Health equity and sponsor diversity",
  marketing: "Marketing",
};
