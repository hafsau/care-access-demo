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
      <div className="bg-boots px-4 py-3 text-white">
        {framed ? <p className="display text-[19px] leading-snug">{c.formTitle}</p> : <h1 className="display mx-auto max-w-[560px] text-[19px] leading-snug">{c.formTitle}</h1>}
      </div>
      <div className={`px-4 pb-8 pt-6 ${framed ? "" : "mx-auto w-full max-w-[560px]"}`}>
        <div className="flex items-center gap-2 text-cta">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cta text-white">
            <Icon name="check" className="h-5 w-5" />
          </span>
        </div>
        <h2 ref={headingRef} tabIndex={-1} id={`${ns}step-heading`} className="display mt-3 text-[30px] text-dusk sm:text-[34px]">
          {c.done.title}
        </h2>
        <p className="mt-2 text-[18px] leading-7">{c.done.body(fmtSlot(p.slot!, p.lang), `${s.name}, ${s.area}`)}</p>

        <section aria-labelledby={`${ns}next-title`} className="mt-6 rounded-[20px] border border-grace bg-white p-5">
          <h3 id={`${ns}next-title`} className="eyebrow text-[14px] text-boots">
            {c.done.nextTitle}
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            {c.done.next.map((line, i) => (
              <li key={line} className="flex gap-3 text-[16px] leading-6">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ivory text-[14px] font-semibold">{i + 1}</span>
                {line}
              </li>
            ))}
          </ol>
          {p.consent.matching && <p className="mt-4 rounded-[5px] bg-background-light p-3 text-[15px] leading-6">{noMatch ? c.states.noMatchBody : c.done.nextMatching}</p>}
        </section>

        <section aria-labelledby={`${ns}receipt-title`} className="mt-4 rounded-[20px] border border-grace bg-white p-5">
          <h3 id={`${ns}receipt-title`} className="eyebrow text-[14px] text-boots">
            {c.done.receiptTitle}
          </h3>
          <p className="mt-1 text-[14px] text-muted">{c.done.receiptNote(fmtStamp(p.bookedAt!, p.lang))}</p>
          <ul className="mt-3 divide-y divide-line">
            <li className="flex items-center justify-between gap-3 py-3">
              <span className="text-[16px] leading-6">{c.choices.screening.title}</span>
              <span className="flex-none text-[15px] font-medium text-cta">{c.done.on}</span>
            </li>
            {optional.map((ch) => {
              const on = p.consent[ch] === true;
              return (
                <li key={ch} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 text-[16px] leading-6">
                    {c.choices[ch].title}
                    <span className={`ml-2 text-[15px] font-medium ${on ? "text-cta" : "text-muted"}`}>{on ? c.done.on : c.done.off}</span>
                  </span>
                  <button
                    type="button"
                    className="min-h-11 flex-none rounded-full bg-gray-light px-3 text-[15px] text-dusk hover:bg-ivory"
                    onClick={() => dispatch({ type: "revoke", choice: ch, value: !on })}
                    aria-label={`${on ? c.done.turnOff : c.done.turnOn}: ${c.choices[ch].title}`}
                  >
                    {on ? c.done.turnOff : c.done.turnOn}
                  </button>
                </li>
              );
            })}
          </ul>
          <p role="status" className="mt-2 min-h-6 text-[15px] font-medium text-boots">
            {lastChange && lastEvent(p.consentLog, lastChange.choice)?.value === false ? c.done.turnedOff(c.choices[lastChange.choice].title) : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
