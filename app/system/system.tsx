"use client";

import { useState, type ReactNode } from "react";
import { ErrorSummary, OptionList, TextField } from "@/components/participant/fields";
import { CoordinatorRecord } from "@/components/coordinator/record";
import { StoreProvider, useStore } from "@/components/store";
import { btn, Card, Chip, Eyebrow, Icon, TriBadge } from "@/components/ui";
import { NEEDS, STAFF_ACTIONS } from "@/lib/consent";
import { steps } from "@/lib/flow";
import { emptyParticipant, matchAnswers, rosaBooked, setChoice, TODAY } from "@/lib/record";
import { evaluateStudy, generatedCases, STUDIES } from "@/lib/rules/engine";
import { ACTION_LABEL, answerLabel, CHOICE_LABEL, RESOLVED_LABEL } from "@/lib/staff";

const TOKENS: { name: string; hex: string; use: string; contrast: string; note?: string; added?: boolean }[] = [
  { name: "care-dusk", hex: "#0F3D42", use: "Text, headings, native control accent", contrast: "11.2:1 on background" },
  { name: "care-boots", hex: "#19686B", use: "Form title band, progress fill, option text, section labels", contrast: "6.1:1 on background" },
  { name: "care-ctaDefault", hex: "#0D715E", use: "Primary pill buttons, \"met\"", contrast: "white text 5.9:1" },
  { name: "care-sunset", hex: "#B54500", use: "Eyebrows, focus ring", contrast: "5.2:1 on background" },
  { name: "care-sunrise", hex: "#F75C2E", use: "Not used for text", contrast: "3.0:1 on background", note: "Decoration only: under 4.5:1 for text." },
  { name: "care-motion", hex: "#009991", use: "Not used for text", contrast: "3.3:1 on background", note: "Indicators only." },
  { name: "care-grace", hex: "#ABC9BA", use: "Card borders, chips", contrast: "decorative" },
  { name: "care-grace_light", hex: "#E6F8EF", use: "Selected option row, allowed action", contrast: "background" },
  { name: "care-ivory", hex: "#F1EDE2", use: "Notes, \"not known yet\"", contrast: "background" },
  { name: "ivory-300", hex: "#F2EDE0", use: "Progress track", contrast: "background" },
  { name: "care-background", hex: "#FBF8F4", use: "Page", contrast: "background" },
  { name: "care-gray_light", hex: "#F3F4F6", use: "Secondary pill, option hover", contrast: "background" },
  { name: "care-gray_dark", hex: "#5F6577", use: "Hints and secondary text", contrast: "5.5:1 on background" },
  { name: "care-borderColor", hex: "#E2E8F0", use: "Dividers only", contrast: "1.2:1", note: "Too faint for a control's edge (WCAG 1.4.11)." },
  { name: "control", hex: "#7A8A86", use: "Input and control borders", contrast: "3.4:1 on background", added: true, note: "Added so inputs meet 3:1." },
  { name: "not / not-bg", hex: "#9A3A00", use: "\"Not met\", blocked actions", contrast: "6.1:1 on its tint", added: true },
  { name: "danger", hex: "#B3261E", use: "Errors", contrast: "5.6:1 on its tint", added: true },
];

export function SystemPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
      <Eyebrow>System</Eyebrow>
      <h1 className="display mt-1 text-[36px] text-dusk">Built on Care Access&apos;s own design system</h1>
      <p className="mt-2 max-w-3xl text-[16px] leading-7">
        Tokens by their own names, read from the screening site&apos;s CSS on {TODAY}. Components follow the live form: serif question headings, the ivory progress track, plain option rows with native controls, 48px inputs with 4px corners, white
        cards with a grace border, pill buttons. Where a token fails WCAG 2.2 AA for a job, the adaptation is listed.
      </p>

      <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-2 text-[15px]">
        {[
          ["tokens", "Tokens"],
          ["type", "Type"],
          ["components", "Components"],
          ["rules", "Rules table"],
          ["consent", "Consent gates"],
          ["build", "How it's built"],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="flex min-h-11 items-center rounded-full bg-gray-light px-4 hover:bg-ivory">
            {label}
          </a>
        ))}
      </nav>

      <Section id="tokens" title="Tokens">
        <div className="overflow-x-auto rounded-[20px] border border-grace bg-white" role="region" aria-label="Token table" tabIndex={0}>
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead className="bg-background-light text-[14px]">
              <tr>
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Used for</th>
                <th className="px-4 py-3 font-medium">Contrast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {TOKENS.map((t) => (
                <tr key={t.name}>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="h-6 w-6 flex-none rounded border border-line" style={{ background: t.hex }} aria-hidden="true" />
                      <code className="text-[14px]">{t.name}</code>
                      {t.added && <Chip className="bg-ivory text-[12px]">added</Chip>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[14px]">{t.hex}</td>
                  <td className="px-4 py-2.5">{t.use}</td>
                  <td className="px-4 py-2.5">
                    {t.contrast}
                    {t.note && <span className="block text-[13px] text-muted">{t.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="type" title="Type">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p className="display text-[34px] text-dusk">What is your date of birth?</p>
            <p className="mt-2 text-[14px] text-muted">IBM Plex Serif 400, 30–34px. Question headings, as on the live form (which uses licensed Pensum Pro).</p>
          </Card>
          <Card className="p-6">
            <p className="text-[18px] leading-7">We compare your answers with studies near you. You can still get your screening if you say no.</p>
            <p className="eyebrow mt-3 text-[14px] text-boots">Your choices</p>
            <p className="mt-2 text-[14px] text-muted">IBM Plex Sans 400/500. Body 16–18px; section labels 14px uppercase, 0.05em.</p>
          </Card>
        </div>
      </Section>

      <Section id="components" title="Components">
        <div className="grid gap-4 lg:grid-cols-2">
          <Spec name="Option row" notes={["Native radio or checkbox in dusk, label in boots 18px.", "Whole row is the target, at least 48px tall.", "Exclusive answers (None, Not sure, Prefer not to say) sit below a divider and clear the others.", "Errors: a 4px danger rule plus a message tied by aria-describedby."]}>
            <Demo />
          </Spec>
          <Spec name="Text field" notes={["48px tall, 4px corners, 18px text.", "Border uses the added control token, 3.4:1.", "Error state: 2px danger border, message above the field, aria-invalid."]}>
            <div className="flex flex-col gap-4">
              <TextField id="sys-phone" label="Phone number" hint="We'll call this number with your results." value="(323) 555-0148" onChange={() => {}} />
              <TextField id="sys-name" label="First name" value="" onChange={() => {}} error="Enter a first and last name" />
            </div>
          </Spec>
          <Spec name="Error summary" notes={["Appears on Continue, takes focus, role=alert.", "Each item links to and focuses its field."]}>
            <ErrorSummary title="Check this before you continue" summaryRef={{ current: null }} items={[{ field: "sys-name", text: "Enter a first and last name" }, { field: "sys-phone", text: "Text messages: choose yes or no" }]} />
          </Spec>
          <Spec name="Met / not met / not known yet" notes={["Shape and words carry the meaning; color only reinforces it.", "\"Not known yet\" is dashed: it's a gap, not a no."]}>
            <div className="flex flex-wrap gap-2">
              <TriBadge result="met" />
              <TriBadge result="notMet" />
              <TriBadge result="unknown" />
            </div>
          </Spec>
          <Spec name="Progress" notes={["The live form's 24px ivory track with a heart on the fill.", "The step is also written out (\"Step 4 of 9\"); the bar is aria-hidden.", "Steps can grow when a matching question applies; that's said, not hidden."]}>
            <div className="h-6 w-full rounded-full bg-ivory-300">
              <div className="flex h-6 w-1/2 items-center justify-end rounded-full bg-boots pr-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-[14px] font-medium text-boots">Step 4 of 9</p>
          </Spec>
          <Spec name="Buttons and chips" notes={["Pills, 48px, IBM Plex Sans 17px.", "Primary: ctaDefault. Secondary: the form's light pill.", "Chips: grace fill, dusk text."]}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btn("primary")}>Continue</button>
              <button type="button" className={btn("secondary")}>Back</button>
              <Chip>Needed to book</Chip>
              <Chip className="bg-ivory">Your choice</Chip>
            </div>
          </Spec>
        </div>
      </Section>

      <Section id="rules" title="Rules table">
        <RulesTable />
      </Section>

      <Section id="consent" title="Consent gates">
        <p className="max-w-3xl text-[16px] leading-7">Each staff action depends on exactly one of her choices. The coordinator&apos;s buttons read this table, so a blocked action can always say which choice blocks it, and since when.</p>
        <div className="mt-4 overflow-x-auto rounded-[20px] border border-grace bg-white" role="region" aria-label="Consent gate table" tabIndex={0}>
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead className="bg-background-light text-[14px]">
              <tr>
                <th className="px-4 py-3 font-medium">Staff action</th>
                <th className="px-4 py-3 font-medium">Needs her yes to</th>
                <th className="px-4 py-3 font-medium">Extra rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {STAFF_ACTIONS.map((a) => (
                <tr key={a}>
                  <td className="px-4 py-2.5">{ACTION_LABEL[a]}</td>
                  <td className="px-4 py-2.5">{CHOICE_LABEL[NEEDS[a]]}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {a === "leaveVoicemail" ? "Only if she allowed voicemail. Never health details." : a === "sendText" || a === "autoCall" ? "Shared phone: no health details." : a === "humanCall" ? "Comes with the screening: results are given by a person." : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="build" title="How it's built">
        <ul className="grid gap-3 text-[15px] leading-6 md:grid-cols-2">
          <li>
            <span className="font-semibold">One record.</span> The phone writes it, the coordinator reads it. Nothing leaves the phone before booking. (<code>lib/record.ts</code>)
          </li>
          <li>
            <span className="font-semibold">One rules table</span> drives the questions, the coordinator&apos;s view and {generatedCases(STUDIES.flatMap((s) => s.amendments.map((a) => a.id))).length} generated tests. (<code>lib/rules/studies.json</code>)
          </li>
          <li>
            <span className="font-semibold">A ledger test</span> fails if any of the 24 live pre-screen questions isn&apos;t accounted for. (<code>lib/ledger.ts</code>)
          </li>
          <li>
            <span className="font-semibold">Copy checks:</span> English and Spanish key parity, and reading level on every consent summary (Flesch-Kincaid for English, Fernández-Huerta for Spanish).
          </li>
          <li>
            <span className="font-semibold">Accessibility:</span> Playwright with axe on every route, keyboard-only booking, 320px and 200% zoom, Lighthouse in CI.
          </li>
          <li>
            <span className="font-semibold">Tools:</span> designed and built by Hafsa Usmani with Claude Code; Next.js, Tailwind, Vitest, Playwright.
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24">
      <h2 id={`${id}-title`} className="display mb-4 text-[28px] text-dusk">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Spec({ name, notes, children }: { name: string; notes: string[]; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="text-[17px] font-semibold">{name}</h3>
      <div className="mt-3 rounded-[14px] bg-background p-4">{children}</div>
      <ul className="mt-3 list-disc pl-5 text-[14px] leading-6 text-muted">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </Card>
  );
}

function Demo() {
  const [v, setV] = useState<string[]>(["stent"]);
  return (
    <OptionList
      name="sys-heart"
      legend="Has a doctor ever told you that you had any of these?"
      multiple
      exclusive={["none", "unsure"]}
      options={[
        { value: "heartAttack", label: "Heart attack" },
        { value: "stent", label: "A stent in a heart artery" },
        { value: "none", label: "None of these" },
        { value: "unsure", label: "Not sure" },
      ]}
      value={v}
      onChange={(x) => setV(x as string[])}
    />
  );
}

/** The live rule edit: switch on a protocol amendment and watch the flow, Rosa's record and the tests change. */
function RulesTable() {
  const [on, setOn] = useState(false);
  const amendments = on ? ["amend-2"] : [];
  const rosa = rosaBooked();
  const fresh = setChoice({ ...emptyParticipant(), siteId: "maple", zip: "90022", dob: "1968-03-14" }, "matching", true, TODAY);
  const asked = steps(fresh, amendments).filter((s) => s.startsWith("health:")).map((s) => s.slice(7));
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-[17px]">
          <input type="checkbox" className="h-5 w-5 accent-[var(--care-dusk)]" checked={on} onChange={(e) => setOn(e.target.checked)} />
          <span>
            <span className="font-semibold">HL-204 Amendment 2:</span> exclude current smokers
          </span>
        </label>
        <ul className="mt-3 grid gap-3 text-[15px] leading-6 md:grid-cols-3" aria-live="polite">
          <li className="rounded-[14px] bg-background p-3">
            <span className="block font-semibold">New participants are asked</span>
            {asked.map((f) => ({ heart: "Heart history", kidney: "Kidney and diabetes", cancer5y: "Cancer in 5 years", smoking: "Smoking" })[f] ?? f).join(", ")}
          </li>
          <li className="rounded-[14px] bg-background p-3">
            <span className="block font-semibold">Rosa, already booked</span>
            {on ? "Smoking is \"not known yet\": added to her coordinator's \"to confirm on the call\" list. Not a no." : "Possible match on 3 answers, 2 unknown."}
          </li>
          <li className="rounded-[14px] bg-background p-3">
            <span className="block font-semibold">Generated tests</span>
            {generatedCases(amendments).length} cases from the table{on ? " (3 new for the amendment)" : ""}
          </li>
        </ul>
      </Card>

      {STUDIES.map((s) => {
        const r = evaluateStudy(s, matchAnswers(rosa), amendments);
        return (
          <div key={s.id} className="overflow-x-auto rounded-[20px] border border-grace bg-white" role="region" aria-label={`${s.id} criteria`} tabIndex={0}>
            <table className="w-full min-w-[720px] text-left text-[15px]">
              <caption className="px-4 pt-4 text-left">
                <span className="text-[17px] font-semibold">
                  {s.id} · {s.name.en}
                </span>{" "}
                <span className="text-muted">(fictional)</span>
              </caption>
              <thead className="text-[14px]">
                <tr>
                  <th className="px-4 py-2 font-medium">Criterion</th>
                  <th className="px-4 py-2 font-medium">Rule</th>
                  <th className="px-4 py-2 font-medium">Answered</th>
                  <th className="px-4 py-2 font-medium">Rosa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {r.criteria.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">
                      {c.label.en}
                      {c.id === "smoking" && <Chip className="ml-2 bg-ivory text-[12px]">amendment</Chip>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[13px]">{c.field ? `${c.kind} ${c.field} ${c.op} ${JSON.stringify(c.value)}` : c.kind}</td>
                    <td className="px-4 py-2.5">{RESOLVED_LABEL[c.resolvedAt]}</td>
                    <td className="px-4 py-2.5">
                      <TriBadge result={c.result} />
                      {c.source && <span className="block text-[13px] text-muted">{answerLabel(c.field!, c.source.value)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {on && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[15px] font-medium text-boots">
            <Icon name="users" className="h-4 w-4" /> Rosa&apos;s record with the amendment on
          </p>
          <StoreProvider init={{ amendments, queue: [rosa] }}>
            <RosaMatch />
          </StoreProvider>
        </div>
      )}
    </div>
  );
}

function RosaMatch() {
  const { queue } = useStore();
  return <CoordinatorRecord p={queue[0]} compact />;
}
