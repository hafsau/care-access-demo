"use client";

/*
 * Rosa's side: the pre-screen, one question or one decision per screen.
 * Mobile first; the same component runs full-page on /prescreen and inside
 * the phone frame on the split view.
 */
import { useEffect, useRef, useState } from "react";
import { COPY, SPANISH_REVIEW, type Copy } from "@/lib/copy";
import { problems, studiesNeeding, under18, validDob, type Problem, type StepId } from "@/lib/flow";
import { fmtDay, fmtDob, fmtSlot, fmtTime, pick } from "@/lib/format";
import { sitesNear, site as siteOf, type Participant } from "@/lib/record";
import type { MatchField } from "@/lib/rules/engine";
import { useStore, type Screen } from "../store";
import { btn, Icon } from "../ui";
import { ConsentStep } from "./consent";
import { Done } from "./done";
import { ErrorSummary, OptionList, TextField, useScope, YesNo } from "./fields";

export function ParticipantFlow({ framed = false, manageFocus = true, showErrors = false }: { framed?: boolean; manageFocus?: boolean; showErrors?: boolean }) {
  const { p, screen, stepList, dispatch, booked } = useStore();
  const c = COPY[p.lang];
  // The states gallery can open a screen with its errors already showing.
  const [shown, setShown] = useState<Problem[]>(() => (showErrors ? problems(screen as StepId, p) : []));
  const heading = useRef<HTMLHeadingElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const prevScreen = useRef(screen);
  const [focusSummary, setFocusSummary] = useState(0);
  useEffect(() => {
    if (focusSummary) summary.current?.focus();
  }, [focusSummary]);

  // Move focus to the new screen's heading, so screen readers start at the top. Not on first load.
  useEffect(() => {
    if (prevScreen.current === screen) return;
    prevScreen.current = screen;
    setShown([]);
    if (manageFocus) heading.current?.focus({ preventScroll: framed });
    if (!framed) window.scrollTo({ top: 0 });
  }, [screen, framed, manageFocus]);

  const index = stepList.indexOf(screen as StepId);
  const update = (patch: (p: Participant) => Participant) => {
    dispatch({ type: "update", patch });
    if (shown.length) setShown([]);
  };

  function next() {
    if (screen === "intro") return dispatch({ type: "go", screen: "where" });
    if (screen === "review") return dispatch({ type: "book" });
    const found = problems(screen as StepId, p);
    if (found.length) {
      setShown(found);
      setFocusSummary((n) => n + 1);
      return;
    }
    if (screen === "dob" && under18(p)) return dispatch({ type: "go", screen: "under18" });
    dispatch({ type: "go", screen: stepList[index + 1] ?? "review" });
  }

  function back() {
    if (screen === "under18") return dispatch({ type: "go", screen: "dob" });
    dispatch({ type: "go", screen: index > 0 ? stepList[index - 1] : "intro" });
  }

  const errorFor = (field: string) => {
    const pr = shown.find((x) => x.field === field);
    return pr ? pick(c, pr.key) : undefined;
  };

  if (screen === "done" && booked) return <Done framed={framed} headingRef={heading} />;

  const stepNo = index >= 0 ? index + 1 : 0;
  return (
    <div lang={p.lang} className={`flex flex-col ${framed ? "min-h-full" : ""}`}>
      {/* Their form's title band: boots, white serif. */}
      <div className="bg-boots px-4 py-3 text-white">
        {framed ? <p className="display text-[19px] leading-snug">{c.formTitle}</p> : <h1 className="display mx-auto max-w-[560px] text-[19px] leading-snug">{c.formTitle}</h1>}
      </div>
      <div className={`flex min-h-12 items-center justify-between gap-2 px-4 py-2 ${framed ? "" : "mx-auto w-full max-w-[592px]"}`}>
        {screen !== "intro" ? (
          <button type="button" onClick={back} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] text-dusk hover:bg-gray-light">
            <Icon name="back" className="h-4 w-4" />
            {c.back}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: "lang", lang: p.lang === "en" ? "es" : "en" })}
          lang={p.lang === "en" ? "es" : "en"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gray-light px-3 text-[15px] text-dusk hover:bg-ivory"
        >
          <Icon name="globe" className="h-4 w-4" />
          {c.switchLang}
        </button>
      </div>

      {p.lang === "es" && !SPANISH_REVIEW.reviewed && (
        <p lang="en" className="bg-ivory px-4 py-1.5 text-[12px] text-muted">
          Spanish drafted for this concept; native-speaker review pending.
        </p>
      )}

      <div className={`flex-1 px-4 pb-6 pt-5 ${framed ? "" : "mx-auto w-full max-w-[560px]"}`}>
        {stepNo > 0 && <Progress label={c.step(stepNo, stepList.length)} value={stepNo / stepList.length} />}
        <ErrorSummary title={c.errorTitle} summaryRef={summary} items={shown.map((x) => ({ field: x.field, text: pick(c, x.key) }))} />
        <div key={String(screen)} className="rise">
          <ScreenBody screen={screen} c={c} p={p} update={update} errorFor={errorFor} heading={heading} />
        </div>
        {screen !== "under18" && !(screen === "where" && /^\d{5}$/.test(p.zip) && sitesNear(p.zip).length === 0) && (
          <div className="mt-6">
            <button type="button" onClick={next} className={`${btn("primary")} w-full`}>
              {screen === "intro" ? c.intro.start : screen === "review" ? c.review.book : c.next}
            </button>
            {screen === "review" && <p className="mt-2 text-center text-[14px] text-muted">{c.review.sendsNote}</p>}
          </div>
        )}
        {screen !== "review" && screen !== "under18" && (
          <p className="mt-4 flex items-start gap-1.5 text-[13px] leading-5 text-muted">
            <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {c.savedOnPhone}
          </p>
        )}
      </div>
    </div>
  );
}

/** Their 24px ivory progress track with a heart on the fill's end, plus the step in words. */
function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-5">
      <div className="relative h-6 w-full rounded-full bg-ivory-300" aria-hidden="true">
        <div className="flex h-6 items-center justify-end rounded-full bg-boots pr-1 transition-[width] duration-300" style={{ width: `max(${Math.round(value * 100)}%, 2.25rem)` }}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </div>
      </div>
      <p className="mt-2 text-[14px] font-medium text-boots">{label}</p>
    </div>
  );
}

function H({ heading, children }: { heading: React.RefObject<HTMLHeadingElement | null>; children: React.ReactNode }) {
  const ns = useScope();
  return (
    <h2 ref={heading} tabIndex={-1} id={`${ns}step-heading`} className="display text-[30px] text-dusk sm:text-[34px]">
      {children}
    </h2>
  );
}

function ScreenBody({
  screen,
  c,
  p,
  update,
  errorFor,
  heading,
}: {
  screen: Screen;
  c: Copy;
  p: Participant;
  update: (f: (p: Participant) => Participant) => void;
  errorFor: (field: string) => string | undefined;
  heading: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { amendments, stepList } = useStore();
  switch (screen) {
    case "intro":
      return (
        <>
          <H heading={heading}>{c.intro.title}</H>
          <p className="mt-3 text-[17px] leading-7">{c.intro.body}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-grace-light px-3 py-1 text-[14px] font-medium">
            <Icon name="clock" className="h-4 w-4" />
            {c.intro.time}
          </p>
        </>
      );

    case "where":
      return <Where c={c} p={p} update={update} errorFor={errorFor} heading={heading} />;

    case "who":
      return (
        <>
          <H heading={heading}>{c.who.title}</H>
          <div className="mt-4">
            <OptionList
              name="filledBy"
              labelledBy="step-heading"
              options={[
                { value: "self", label: c.who.self },
                { value: "other", label: c.who.someoneElse },
              ]}
              value={p.filledBy === undefined ? undefined : p.filledBy === "self" ? "self" : "other"}
              onChange={(v) => update((x) => ({ ...x, filledBy: v === "self" ? "self" : x.filledBy && x.filledBy !== "self" ? x.filledBy : "helper" }))}
              error={errorFor("filledBy")}
            />
          </div>
          {p.filledBy && p.filledBy !== "self" && (
            <div className="mt-6">
              <OptionList
                name="helperRole"
                legend={c.who.roleTitle}
                options={[
                  { value: "helper", label: c.who.helping, hint: c.who.helpingHint },
                  { value: "lar", label: c.who.lar, hint: c.who.larHint },
                ]}
                value={p.filledBy}
                onChange={(v) => update((x) => ({ ...x, filledBy: v as "helper" | "lar" }))}
              />
              <p className="mt-4 flex gap-2 rounded-[14px] bg-ivory p-4 text-[15px] leading-6">
                <Icon name="info" className="mt-0.5 h-5 w-5 flex-none" />
                {p.filledBy === "lar" ? c.who.larNote : c.who.helpingNote}
              </p>
            </div>
          )}
        </>
      );

    case "dob":
      return <Dob c={c} p={p} update={update} errorFor={errorFor} heading={heading} />;

    case "under18":
      return (
        <>
          <H heading={heading}>{c.dob.under18Title}</H>
          <p className="mt-3 text-[17px] leading-7">{c.dob.under18Body}</p>
        </>
      );

    case "choices":
      return <ConsentStep c={c} p={p} errorFor={errorFor} heading={heading} />;

    case "contact":
      return (
        <>
          <H heading={heading}>{c.contact.title}</H>
          <div className="mt-5 flex flex-col gap-5">
            <TextField id="first" label={c.contact.first} autoComplete="given-name" value={p.contact.first} onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, first: v } }))} error={errorFor("first")} />
            <TextField id="middle" label={c.contact.middle} optional={c.optional} autoComplete="additional-name" value={p.contact.middle} onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, middle: v } }))} />
            <TextField id="last" label={c.contact.last} autoComplete="family-name" value={p.contact.last} onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, last: v } }))} />
            <TextField
              id="phone"
              label={c.contact.phone}
              hint={c.contact.phoneHint}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={p.contact.phone}
              onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, phone: v } }))}
              error={errorFor("phone")}
            />
            <YesNo name="shared" legend={c.contact.shared} hint={c.contact.sharedHint} yes={c.yes} no={c.no} value={p.contact.sharedPhone} onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, sharedPhone: v } }))} error={errorFor("shared")} />
            <YesNo name="voicemail" legend={c.contact.voicemail} hint={c.contact.voicemailHint} yes={c.yes} no={c.no} value={p.contact.voicemail} onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, voicemail: v } }))} error={errorFor("voicemail")} />
            <OptionList
              name="bestTime"
              legend={c.contact.bestTime}
              options={(["morning", "afternoon", "evening"] as const).map((t) => ({ value: t, label: c.contact.times[t] }))}
              value={p.contact.bestTime}
              onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, bestTime: v as "morning" } }))}
              error={errorFor("bestTime")}
            />
            <div>
              <TextField
                id="email"
                label={c.contact.email}
                optional={c.optional}
                type="email"
                autoComplete="email"
                disabled={p.contact.noEmail}
                value={p.contact.email}
                onChange={(v) => update((x) => ({ ...x, contact: { ...x.contact, email: v } }))}
              />
              <label className="mt-2 flex min-h-11 items-center gap-3 text-[16px]">
                <input type="checkbox" className="h-5 w-5 accent-[var(--care-dusk)]" checked={p.contact.noEmail} onChange={(e) => update((x) => ({ ...x, contact: { ...x.contact, noEmail: e.target.checked, email: e.target.checked ? "" : x.contact.email } }))} />
                {c.contact.noEmail}
              </label>
            </div>
          </div>
        </>
      );

    case "about":
      return (
        <>
          <H heading={heading}>{c.about.title}</H>
          <p className="mt-3 rounded-[14px] bg-ivory p-4 text-[15px] leading-6">{c.about.why}</p>
          <div className="mt-5 flex flex-col gap-6">
            <OptionList
              name="race"
              legend={c.about.race}
              hint={c.about.raceHint}
              multiple
              exclusive={["preferNot"]}
              options={(Object.keys(c.about.races) as (keyof Copy["about"]["races"])[]).map((k) => ({ value: k, label: c.about.races[k] }))}
              value={p.about.race}
              onChange={(v) => update((x) => ({ ...x, about: { ...x.about, race: v as string[] } }))}
              error={errorFor("race")}
            />
            <OptionList
              name="sex"
              legend={c.about.sex}
              hint={c.about.sexWhy}
              options={(Object.keys(c.about.sexes) as (keyof Copy["about"]["sexes"])[]).map((k) => ({ value: k, label: c.about.sexes[k] }))}
              value={p.about.sex}
              onChange={(v) => update((x) => ({ ...x, about: { ...x.about, sex: v as string } }))}
              error={errorFor("sex")}
            />
          </div>
        </>
      );

    case "time": {
      const s = siteOf(p)!;
      const days = [...new Set(s.slots.map((x) => x.slice(0, 10)))];
      return (
        <>
          <H heading={heading}>{c.time.title}</H>
          <p className="mt-2 text-[16px] text-muted">{c.time.at(s.name)}</p>
          <div className="mt-4 flex flex-col gap-6">
            {days.map((d) => (
              <OptionList
                key={d}
                name={d === days[0] ? "slot" : `slot-${d}`}
                legend={fmtDay(`${d}T00:00`, p.lang)}
                options={s.slots.filter((x) => x.startsWith(d)).map((x) => ({ value: x, label: fmtTime(x, p.lang) }))}
                value={p.slot?.startsWith(d) ? p.slot : undefined}
                onChange={(v) => update((x) => ({ ...x, slot: v as string }))}
                error={d === days[0] ? errorFor("slot") : undefined}
              />
            ))}
          </div>
        </>
      );
    }

    case "review":
      return <Review c={c} p={p} heading={heading} />;

    default: {
      if (typeof screen === "string" && screen.startsWith("health:")) {
        const f = screen.slice(7) as MatchField;
        return <Health field={f} c={c} p={p} update={update} errorFor={errorFor} heading={heading} n={studiesNeeding(p, f, amendments)} first={stepList.find((s) => s.startsWith("health:")) === screen} />;
      }
      return null;
    }
  }
}

function Where({ c, p, update, errorFor, heading }: { c: Copy; p: Participant; update: (f: (p: Participant) => Participant) => void; errorFor: (f: string) => string | undefined; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const [notify, setNotify] = useState<"idle" | "form" | "done">("idle");
  const [phone, setPhone] = useState("");
  const zipOk = /^\d{5}$/.test(p.zip);
  const near = zipOk ? sitesNear(p.zip) : [];
  return (
    <>
      <H heading={heading}>{c.where.title}</H>
      <div className="mt-4 max-w-[220px]">
        <TextField
          id="zip"
          label={c.where.zip}
          hint={c.where.zipHint}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={p.zip}
          onChange={(v) => update((x) => ({ ...x, zip: v.replace(/\D/g, "").slice(0, 5), siteId: undefined }))}
          error={errorFor("zip")}
        />
      </div>
      {zipOk && near.length > 0 && (
        <div className="mt-6">
          <OptionList
            name="site"
            legend={c.where.sitesTitle}
            options={near.map((s) => ({
              value: s.id,
              label: s.name,
              hint: `${s.area} · ${c.where.miles(s.miles)}${s.spanishStaff ? ` · ${c.where.spanishStaff}` : ""}`,
            }))}
            value={p.siteId}
            onChange={(v) => update((x) => ({ ...x, siteId: v as string, slot: undefined }))}
            error={errorFor("site")}
          />
        </div>
      )}
      {zipOk && near.length === 0 && (
        <div className="mt-6 rounded-[16px] bg-ivory p-4" role="status">
          <h3 className="text-[18px] font-semibold">{c.where.noneTitle}</h3>
          <p className="mt-1 text-[16px] leading-6">{c.where.noneBody}</p>
          {notify === "idle" && (
            <button type="button" className={`${btn("outline", "sm")} mt-3`} onClick={() => setNotify("form")}>
              {c.where.noneAction}
            </button>
          )}
          {notify === "form" && (
            <div className="mt-3 flex flex-col gap-3">
              <TextField id="notify-phone" label={c.contact.phone} type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={setPhone} />
              <button type="button" className={btn("primary", "sm")} disabled={phone.replace(/\D/g, "").length !== 10} onClick={() => setNotify("done")}>
                {c.where.noneAction}
              </button>
            </div>
          )}
          {notify === "done" && <p className="mt-3 text-[15px] font-medium">{c.where.noneDone}</p>}
        </div>
      )}
    </>
  );
}

function Dob({ c, p, update, errorFor, heading }: { c: Copy; p: Participant; update: (f: (p: Participant) => Participant) => void; errorFor: (f: string) => string | undefined; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const [parts, setParts] = useState(() => {
    const m = p.dob ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.dob) : null;
    return m ? { month: String(+m[2]), day: String(+m[3]), year: m[1] } : { month: "", day: "", year: "" };
  });
  const set = (k: keyof typeof parts, v: string) => {
    const nextParts = { ...parts, [k]: v.replace(/\D/g, "").slice(0, k === "year" ? 4 : 2) };
    setParts(nextParts);
    const iso = `${nextParts.year.padStart(4, "0")}-${nextParts.month.padStart(2, "0")}-${nextParts.day.padStart(2, "0")}`;
    update((x) => ({ ...x, dob: validDob(iso) ? iso : nextParts.year || nextParts.month || nextParts.day ? "invalid" : undefined }));
  };
  const error = errorFor("dob-month");
  const ns = useScope();
  return (
    <>
      <H heading={heading}>{p.filledBy === "self" ? c.dob.titleSelf : c.dob.title}</H>
      <fieldset className="mt-4" aria-labelledby={`${ns}step-heading`} aria-describedby={`${ns}dob-hint${error ? ` ${ns}dob-error` : ""}`}>
        <p id={`${ns}dob-hint`} className="text-[15px] text-muted">
          {c.dob.hint}
        </p>
        {error && (
          <p id={`${ns}dob-error`} className="mt-1.5 flex items-start gap-1.5 text-[15px] font-semibold text-danger">
            <Icon name="alert" className="mt-0.5 h-4 w-4 flex-none" />
            {error}
          </p>
        )}
        <div className="mt-2 flex gap-3">
          {(["month", "day", "year"] as const).map((k) => (
            <div key={k} className={k === "year" ? "w-28" : "w-20"}>
              <label htmlFor={`${ns}dob-${k}`} className="block text-[15px] font-semibold">
                {c.dob[k]}
              </label>
              <input
                id={`${ns}dob-${k}`}
                inputMode="numeric"
                autoComplete={k === "month" ? "bday-month" : k === "day" ? "bday-day" : "bday-year"}
                value={parts[k]}
                onChange={(e) => set(k, e.target.value)}
                aria-invalid={error ? true : undefined}
                className={`mt-1 block min-h-12 w-full rounded border bg-white p-3 text-[18px] leading-[1.2] ${error ? "border-2 border-danger" : "border-control"}`}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function Health({
  field,
  c,
  p,
  update,
  errorFor,
  heading,
  n,
  first,
}: {
  field: MatchField;
  c: Copy;
  p: Participant;
  update: (f: (p: Participant) => Participant) => void;
  errorFor: (f: string) => string | undefined;
  heading: React.RefObject<HTMLHeadingElement | null>;
  n: number;
  first: boolean;
}) {
  const set = (v: string | string[]) => update((x) => ({ ...x, answers: { ...x.answers, [field]: v } }));
  const why = n > 0 ? c.health.why(n) : undefined;
  const value = p.answers[field as keyof Participant["answers"]] as string | string[] | undefined;
  const intro = first ? <p className="mb-4 rounded-[14px] bg-ivory p-4 text-[15px] leading-6">{c.health.intro}</p> : null;
  if (field === "heart" || field === "kidney") {
    const opts = c.health[field].options as Record<string, string>;
    return (
      <>
        {intro}
        <H heading={heading}>{c.health[field].title}</H>
        <div className="mt-4">
          <OptionList
            name={field}
            labelledBy="step-heading"
            hint={`${c.health.selectAll}. ${why ?? ""}`}
            multiple
            exclusive={["none", "unsure"]}
            options={[...Object.entries(opts).map(([value, label]) => ({ value, label })), { value: "none", label: c.noneOfThese }, { value: "unsure", label: c.notSure }]}
            value={value}
            onChange={set}
            error={errorFor(field)}
          />
        </div>
      </>
    );
  }
  const options =
    field === "smoking"
      ? [...Object.entries(c.health.smoking.options).map(([value, label]) => ({ value, label })), { value: "unsure", label: c.notSure }]
      : [
          { value: "yes", label: c.yes },
          { value: "no", label: c.no },
          { value: "unsure", label: c.notSure },
        ];
  const q = field === "smoking" ? c.health.smoking : c.health.cancer5y;
  return (
    <>
      {intro}
      <H heading={heading}>{q.title}</H>
      <div className="mt-4">
        <OptionList
          name={field}
          labelledBy="step-heading"
          hint={[("hint" in q ? q.hint : ""), why].filter(Boolean).join(" ")}
          options={options}
          value={value}
          onChange={set}
          error={errorFor(field)}
        />
      </div>
    </>
  );
}

function Review({ c, p, heading }: { c: Copy; p: Participant; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const { dispatch, stepList } = useStore();
  const s = siteOf(p);
  const health = stepList.filter((x) => x.startsWith("health:"));
  const label = (f: string, v: unknown) => {
    const opts: Record<string, string> = {
      ...(f === "heart" ? c.health.heart.options : f === "kidney" ? c.health.kidney.options : f === "smoking" ? c.health.smoking.options : {}),
      none: c.noneOfThese,
      unsure: c.notSure,
      yes: c.yes,
      no: c.no,
    };
    return (Array.isArray(v) ? v : [v]).map((x) => opts[String(x)] ?? String(x)).join(", ");
  };
  const rows: { k: string; v: string; go: Screen }[] = [
    { k: c.review.site, v: s ? `${s.name}, ${s.area}` : "", go: "where" },
    { k: c.review.when, v: p.slot ? fmtSlot(p.slot, p.lang) : "", go: "time" },
    { k: c.review.who, v: p.filledBy === "self" ? c.who.self : p.filledBy === "lar" ? c.who.lar : c.who.helping, go: "who" },
    { k: c.review.dob, v: p.dob && validDob(p.dob) ? fmtDob(p.dob, p.lang) : "", go: "dob" },
    {
      k: c.review.choices,
      v: (["screening", "matching", "texts", "autoVoice", "news"] as const)
        .map((ch) => `${c.choices[ch].title}: ${p.consent[ch] ? c.yes : c.no}`)
        .join("\n"),
      go: "choices",
    },
    ...(health.length
      ? health.map((h) => {
          const f = h.slice(7);
          const q = f === "heart" || f === "kidney" ? c.health[f].title : f === "smoking" ? c.health.smoking.title : c.health.cancer5y.title;
          return { k: q, v: label(f, p.answers[f as keyof Participant["answers"]]), go: h as Screen };
        })
      : [{ k: c.review.health, v: c.review.skipped, go: "choices" as Screen }]),
    { k: c.review.contact, v: [`${p.contact.first} ${p.contact.middle} ${p.contact.last}`.replace(/\s+/g, " ").trim(), p.contact.phone, p.contact.noEmail ? c.contact.noEmail : p.contact.email].filter(Boolean).join("\n"), go: "contact" },
    { k: c.review.about, v: [label("race", p.about.race.map((r) => c.about.races[r as keyof Copy["about"]["races"]] ?? r)), p.about.sex ? c.about.sexes[p.about.sex as keyof Copy["about"]["sexes"]] : ""].filter(Boolean).join("\n"), go: "about" },
  ];
  return (
    <>
      <H heading={heading}>{c.review.title}</H>
      <dl className="mt-4 divide-y divide-line rounded-[16px] border border-line bg-white">
        {rows.map((r) => (
          <div key={r.k} className="px-4 py-3">
            <dt className="text-[14px] font-medium text-muted">{r.k}</dt>
            <dd className="mt-0.5 flex items-start justify-between gap-3">
              <span className="min-w-0 whitespace-pre-line text-[16px] leading-6">{r.v}</span>
              <button type="button" className="-mt-2 min-h-11 flex-none rounded-full px-2 text-[15px] text-cta underline underline-offset-4" onClick={() => dispatch({ type: "go", screen: r.go })}>
                {c.change}
                <span className="sr-only">: {r.k}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
