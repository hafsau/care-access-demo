"use client";

/*
 * The demo's single source of state: Rosa's draft on the phone, what's been
 * sent, and the coordinator's queue. Everything renders from this, so the
 * participant and the coordinator can never disagree.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Choice } from "@/lib/consent";
import type { Lang } from "@/lib/rules/engine";
import { steps, type StepId } from "@/lib/flow";
import { CHOICE_ORDER, emptyParticipant, QUEUE, ROSA_INPUT, setChoice, TODAY, type CallAttempt, type Participant } from "@/lib/record";
import type { Tri } from "@/lib/rules/engine";

export type Screen = "intro" | StepId | "done" | "under18" | "noSite";

export type State = {
  p: Participant;
  screen: Screen;
  booked: boolean;
  queue: Participant[];
  amendments: string[];
  minute: number; // demo clock, minutes after 18:40 on TODAY
  lastChange?: { choice: Choice; value: boolean; at: string };
};

type Action =
  | { type: "lang"; lang: Lang }
  | { type: "update"; patch: (p: Participant) => Participant }
  | { type: "choose"; choice: Choice; value: boolean }
  | { type: "go"; screen: Screen }
  | { type: "book" }
  | { type: "revoke"; choice: Choice; value: boolean }
  | { type: "logCall"; id: string; call: Omit<CallAttempt, "at">; changes?: Partial<Record<Choice, boolean>>; confirmed?: Record<string, Tri> }
  | { type: "amend"; id: string; on: boolean }
  | { type: "reset"; lang?: Lang }
  | { type: "load"; state: Partial<State> };

export function now(minute: number) {
  const m = 40 + minute;
  return `${TODAY}T${String(18 + Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function initial(lang: Lang = "en"): State {
  return { p: emptyParticipant(lang), screen: "intro", booked: false, queue: QUEUE, amendments: [], minute: 0 };
}

function reducer(s: State, a: Action): State {
  const tick = s.minute + 1;
  switch (a.type) {
    case "lang":
      return { ...s, p: { ...s.p, lang: a.lang } };
    case "update":
      return { ...s, p: a.patch(s.p) };
    case "choose":
      return { ...s, minute: tick, p: setChoice(s.p, a.choice, a.value, now(tick)) };
    case "go":
      return { ...s, screen: a.screen };
    case "book": {
      // An opt-in left unticked is a no, and is logged as one.
      const base = s.p.consent.news === undefined ? setChoice(s.p, "news", false, now(tick)) : s.p;
      const p = { ...base, id: "CA-24117", bookedAt: now(tick) };
      return { ...s, minute: tick, p, booked: true, screen: "done", queue: [p, ...s.queue.filter((q) => q.id !== p.id)] };
    }
    case "revoke": {
      const p = setChoice(s.p, a.choice, a.value, now(tick));
      return { ...s, minute: tick, p, queue: s.queue.map((q) => (q.id === p.id ? p : q)), lastChange: { choice: a.choice, value: a.value, at: now(tick) } };
    }
    case "logCall": {
      const at = now(tick);
      const apply = (q: Participant): Participant => {
        let next: Participant = { ...q, calls: [...q.calls, { ...a.call, at }], callAnswers: { ...q.callAnswers, ...a.confirmed } };
        if (a.call.disposition === "wrongNumber") next.wrongNumber = true;
        // A choice changed out loud on the call is logged as a staff entry, in the call's language.
        for (const [c, v] of Object.entries(a.changes ?? {}) as [Choice, boolean][]) next = setChoice({ ...next, lang: a.call.lang }, c, v, at, { by: "staff", name: a.call.by });
        return { ...next, lang: q.lang };
      };
      const queue = s.queue.map((q) => (q.id === a.id ? apply(q) : q));
      const p = s.p.id === a.id ? apply(s.p) : s.p;
      return { ...s, minute: tick, queue, p };
    }
    case "amend":
      return { ...s, amendments: a.on ? [...new Set([...s.amendments, a.id])] : s.amendments.filter((x) => x !== a.id) };
    case "reset":
      return { ...initial(a.lang ?? s.p.lang), amendments: s.amendments };
    case "load":
      return { ...s, ...a.state };
  }
}

type Store = State & {
  dispatch: (a: Action) => void;
  stepList: StepId[];
};

const Ctx = createContext<Store | null>(null);

/** One store per provider: the app has one; the states gallery gives each example its own. */
export function StoreProvider({ children, init }: { children: ReactNode; init?: Partial<State> }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...initial(init?.p?.lang), ...init }));
  const stepList = useMemo(() => steps(state.p, state.amendments), [state.p, state.amendments]);
  return <Ctx.Provider value={{ ...state, dispatch, stepList }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/**
 * Rosa's answers for one screen, as the demo's "play" would enter them. Used by
 * the split view's autoplay and by the e2e tests' expectations.
 */
export function rosaFill(screen: Screen, p: Participant, minute: number): { p: Participant; minute: number } {
  let next = p;
  let m = minute;
  switch (screen) {
    case "where":
      next = { ...p, zip: ROSA_INPUT.zip, siteId: ROSA_INPUT.siteId };
      break;
    case "who":
      next = { ...p, filledBy: ROSA_INPUT.filledBy };
      break;
    case "dob":
      next = { ...p, dob: ROSA_INPUT.dob };
      break;
    case "choices":
      for (const c of CHOICE_ORDER) next = setChoice(next, c, ROSA_INPUT.choices[c], now(++m));
      break;
    case "contact":
      next = { ...p, contact: { ...ROSA_INPUT.contact } };
      break;
    case "about":
      next = { ...p, about: { ...ROSA_INPUT.about } };
      break;
    case "time":
      next = { ...p, slot: ROSA_INPUT.slot };
      break;
    default:
      if (typeof screen === "string" && screen.startsWith("health:")) {
        const f = screen.slice(7) as keyof typeof ROSA_INPUT.answers;
        next = { ...p, answers: { ...p.answers, [f]: ROSA_INPUT.answers[f] } };
      }
  }
  return { p: next, minute: m };
}
