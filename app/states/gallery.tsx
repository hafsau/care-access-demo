"use client";

import type { ReactNode } from "react";
import { CoordinatorRecord } from "@/components/coordinator/record";
import { ParticipantFlow } from "@/components/participant/flow";
import { Scope } from "@/components/participant/fields";
import { StoreProvider, type State } from "@/components/store";
import { Eyebrow, Icon } from "@/components/ui";
import { COPY } from "@/lib/copy";
import { emptyParticipant, QUEUE, rosaBooked, setChoice, TODAY, type Participant } from "@/lib/record";

/* Every example below runs the real components on its own preset record. */

const base = (over: Partial<Participant> = {}, lang: "en" | "es" = "en"): Participant => ({ ...emptyParticipant(lang), ...over });
const consented = (p: Participant, choices: Partial<Record<"screening" | "matching" | "texts" | "autoVoice" | "news", boolean>>) =>
  Object.entries(choices).reduce((x, [c, v]) => setChoice(x, c as "screening", v as boolean, `${TODAY}T18:41`), p);

type Example = { id: string; title: string; why: string; init?: Partial<State>; errors?: boolean; render?: ReactNode; side?: "participant" | "coordinator"; record?: Participant };

const contactDraft = consented(base({ zip: "90022", siteId: "maple", filledBy: "self", dob: "1968-03-14" }), { screening: true, matching: false, texts: true, autoVoice: false });

const EXAMPLES: Example[] = [
  {
    id: "no-site",
    title: "No screening site nearby",
    why: "A dead end becomes a single opt-in: one phone number, used for one thing.",
    init: { screen: "where", p: base({ zip: "59001" }) },
  },
  {
    id: "lar",
    title: "Filling it in for someone else",
    why: "Asked first, for everyone. The role is chosen, never defaulted; a representative gives their own name and number, and their choices are logged as theirs.",
    init: { screen: "who", p: base({ filledBy: "lar", rep: { name: "Denise Brooks", relationship: "Daughter, health care power of attorney", phone: "(323) 555-0177" } }) },
  },
  {
    id: "under-18",
    title: "Under 18",
    why: "Worked out from date of birth. A kind stop with somewhere else to go, not an error.",
    init: { screen: "under18", p: base({ dob: "2010-06-01", filledBy: "self" }) },
  },
  {
    id: "errors",
    title: "Errors, summarized and inline",
    why: "Continue with gaps: a summary at the top takes focus, each item jumps to its field, and each field says what's wrong.",
    errors: true,
    init: { screen: "contact", p: contactDraft },
  },
  {
    id: "screening-only",
    title: "Said no to study matching",
    why: "No health history questions at all. The review says so, and the screening is still free.",
    init: {
      screen: "review",
      p: {
        ...consented(base({ zip: "90022", siteId: "maple", filledBy: "self", dob: "1974-11-20", slot: "2026-11-14T10:40", about: { race: ["asian"], sex: "female" } }), { screening: true, matching: false, texts: true, autoVoice: false }),
        contact: { first: "Linh", middle: "", last: "Tran", phone: "(323) 555-0103", sharedPhone: false, voicemail: true, bestTime: "afternoon", email: "", noEmail: true },
      },
    },
  },
  {
    id: "lang-switch",
    title: "Switching language mid-flow",
    why: "The same answers in the other language. Nothing is lost, and the choice is logged in the language she saw.",
    init: {
      screen: "contact",
      p: { ...consented(base({ zip: "90022", siteId: "maple", filledBy: "self", dob: "1968-03-14" }, "es"), { screening: true, matching: true, texts: true, autoVoice: false }), contact: { first: "Rosa", middle: "", last: "Delgado", phone: "(323) 555-0148", sharedPhone: false, voicemail: true, bestTime: "evening", email: "", noEmail: true } },
    },
  },
  {
    id: "no-match",
    title: "No study fits right now",
    why: "Said kindly, with the value of the screening restated. No pressure, no dead end.",
    init: {
      screen: "done",
      booked: true,
      p: {
        ...consented(base({ id: "CA-24120", zip: "90022", siteId: "maple", filledBy: "self", dob: "1990-01-08", slot: "2026-11-15T10:00", bookedAt: `${TODAY}T18:50`, answers: { heart: ["none"], kidney: ["prediabetes"] } }), { screening: true, matching: true, texts: false, autoVoice: false, news: false }),
        answers: { heart: ["none"], kidney: ["prediabetes"] },
      },
    },
  },
  { id: "timeout", title: "Session timeout (sketch)", why: "Answers stay on the phone for 30 minutes, and nothing is cleared without asking. Not wired up in this demo.", render: <Dialog kind="timeout" /> },
  {
    id: "resume",
    title: "Coming back later (sketch)",
    why: "Saved on the phone only, never sent until booking. On a phone marked as shared, health answers wouldn't be kept. Not wired up in this demo.",
    render: <Dialog kind="resume" />,
  },
  { id: "sms", title: "Future state: an automated reminder text", why: "Only with a yes to texts. Says it's automated, never includes health details, and offers a person and STOP.", render: <Sms /> },
];

const STAFF: { id: string; title: string; why: string; record: Participant }[] = [
  { id: "shared", title: "Shared phone, no voicemail", why: "Texts are allowed but carry no health details; voicemail is blocked, with what to do instead.", record: QUEUE.find((q) => q.contact.first === "Marisol")! },
  { id: "revoked", title: "She turned study matching off later", why: "Her matching answers are deleted, and the record says what to avoid on the call.", record: setChoice(rosaBooked(), "matching", false, `${TODAY}T20:12`) },
  { id: "representative", title: "A representative decides", why: "The record says who filled it in, so the call starts with the right person.", record: QUEUE.find((q) => q.filledBy === "lar")! },
];

export function StatesGallery() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
      <Eyebrow>States and edge cases</Eyebrow>
      <h1 className="display mt-1 text-4xl text-care-dusk">Everything that isn&apos;t the happy path</h1>
      <p className="mt-2 max-w-2xl text-base leading-7">Each example runs the real components with its own record, so what you see here is what ships. Spanish examples are drafts pending native-speaker review.</p>

      <h2 className="display mt-10 text-3xl">On her phone</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {EXAMPLES.map((e) => (
          <figure key={e.id} id={e.id} className="flex min-w-0 flex-col">
            <figcaption className="mb-3">
              <span className="block text-lg font-semibold">{e.title}</span>
              <span className="mt-0.5 block text-base leading-6 text-care-gray_dark">{e.why}</span>
            </figcaption>
            <div className="h-[600px] overflow-y-auto rounded-[28px] border-[8px] border-care-dusk bg-care-background">
              {e.render ?? (
                <Scope.Provider value={`${e.id}-`}>
                  <StoreProvider init={e.init}>
                    <ParticipantFlow framed manageFocus={false} showErrors={e.errors} />
                  </StoreProvider>
                </Scope.Provider>
              )}
            </div>
          </figure>
        ))}
      </div>

      <h2 className="display mt-12 text-3xl">On the coordinator&apos;s screen</h2>
      <div className="mt-4 grid gap-6 xl:grid-cols-3">
        {STAFF.map((s) => (
          <figure key={s.id} id={s.id} className="min-w-0">
            <figcaption className="mb-3">
              <span className="block text-lg font-semibold">{s.title}</span>
              <span className="mt-0.5 block text-base leading-6 text-care-gray_dark">{s.why}</span>
            </figcaption>
            <StoreProvider init={{ queue: [s.record] }}>
              <CoordinatorRecord p={s.record} compact />
            </StoreProvider>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Dialog({ kind }: { kind: "timeout" | "resume" }) {
  const c = COPY.en.states;
  return (
    <div className="relative h-full bg-care-dusk/50 p-5">
      <div role="dialog" aria-modal="false" aria-labelledby={`dlg-${kind}`} className="mt-24 rounded-[20px] bg-white p-5 shadow-sm">
        <h3 id={`dlg-${kind}`} className="display text-2xl">
          {kind === "timeout" ? c.timeoutTitle : c.resumeTitle}
        </h3>
        <p className="mt-2 text-base leading-6">{kind === "timeout" ? c.timeoutBody : c.resumeBody}</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="min-h-12 rounded-full bg-care-ctaDefault px-6 text-lg text-white">
            {kind === "timeout" ? c.keepGoing : c.resume}
          </button>
          <button type="button" className="min-h-12 rounded-full bg-care-gray_light px-6 text-lg text-care-dusk">
            {c.startOver}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sms() {
  return (
    <div lang="es" className="flex h-full flex-col bg-white">
      <div className="border-b border-care-borderColor px-4 py-3 text-center">
        <p className="text-base font-semibold">Care Access</p>
        <p className="text-xs text-care-gray_dark">Mensaje de texto</p>
      </div>
      <div className="flex-1 p-4">
        <p className="max-w-[85%] rounded-[18px] rounded-bl-[4px] bg-care-gray_light px-4 py-3 text-base leading-6">
          Care Access (mensaje automático): Recordatorio de su chequeo gratis el sábado 14 de noviembre a las 9:20 a.m. en Maple Street Community Center. Responda 1 para hablar con una persona. Responda STOP para no recibir más
          textos.
        </p>
        <p lang="en" className="mt-4 flex items-start gap-1.5 rounded-md bg-care-ivory p-3 text-sm leading-5 text-care-gray_dark">
          <Icon name="info" className="mt-0.5 h-3.5 w-3.5 flex-none" />
          Future-state sketch, not built. Sent only with a yes to texts, in her language, with no health details.
        </p>
      </div>
    </div>
  );
}
