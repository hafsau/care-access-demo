"use client";

import type { Copy } from "@/lib/copy";
import type { Choice } from "@/lib/consent";
import type { Participant } from "@/lib/record";
import { useStore } from "../store";
import { Chip, Icon } from "../ui";
import { FieldError, OptionList, useScope } from "./fields";

/**
 * One card per choice, in the site's card style. Nothing is pre-selected:
 * screening is a single "yes" checkbox because it's the only one needed to
 * book; matching, texts and automated calls are an explicit yes or no; news
 * stays the optional opt-in it is today.
 */
export function ConsentStep({ c, p, errorFor, heading }: { c: Copy; p: Participant; errorFor: (f: string) => string | undefined; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const { dispatch } = useStore();
  const ns = useScope();
  const choose = (choice: Choice, value: boolean) => dispatch({ type: "choose", choice, value });
  return (
    <>
      <h2 ref={heading} tabIndex={-1} id={`${ns}step-heading`} className="display text-3xl text-care-dusk sm:text-4xl">
        {c.choices.title}
      </h2>
      <p className="mt-3 text-lg leading-7">{c.choices.intro}</p>
      <p lang="en" className="mt-3 flex items-start gap-1.5 rounded-md bg-care-ivory px-3 py-2 text-sm leading-5 text-care-gray_dark">
        <Icon name="info" className="mt-0.5 h-3.5 w-3.5 flex-none" />
        Wording proposed for this concept, pending legal and regulatory review. Not study informed consent.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <ChoiceCard c={c} choice="screening" required>
          {errorFor("choice-screening") && <FieldError id={`${ns}choice-screening-error`}>{errorFor("choice-screening")}</FieldError>}
          <label className={`mt-3 flex min-h-12 cursor-pointer items-baseline gap-3 rounded px-2 py-[10px] text-care-boots hover:bg-care-gray_light ${p.consent.screening ? "bg-care-grace_light" : ""}`}>
            <input
              id={`${ns}choice-screening`}
              type="checkbox"
              checked={p.consent.screening === true}
              onChange={(e) => choose("screening", e.target.checked)}
              aria-describedby={`${ns}choice-screening-summary${errorFor("choice-screening") ? ` ${ns}choice-screening-error` : ""}`}
              aria-invalid={errorFor("choice-screening") ? true : undefined}
              className="h-5 w-5 flex-none translate-y-[3px] accent-care-dusk"
            />
            <span className="text-lg leading-[1.35]">{c.choices.screening.on}</span>
          </label>
        </ChoiceCard>

        {(["matching", "texts", "autoVoice"] as const).map((ch) => (
          <ChoiceCard key={ch} c={c} choice={ch}>
            <OptionList
              name={`choice-${ch}`}
              labelledBy={`choice-${ch}-title`}
              options={[
                { value: "yes", label: c.choices[ch].on },
                { value: "no", label: c.choices[ch].off },
              ]}
              value={p.consent[ch] === undefined ? undefined : p.consent[ch] ? "yes" : "no"}
              onChange={(v) => choose(ch, v === "yes")}
              error={errorFor(`choice-${ch}`)}
            />
          </ChoiceCard>
        ))}

        <ChoiceCard c={c} choice="news">
          <label className={`mt-3 flex min-h-12 cursor-pointer items-baseline gap-3 rounded px-2 py-[10px] text-care-boots hover:bg-care-gray_light ${p.consent.news ? "bg-care-grace_light" : ""}`}>
            <input type="checkbox" checked={p.consent.news === true} onChange={(e) => choose("news", e.target.checked)} className="h-5 w-5 flex-none translate-y-[3px] accent-care-dusk" />
            <span className="text-lg leading-[1.35]">
              {c.choices.news.on} <span className="text-base text-care-gray_dark">({c.optional})</span>
            </span>
          </label>
        </ChoiceCard>
      </div>
      <p className="mt-4 text-base leading-6 text-care-gray_dark">{c.choices.changeAnyTime}</p>
    </>
  );
}

function ChoiceCard({ c, choice, required = false, children }: { c: Copy; choice: Choice; required?: boolean; children: React.ReactNode }) {
  const t = c.choices[choice];
  const ns = useScope();
  return (
    <section aria-labelledby={`${ns}choice-${choice}-title`} className="rounded-[20px] border border-care-grace bg-white p-5">
      <Chip className={required ? "bg-care-grace" : "bg-care-ivory"}>{required ? c.choices.required : c.choices.yourChoice}</Chip>
      <h3 id={`${ns}choice-${choice}-title`} className="display mt-2 text-xl text-care-dusk">
        {t.title}
      </h3>
      <p id={`${ns}choice-${choice}-summary`} className="mt-1.5 text-base leading-6">
        {t.summary}
      </p>
      <details className="group mt-2">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-base text-care-boots underline underline-offset-4">
          <Icon name="doc" className="h-4 w-4" />
          {c.choices.readFull}
        </summary>
        <p className="mt-1 rounded-md bg-care-background_light p-3 text-sm leading-6">{t.full}</p>
      </details>
      {children}
    </section>
  );
}
