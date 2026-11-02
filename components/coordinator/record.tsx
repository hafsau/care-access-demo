"use client";

import { useState } from "react";
import { fmtSlot, fmtStamp } from "@/lib/format";
import { age, matches, site, type Disposition, type Participant } from "@/lib/record";
import { ACTION_LABEL, answerLabel, callLang, CHOICE_LABEL, consentLine, consentMeta, DISPOSITIONS, filledByLabel, LANG_NAME, nextStep, reach, RESOLVED_LABEL, SCRIPT, toConfirm } from "@/lib/staff";
import type { Choice, StaffAction } from "@/lib/consent";
import type { Tri } from "@/lib/rules/engine";
import { useStore } from "../store";
import { btn, Card, Chip, Icon, TriBadge, type IconName } from "../ui";

const ACTION_ICON: Record<StaffAction, IconName> = {
  humanCall: "phone",
  leaveVoicemail: "voicemail",
  textAppointment: "message",
  autoCall: "robot",
  discussStudies: "flask",
  referToStudyTeam: "users",
  textStudies: "message",
  newsByText: "doc",
  newsByEmail: "doc",
};

/** A rule staff must follow, as opposed to a plain fact: outlined in sunset so it reads as a constraint. */
function Constraint({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-care-sunset bg-care-white px-2 py-0.5 text-sm text-care-sunset">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

/** The coordinator's view of one participant record. Everything here is read from the record and the participant's own choices. */
export function CoordinatorRecord({ p, compact = false }: { p: Participant; compact?: boolean }) {
  const { amendments } = useStore();
  const s = site(p);
  const results = matches(p, amendments);
  const confirm = toConfirm(p, amendments);
  const [calling, setCalling] = useState(false);
  const lang = callLang(p);
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-care-gray_dark">{p.id}</p>
            <h2 className="display text-3xl text-care-dusk">
              {p.contact.first} {p.contact.last}
            </h2>
            <p className="mt-1 text-base">
              {age(p)} years · {s?.name}, {s?.area}
            </p>
            {p.slot && <p className="text-base">Screening: {fmtSlot(p.slot, "en")}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {lang === "es" && (
              <Chip>
                <Icon name="globe" className="h-3.5 w-3.5" />
                Spanish-speaking callback
              </Chip>
            )}
            {p.contact.sharedPhone && <Constraint icon="users">Shared phone: no health details</Constraint>}
            {p.filledBy === "lar" && <Constraint icon="user">Representative decides</Constraint>}
            {p.wrongNumber && <Constraint icon="phone-off">Wrong number</Constraint>}
          </div>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-base sm:grid-cols-3">
          <div>
            <dt className="text-care-gray_dark">Filled in by</dt>
            <dd>{filledByLabel(p)}</dd>
          </div>
          <div>
            <dt className="text-care-gray_dark">Call</dt>
            <dd>
              {p.filledBy === "lar" && p.rep ? `${p.rep.name}, ${p.rep.phone} · ` : ""}
              {LANG_NAME[lang]} · {p.contact.bestTime ? { morning: "mornings 9–12", afternoon: "afternoons 12–5", evening: "evenings 5–8" }[p.contact.bestTime] : "any time"}
            </dd>
          </div>
          <div>
            <dt className="text-care-gray_dark">Next step</dt>
            <dd>{nextStep(p, amendments)}</dd>
          </div>
        </dl>
        {p.filledBy === "lar" && p.rep && <p className="mt-3 rounded-md bg-care-ivory px-3 py-2 text-sm">{p.rep.relationship}. Talk to the representative; check their paperwork at the visit.</p>}
      </Card>

      <section aria-labelledby={`reach-${p.id}`}>
        <Card className="p-5">
          <h3 id={`reach-${p.id}`} className="eyebrow text-sm text-care-boots">
            How to reach {p.contact.first}
          </h3>
          <p className="mt-1 text-sm text-care-gray_dark">Set by the participant&apos;s own choices. A blocked action says why and what to do instead.</p>
          <ul className="mt-3 flex flex-col divide-y divide-care-borderColor">
            {reach(p).map(({ action, gate, reason, instead }) => (
              <li key={action} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full ${gate.allowed ? "bg-care-grace_light text-care-ctaDefault" : "border border-care-sunset text-care-sunset"}`}>
                    <Icon name={ACTION_ICON[action]} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-medium">{ACTION_LABEL[action]}</span>
                    {gate.allowed ? (
                      gate.note === "noHealthDetails" && <span className="block text-sm text-care-gray_dark">Allowed. Never include health details.</span>
                    ) : (
                      <span id={`why-${p.id}-${action}`} className="block text-sm text-care-sunset">
                        {reason} {instead}
                      </span>
                    )}
                  </span>
                </span>
                {action === "humanCall" || action === "autoCall" ? (
                  <button
                    type="button"
                    disabled={!gate.allowed}
                    aria-describedby={gate.allowed ? undefined : `why-${p.id}-${action}`}
                    onClick={() => action === "humanCall" && setCalling(true)}
                    className={btn(action === "humanCall" ? "primary" : "outline", "sm")}
                  >
                    {action === "humanCall" ? `Call in ${LANG_NAME[lang]}` : "Start automated call"}
                  </button>
                ) : (
                  <span className={`text-sm font-medium ${gate.allowed ? "text-care-ctaDefault" : "text-care-sunset"}`}>{gate.allowed ? "Allowed" : "Blocked"}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {calling && <CallPanel p={p} onClose={() => setCalling(false)} />}

      <section aria-labelledby={`match-${p.id}`}>
        <Card className="p-5">
          <h3 id={`match-${p.id}`} className="eyebrow text-sm text-care-boots">
            Study matching
          </h3>
          {p.consent.matching !== true ? (
            <p className="mt-2 text-base">
              Study matching is off.{" "}
              {p.consentLog.some((e) => e.choice === "matching" && e.value) ? "It was turned off after booking, so the matching answers were deleted." : "The participant chose screening only."} Results only; don&apos;t bring up studies.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {results.map((r) => (
                <div key={r.study.id} className="rounded-2xl border border-care-borderColor p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-semibold">
                      {r.study.id} · {r.study.name.en}
                    </p>
                    {r.status === "possible" ? (
                      <Chip>Possible match: worth a conversation</Chip>
                    ) : (
                      <span className="rounded border border-care-sunset px-2 py-0.5 text-sm text-care-sunset">Not a match</span>
                    )}
                  </div>
                  <ul className="mt-3 flex flex-col gap-2">
                    {r.criteria.map((c) => (
                      <li key={c.id} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
                        <span>
                          <TriBadge result={c.result} />
                        </span>
                        <span className="text-base leading-6">
                          {c.label.en}
                          <span className="block text-sm text-care-gray_dark">
                            {c.confirmedOnCall
                              ? "Confirmed on a call"
                              : c.source
                                ? `Pre-screen answer: ${answerLabel(c.field!, c.source.value)}`
                                : c.resolvedAt === "prescreen"
                                  ? "Not asked: ask on the call"
                                  : RESOLVED_LABEL[c.resolvedAt]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {confirm.some((x) => x.c.result === "unknown") && (
                <div className="rounded-2xl bg-care-ivory p-4">
                  <p className="text-base font-semibold">To confirm on the call</p>
                  <ul className="mt-1 list-disc pl-5 text-base leading-6">
                    {confirm
                      .filter((x) => x.c.result === "unknown")
                      .map((x) => (
                        <li key={x.study + x.c.id}>
                          {x.study}: {x.c.label.en}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-care-gray_dark">A possible match means &ldquo;worth a conversation&rdquo;, not eligibility. The study team decides, with its own consent.</p>
            </div>
          )}
        </Card>
      </section>

      {!compact && <History p={p} />}
    </div>
  );
}

function History({ p }: { p: Participant }) {
  return (
    <section aria-labelledby={`hist-${p.id}`}>
      <Card className="p-5">
        <h3 id={`hist-${p.id}`} className="eyebrow text-sm text-care-boots">
          Consent and contact history
        </h3>
        <ol className="mt-3 flex flex-col gap-2 border-l-2 border-care-grace pl-4">
          {[
            ...p.consentLog.map((e, i) => ({ at: e.at, text: consentLine(e), meta: consentMeta(e, p), key: `c-${i}` })),
            ...p.calls.map((c, i) => ({ at: c.at, text: `Call: ${DISPOSITIONS.find((d) => d.value === c.disposition)?.label}`, meta: [c.by, LANG_NAME[c.lang], c.note].filter(Boolean).join(" · "), key: `k-${i}` })),
          ]
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((e) => (
              <li key={e.key} className="text-base leading-6">
                <span className="text-care-gray_dark">{fmtStamp(e.at)}</span> · {e.text}
                <span className="block text-sm text-care-gray_dark">{e.meta}</span>
              </li>
            ))}
        </ol>
        <p className="mt-3 text-sm text-care-gray_dark">Append-only: each entry keeps who chose, when, and the wording version they saw.</p>
      </Card>
    </section>
  );
}

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: "met", label: "Confirmed" },
  { value: "notMet", label: "Not met" },
  { value: "unknown", label: "Still not sure" },
];

function CallPanel({ p, onClose }: { p: Participant; onClose: () => void }) {
  const { dispatch, amendments } = useStore();
  const [disposition, setDisposition] = useState<Disposition | "">("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState<Record<string, Tri>>({});
  const [changes, setChanges] = useState<Partial<Record<Choice, boolean>>>({});
  const lang = callLang(p);
  const script = SCRIPT[lang];
  const rep = p.filledBy === "lar";
  const open = toConfirm(p, amendments).filter((x) => x.c.result === "unknown");
  const changeable: Choice[] = ["matching", "texts", "autoVoice", "news"];
  return (
    <section aria-labelledby={`call-${p.id}`} className="rounded-[20px] border-2 border-care-motion600 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 id={`call-${p.id}`} className="display text-2xl">
          Calling {rep && p.rep ? `${p.rep.name}, for ${p.contact.first}` : p.contact.first} in {LANG_NAME[lang]}
        </h3>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-care-gray_light" aria-label="Close call panel">
          <Icon name="x" />
        </button>
      </div>
      <ol lang={lang} className="mt-3 flex flex-col gap-2 rounded-2xl bg-care-background_light p-4 text-base leading-6">
        <li>1. {rep ? script.repOpener : script.opener}</li>
        <li>2. {rep ? script.repVerify : script.verify}</li>
        <li>3. {script.purpose}</li>
      </ol>

      <fieldset className="mt-4">
        <legend className="text-base font-semibold">How did it go?</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {DISPOSITIONS.filter((d) => d.value !== "voicemail" || p.contact.voicemail).map((d) => (
            <label key={d.value} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded px-2 text-base text-care-boots hover:bg-care-gray_light ${disposition === d.value ? "bg-care-grace_light" : ""}`}>
              <input type="radio" name={`disp-${p.id}`} className="h-5 w-5 accent-care-dusk" checked={disposition === d.value} onChange={() => setDisposition(d.value)} />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      {disposition === "reached" && p.consent.matching && open.length > 0 && (
        <fieldset className="mt-4">
          <legend className="text-base font-semibold">Confirm on this call</legend>
          {open.map((x) => {
            const key = `${x.study}:${x.c.id}`;
            return (
              <div key={key} className="mt-2" role="radiogroup" aria-label={`${x.study}: ${x.c.label.en}`}>
                <p className="text-base">
                  {x.study}: {x.c.label.en}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {TRI_OPTIONS.map((o) => (
                    <label key={o.value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded px-2 text-base text-care-boots hover:bg-care-gray_light ${confirmed[key] === o.value ? "bg-care-grace_light" : ""}`}>
                      <input type="radio" name={`conf-${p.id}-${key}`} className="h-5 w-5 accent-care-dusk" checked={confirmed[key] === o.value} onChange={() => setConfirmed({ ...confirmed, [key]: o.value })} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </fieldset>
      )}

      {disposition === "reached" && (
        <fieldset className="mt-4">
          <legend className="text-base font-semibold">Asked to change a choice?</legend>
          <p className="text-sm text-care-gray_dark">Logged as a staff entry for this call, in the call&apos;s language.</p>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {changeable.map((c) => {
              const checked = changes[c] ?? p.consent[c] === true;
              return (
                <label key={c} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded px-2 text-base text-care-boots hover:bg-care-gray_light">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-care-dusk"
                    checked={checked}
                    onChange={(e) => {
                      const next = { ...changes };
                      if (e.target.checked === (p.consent[c] === true)) delete next[c];
                      else next[c] = e.target.checked;
                      setChanges(next);
                    }}
                  />
                  {CHOICE_LABEL[c]}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <label htmlFor={`note-${p.id}`} className="mt-3 block text-base font-medium">
        Note <span className="font-normal text-care-gray_dark">(optional, no diagnosis)</span>
      </label>
      <input id={`note-${p.id}`} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block min-h-12 w-full rounded border border-care-motion600 bg-white p-3 text-base" />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!disposition}
          className={btn("primary", "sm")}
          onClick={() => {
            if (!disposition) return;
            dispatch({ type: "logCall", id: p.id, call: { by: "Ana R. (coordinator)", disposition, lang, note }, changes: disposition === "reached" ? changes : {}, confirmed: disposition === "reached" ? confirmed : {} });
            onClose();
          }}
        >
          Save call
        </button>
        <button type="button" className={btn("secondary", "sm")} onClick={onClose}>
          Cancel
        </button>
      </div>
    </section>
  );
}
