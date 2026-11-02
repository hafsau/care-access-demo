"use client";

import { COPY } from "@/lib/copy";
import { lastEvent, type Choice } from "@/lib/consent";
import { fmtSlot, fmtStamp } from "@/lib/format";
import { matches, site } from "@/lib/record";
import { useStore } from "../store";
import { Icon } from "../ui";
import { useScope } from "./fields";

/** Booked: what happens next, and a receipt of her choices she can change. */
export function Done({ framed, headingRef }: { framed: boolean; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const { p, dispatch, lastChange, amendments } = useStore();
  const ns = useScope();
  const c = COPY[p.lang];
  const s = site(p)!;
  const results = matches(p, amendments);
  const noMatch = p.consent.matching && results.length > 0 && results.every((r) => r.status === "notAMatch");
  const optional: Choice[] = ["matching", "texts", "autoVoice", "news"];
  return (
    <div lang={p.lang} className="flex flex-col">
      <div className="bg-care-boots px-4 py-3 text-white">
        {framed ? <p className="display text-xl leading-snug">{c.formTitle}</p> : <h1 className="display mx-auto max-w-[560px] text-xl leading-snug">{c.formTitle}</h1>}
      </div>
      <div className={`px-4 pb-8 pt-6 ${framed ? "" : "mx-auto w-full max-w-[560px]"}`}>
        <div className="flex items-center gap-2 text-care-ctaDefault">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-care-ctaDefault text-white">
            <Icon name="check" className="h-5 w-5" />
          </span>
        </div>
        <h2 ref={headingRef} tabIndex={-1} id={`${ns}step-heading`} className="display mt-3 text-3xl text-care-dusk sm:text-4xl">
          {c.done.title}
        </h2>
        <p className="mt-2 text-lg leading-7">{c.done.body(fmtSlot(p.slot!, p.lang), `${s.name}, ${s.area}`)}</p>

        <section aria-labelledby={`${ns}next-title`} className="mt-6 rounded-[20px] border border-care-grace bg-white p-5">
          <h3 id={`${ns}next-title`} className="eyebrow text-sm text-care-boots">
            {c.done.nextTitle}
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            {c.done.next.map((line, i) => (
              <li key={line} className="flex gap-3 text-base leading-6">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-care-ivory text-sm font-semibold">{i + 1}</span>
                {line}
              </li>
            ))}
          </ol>
          {p.consent.matching && <p className="mt-4 rounded-md bg-care-background_light p-3 text-base leading-6">{noMatch ? c.states.noMatchBody : c.done.nextMatching}</p>}
        </section>

        <section aria-labelledby={`${ns}receipt-title`} className="mt-4 rounded-[20px] border border-care-grace bg-white p-5">
          <h3 id={`${ns}receipt-title`} className="eyebrow text-sm text-care-boots">
            {c.done.receiptTitle}
          </h3>
          <p className="mt-1 text-sm text-care-gray_dark">{c.done.receiptNote(fmtStamp(p.bookedAt!, p.lang))}</p>
          <ul className="mt-3 divide-y divide-care-borderColor">
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-base leading-6">{c.choices.screening.title}</span>
              <span className="flex-none text-base font-medium text-care-ctaDefault">{c.done.on}</span>
            </li>
            {optional.map((ch) => {
              const on = p.consent[ch] === true;
              return (
                <li key={ch} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 text-base leading-6">
                    {c.choices[ch].title}
                    <span className={`ml-2 text-base font-medium ${on ? "text-care-ctaDefault" : "text-care-gray_dark"}`}>{on ? c.done.on : c.done.off}</span>
                  </span>
                  <button
                    type="button"
                    className="min-h-11 flex-none rounded-full bg-care-gray_light px-3 text-base text-care-dusk hover:bg-care-ivory"
                    onClick={() => dispatch({ type: "revoke", choice: ch, value: !on })}
                    aria-label={`${on ? c.done.turnOff : c.done.turnOn}: ${c.choices[ch].title}`}
                  >
                    {on ? c.done.turnOff : c.done.turnOn}
                  </button>
                </li>
              );
            })}
          </ul>
          <p role="status" className="mt-2 min-h-6 text-base font-medium text-care-boots">
            {lastChange && lastEvent(p.consentLog, lastChange.choice)?.value === false ? c.done.turnedOff(c.choices[lastChange.choice].title) : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
