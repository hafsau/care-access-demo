"use client";

import { useState } from "react";
import { fmtSlot, fmtStamp } from "@/lib/format";
import { age, matches, site, type Disposition, type Participant } from "@/lib/record";
import { ACTION_LABEL, answerLabel, CHOICE_LABEL, consentLine, filledByLabel, LANG_NAME, nextStep, reach, RESOLVED_LABEL, SCRIPT, toConfirm } from "@/lib/staff";
import type { StaffAction } from "@/lib/consent";
import { useStore } from "../store";
import { btn, Card, Chip, Icon, TriBadge, type IconName } from "../ui";

const ACTION_ICON: Record<StaffAction, IconName> = {
  humanCall: "phone",
  leaveVoicemail: "voicemail",
  sendText: "message",
  autoCall: "robot",
  discussStudies: "flask",
  referToStudyTeam: "users",
  sendNews: "doc",
};

const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: "reached", label: "Reached her" },
  { value: "voicemail", label: "Left a voicemail (no health details)" },
  { value: "noAnswer", label: "No answer, no voicemail" },
  { value: "callBack", label: "Asked to call back" },
  { value: "wrongNumber", label: "Wrong number" },
  { value: "declined", label: "Declined to talk" },
];

/** The coordinator's view of one participant record. Everything here is read from the record and her choices. */
export function CoordinatorRecord({ p, compact = false }: { p: Participant; compact?: boolean }) {
  const { amendments } = useStore();
  const s = site(p);
  const results = matches(p, amendments);
  const confirm = toConfirm(p, amendments);
  const [calling, setCalling] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-muted">{p.id}</p>
            <h2 className="display text-[28px] text-dusk">
              {p.contact.first} {p.contact.last}
            </h2>
            <p className="mt-1 text-[15px]">
              {age(p)} years · {s?.name}, {s?.area}
            </p>
            {p.slot && <p className="text-[15px]">Screening: {fmtSlot(p.slot, "en")}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {p.lang === "es" && (
              <Chip>
                <Icon name="globe" className="h-3.5 w-3.5" />
                Spanish-speaking callback
              </Chip>
            )}
            {p.contact.sharedPhone && (
              <Chip className="bg-ivory">
                <Icon name="users" className="h-3.5 w-3.5" />
                Shared phone
              </Chip>
            )}
            {p.filledBy === "lar" && (
              <Chip className="bg-ivory">
                <Icon name="user" className="h-3.5 w-3.5" />
                Representative decides
              </Chip>
            )}
          </div>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-3">
          <div>
            <dt className="text-muted">Filled in by</dt>
            <dd>{filledByLabel(p)}</dd>
          </div>
          <div>
            <dt className="text-muted">Call in</dt>
            <dd>
              {LANG_NAME[p.lang]} · {p.contact.bestTime ? { morning: "mornings 9–12", afternoon: "afternoons 12–5", evening: "evenings 5–8" }[p.contact.bestTime] : "any time"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Next step</dt>
            <dd>{nextStep(p, amendments)}</dd>
          </div>
        </dl>
      </Card>

      <section aria-labelledby={`reach-${p.id}`}>
        <Card className="p-5">
          <h3 id={`reach-${p.id}`} className="eyebrow text-[14px] text-boots">
            How to reach {p.contact.first}
          </h3>
          <p className="mt-1 text-[14px] text-muted">Set by her own choices. A blocked action says why and what to do instead.</p>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {reach(p).map(({ action, gate, reason, instead }) => (
              <li key={action} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full ${gate.allowed ? "bg-grace-light text-cta" : "bg-not-bg text-not"}`}>
                    <Icon name={ACTION_ICON[action]} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{ACTION_LABEL[action]}</span>
                    {gate.allowed ? (
                      gate.note === "noHealthDetails" && <span className="block text-[14px] text-muted">Allowed. Never include health details.</span>
                    ) : (
                      <span id={`why-${p.id}-${action}`} className="block text-[14px] text-not">
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
                    {action === "humanCall" ? `Call in ${LANG_NAME[p.lang]}` : "Start automated call"}
                  </button>
                ) : (
                  <span className={`text-[14px] font-medium ${gate.allowed ? "text-cta" : "text-not"}`}>{gate.allowed ? "Allowed" : "Blocked"}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {calling && <CallPanel p={p} onClose={() => setCalling(false)} confirm={confirm.map((x) => `${x.study}: ${x.c.label.en}`)} />}

      <section aria-labelledby={`match-${p.id}`}>
        <Card className="p-5">
          <h3 id={`match-${p.id}`} className="eyebrow text-[14px] text-boots">
            Study matching
          </h3>
          {p.consent.matching !== true ? (
            <p className="mt-2 text-[15px]">
              Study matching is off. {p.consentLog.some((e) => e.choice === "matching" && e.value) ? "She turned it off, so her matching answers were deleted." : "She chose screening only."} Results only; don&apos;t bring up studies.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {results.map((r) => (
                <div key={r.study.id} className="rounded-[14px] border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[16px] font-semibold">
                      {r.study.id} · {r.study.name.en}
                    </p>
                    {r.status === "possible" ? <Chip>Possible match: worth a conversation</Chip> : <Chip className="bg-not-bg text-not">Not a match</Chip>}
                  </div>
                  <ul className="mt-3 flex flex-col gap-2">
                    {r.criteria.map((c) => (
                      <li key={c.id} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
                        <span>
                          <TriBadge result={c.result} />
                        </span>
                        <span className="text-[15px] leading-6">
                          {c.label.en}
                          <span className="block text-[14px] text-muted">
                            {c.source ? `She said: ${answerLabel(c.field!, c.source.value)}` : c.resolvedAt === "prescreen" ? "Not asked: ask on the call" : RESOLVED_LABEL[c.resolvedAt]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {confirm.length > 0 && (
                <div className="rounded-[14px] bg-ivory p-4">
                  <p className="text-[15px] font-semibold">To confirm on the call</p>
                  <ul className="mt-1 list-disc pl-5 text-[15px] leading-6">
                    {confirm.map((x) => (
                      <li key={x.study + x.c.id}>
                        {x.study}: {x.c.label.en}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[13px] text-muted">A possible match means &ldquo;worth a conversation&rdquo;, not eligibility. The study team decides, with its own consent.</p>
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
        <h3 id={`hist-${p.id}`} className="eyebrow text-[14px] text-boots">
          Consent and contact history
        </h3>
        <ol className="mt-3 flex flex-col gap-2 border-l-2 border-grace pl-4">
          {[...p.consentLog.map((e) => ({ at: e.at, text: consentLine(e), meta: `${e.by === "participant" ? "By her" : "By staff"}, ${LANG_NAME[e.lang]}, wording ${e.version}`, key: `c-${e.at}-${e.choice}` })), ...p.calls.map((c) => ({ at: c.at, text: `Call: ${DISPOSITIONS.find((d) => d.value === c.disposition)?.label}`, meta: [c.by, LANG_NAME[c.lang], c.note].filter(Boolean).join(" · "), key: `k-${c.at}` }))]
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((e) => (
              <li key={e.key} className="text-[15px] leading-6">
                <span className="text-muted">{fmtStamp(e.at)}</span> · {e.text}
                <span className="block text-[13px] text-muted">{e.meta}</span>
              </li>
            ))}
        </ol>
        <p className="mt-3 text-[13px] text-muted">Append-only. {Object.values(CHOICE_LABEL).length} separate choices, each with the wording version she saw.</p>
      </Card>
    </section>
  );
}

function CallPanel({ p, onClose, confirm }: { p: Participant; onClose: () => void; confirm: string[] }) {
  const { dispatch } = useStore();
  const [disposition, setDisposition] = useState<Disposition | "">("");
  const [note, setNote] = useState("");
  const script = SCRIPT[p.lang];
  return (
    <section aria-labelledby={`call-${p.id}`} className="rounded-[20px] border-2 border-cta bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 id={`call-${p.id}`} className="display text-[22px]">
          Calling {p.contact.first} in {LANG_NAME[p.lang]}
        </h3>
        <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-gray-light" aria-label="Close call panel">
          <Icon name="x" />
        </button>
      </div>
      <ol lang={p.lang} className="mt-3 flex flex-col gap-2 rounded-[14px] bg-background-light p-4 text-[15px] leading-6">
        <li>1. {script.opener}</li>
        <li>2. {script.verify}</li>
        <li>3. {script.purpose}</li>
      </ol>
      {confirm.length > 0 && p.consent.matching && (
        <p className="mt-3 text-[15px]">
          <span className="font-semibold">Then confirm:</span> {confirm.join("; ")}.
        </p>
      )}
      <fieldset className="mt-4">
        <legend className="text-[15px] font-semibold">How did it go?</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {DISPOSITIONS.filter((d) => d.value !== "voicemail" || p.contact.voicemail).map((d) => (
            <label key={d.value} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded px-2 text-[15px] text-boots hover:bg-gray-light ${disposition === d.value ? "bg-grace-light" : ""}`}>
              <input type="radio" name={`disp-${p.id}`} className="h-5 w-5 accent-[var(--care-dusk)]" checked={disposition === d.value} onChange={() => setDisposition(d.value)} />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`note-${p.id}`} className="mt-3 block text-[15px] font-medium">
        Note <span className="font-normal text-muted">(optional, no diagnosis)</span>
      </label>
      <input id={`note-${p.id}`} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block min-h-12 w-full rounded border border-control bg-white p-3 text-[16px]" />
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={!disposition}
          className={btn("primary", "sm")}
          onClick={() => {
            if (!disposition) return;
            dispatch({ type: "logCall", id: p.id, call: { by: "Ana R. (coordinator)", disposition, lang: p.lang, note } });
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
