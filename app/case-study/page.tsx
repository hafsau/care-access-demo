import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Chip, Eyebrow } from "@/components/ui";
import { DISPOSITION_LABEL, LEDGER, OWNER_LABEL, type Disposition } from "@/lib/ledger";
import { LIVE_CONDITIONAL, LIVE_OBSERVED, LIVE_SLIDES } from "@/lib/live-slides";

export const metadata: Metadata = { title: "Case study" };

const counts = LEDGER.reduce<Record<Disposition, number>>((acc, r) => ({ ...acc, [r.disposition]: (acc[r.disposition] ?? 0) + 1 }), {} as Record<Disposition, number>);

export default function CaseStudy() {
  return (
    <article className="mx-auto max-w-[920px] px-4 py-8 sm:px-6">
      <Eyebrow>Case study</Eyebrow>
      <h1 className="display mt-1 text-[40px] text-care-dusk">Asked once, for a reason</h1>
      <p className="mt-3 text-lg leading-8">
        Care Access&apos;s pre-screen does four jobs in one form: it books a free screening, it gathers what research sponsors need to find participants, it records consent, and it sets up how staff may
        contact someone. This concept separates those jobs without losing any of them, and makes the coordinator&apos;s tools follow the participant&apos;s choices.
      </p>
      <p className="mt-3 text-base leading-7 text-care-gray_dark">
        By Hafsa Usmani, for the Product Designer application. An unofficial concept: everything here comes from public pages, and the people and studies are fictional.
      </p>

      <Part id="works" title="What already works">
        <ul className="list-disc pl-5">
          <li>The screening is free, local and walk-in friendly, and it reaches communities that clinical research usually misses.</li>
          <li>The whole flow, including the form, is available in Spanish.</li>
          <li>&ldquo;Prefer not to answer&rdquo; is already offered for race and ethnicity.</li>
          <li>A legally authorized representative is recognized, and told to bring their paperwork.</li>
          <li>The marketing opt-in is already separate and optional.</li>
        </ul>
      </Part>

      <Part id="observed" title="What I observed" meta={`Public pages, observed ${LIVE_OBSERVED}. Facts first; each is a question for the team, not a verdict.`}>
        <dl className="flex flex-col gap-4">
          <Fact k="Questions">
            The cardiometabolic pre-screen has {LIVE_SLIDES.length} slides: {LIVE_SLIDES.length - LIVE_CONDITIONAL.length} for everyone and {LIVE_CONDITIONAL.length} that appear depending on earlier answers. Everyone answers a
            heart checklist (12 conditions), a diabetes and weight list (6), a medical history (16 conditions) and a family history. The questions come from one configuration for the campaign; I couldn&apos;t see whether
            they vary by location.
          </Fact>
          <Fact k="Age">Both age and date of birth are required, so the two can disagree.</Fact>
          <Fact k="Consent">
            One required checkbox covers processing personal and sensitive data <em>and</em> consideration for clinical trials. Measured with Flesch-Kincaid, that sentence reads at about grade 20; the full Health Screening Authorization at
            about grade 15. A second, optional checkbox covers calls and texts &ldquo;including through artificial or prerecorded voice&rdquo;. <span className="text-care-gray_dark">Question: is trial consideration meant to be a condition of the free screening? The design below supports both answers.</span>
          </Fact>
          <Fact k="A branching question">
            In the English configuration served that day, &ldquo;Have you had cancer within the last 5 years?&rdquo; appears when someone selects <em>sleep apnea</em>; in the bundled defaults and the Spanish configuration it appears
            when they select <em>cancer</em>. <span className="text-care-gray_dark">Possibly a configuration difference; unconfirmed.</span>
          </Fact>
          <Fact k="Zoom and language menu">
            The page sets <code>user-scalable=no, maximum-scale=1</code>, which blocks pinch-zoom (WCAG 1.4.4), and the language menu opens on hover. <span className="text-care-gray_dark">Both are small fixes.</span>
          </Fact>
          <Fact k="After booking">Results come by phone, a few weeks later. There&apos;s no public record of what staff see, so the coordinator view here is my assumption.</Fact>
        </dl>
      </Part>

      <Part id="ledger" title="The question ledger" meta="Every live question, where it goes, and who I think needs it. A test fails if a live question is missing.">
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(DISPOSITION_LABEL) as Disposition[]).map((d) => (
            <Chip key={d} className={d === "ifStudyNeeds" ? "" : "bg-care-ivory"}>
              {DISPOSITION_LABEL[d]}: {counts[d] ?? 0}
            </Chip>
          ))}
        </div>
        <div className="relative overflow-x-auto rounded-[20px] border border-care-grace bg-white" role="region" aria-label="Question ledger" tabIndex={0}>
          <table className="w-full min-w-[760px] text-left text-sm leading-5">
            <thead className="bg-care-background_light">
              <tr>
                <th className="px-3 py-2.5 font-medium">Live question</th>
                <th className="px-3 py-2.5 font-medium">Shown today</th>
                <th className="px-3 py-2.5 font-medium">In this concept</th>
                <th className="px-3 py-2.5 font-medium">Owner (assumed)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-care-borderColor">
              {LEDGER.map((r) => (
                <tr key={r.live}>
                  <td className="px-3 py-2.5">{r.live}</td>
                  <td className="px-3 py-2.5 text-care-gray_dark">{r.liveRule}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{DISPOSITION_LABEL[r.disposition]}</span>
                    <span className="block text-care-gray_dark">{r.why}</span>
                  </td>
                  <td className="px-3 py-2.5">{OWNER_LABEL[r.owner]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Part>

      <Part id="concepts" title="Three directions I didn't take">
        <div className="flex flex-col gap-3">
          <Concept title="Just make it shorter" why="Cutting questions cuts what sponsors need to find participants. The question was never how many, but when and why each is asked." />
          <Concept title="Matching first, the screening as the reward" why="It would raise matching numbers and lower trust. Consent that feels like a toll isn't the kind that holds up on the call." />
          <Concept
            title="A conversational AI intake"
            why="Appealing, and close to where Care Access is heading. But disclosure, automated-contact consent, low literacy and screen readers all get harder in a chat. It belongs later, on top of a record that already knows what she allowed. One future-state text is on the States page."
          />
        </div>
      </Part>

      <Part id="decisions" title="What I chose">
        <ol className="flex list-decimal flex-col gap-3 pl-5">
          <li>
            <span className="font-semibold">Four separate choices.</span> Screening data (needed to book), study matching, text messages and automated voice calls, each with a plain summary, the full text, and a way to change it later.
            The summaries read at grade 3 to 7 (Flesch-Kincaid); the full texts at grade 5 to 8.
          </li>
          <li>
            <span className="font-semibold">Ask only what a nearby study needs.</span> With a yes to matching, the rules table decides which history questions to ask, and stops asking for a study an earlier answer already
            ruled out. &ldquo;Not sure&rdquo; is an answer, and it makes a criterion unknown, never a no.
          </li>
          <li>
            <span className="font-semibold">Nothing leaves the phone until she books.</span> Including the health questions.
          </li>
          <li>
            <span className="font-semibold">Staff tools follow her choices.</span> Each blocked action names the choice, when and in which language she made it, and what to do instead.
          </li>
          <li>
            <span className="font-semibold">Keep the demographic questions,</span> explained and with &ldquo;Prefer not to say&rdquo;, as one combined race and ethnicity question in the OMB SPD 15 format.
          </li>
        </ol>
      </Part>

      <Part id="tradeoff" title="The tradeoff I'm making">
        <p>
          Asking only what a nearby study needs today means fewer history answers on file for studies that start later. If Care Access uses pre-screen answers to size future studies or to re-match people, that pool shrinks, and
          the current-study guardrail below wouldn&apos;t show it.
        </p>
        <p className="mt-3">
          The fix I&apos;d propose is a separate, plain choice inside study matching: &ldquo;Keep my answers to check studies that start later&rdquo;, with its own retention wording (pending legal review). With a yes, the wider history
          questions are asked, each with the same &ldquo;why we ask&rdquo; line. That keeps the pool for the people who want to be in it, and tells everyone else the truth about why they&apos;re asked.
        </p>
      </Part>

      <Part id="measure" title="How I'd know it worked" meta="No invented results. Thresholds would be agreed with the team before launch.">
        <ul className="list-disc pl-5">
          <li>
            <span className="font-semibold">Guardrail:</span> study-matching opt-in rate and possible matches per booked screening stay level or improve. If they fall, roll back.
          </li>
          <li>
            <span className="font-semibold">Guardrail:</span> the size and completeness of the pool available for future studies, if pre-screen answers feed it.
          </li>
          <li>Completion rate by step, device and language, and where people leave.</li>
          <li>Time to book, and how often people use &ldquo;Not sure&rdquo;.</li>
          <li>Callback reach rate, and calls made outside someone&apos;s chosen window.</li>
          <li>Choices changed after booking, and which ones.</li>
          <li>English and Spanish parity on all of the above.</li>
        </ul>
      </Part>

      <Part id="next" title="What I'd test first">
        <p>
          I haven&apos;t run sessions for this concept. The first round would be five teach-back sessions on the four consent cards, including an adult over 65 and a Spanish-dominant participant: can they say, in their own words, what
          each choice allows? Then I&apos;d watch two member-services calls to check the coordinator view against the real workflow before anything else.
        </p>
        <p className="mt-3 font-semibold">Questions for the team</p>
        <ul className="mt-1 list-disc pl-5">
          <li>Is study matching a condition of the free screening, or a choice?</li>
          <li>Do pre-screen answers feed future feasibility or re-matching, and for how long are they kept?</li>
          <li>Who owns each question in the ledger, and who approves changes?</li>
          <li>Partner sites show the street address; what is it used for?</li>
          <li>Is the cancer-question branching difference real?</li>
        </ul>
      </Part>

      <Part id="real" title="What's real and what isn't">
        <ul className="list-disc pl-5">
          <li>
            <span className="font-semibold">Real:</span> the live questions and their conditions (from the public form configuration), the color tokens and type (from the public CSS), and the reading-level measurements.
          </li>
          <li>
            <span className="font-semibold">Made up:</span> Rosa and everyone in the queue, the sites, the studies HL-204 and KD-118 and their criteria, and the coordinator&apos;s screens.
          </li>
          <li>
            <span className="font-semibold">Proposed:</span> all consent wording, pending legal and regulatory review. It isn&apos;t study informed consent, which happens later with a study team.
          </li>
          <li>
            <span className="font-semibold">Spanish:</span> drafted for this concept; native-speaker review pending.
          </li>
          <li>
            <span className="font-semibold">AI use:</span> built with Claude Code. I made the product and design calls, wrote the rules, and reviewed the copy; AI agents also reviewed the plan from several roles. No real participant data was used.
          </li>
        </ul>
        <p className="mt-4">
          See it working: <Link href="/" className="link">both sides</Link>, <Link href="/states" className="link">edge cases</Link>, and <Link href="/system" className="link">the system</Link>.
        </p>
      </Part>
    </article>
  );
}

function Part({ id, title, meta, children }: { id: string; title: string; meta?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24 text-base leading-7">
      <h2 id={`${id}-title`} className="display text-3xl text-care-dusk">
        {title}
      </h2>
      {meta && <p className="mt-1 text-base text-care-gray_dark">{meta}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="font-semibold">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Concept({ title, why }: { title: string; why: string }) {
  return (
    <Card className="p-5">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1">{why}</p>
    </Card>
  );
}
