"use client";

import { fmtSlot } from "@/lib/format";
import { matches, type Participant } from "@/lib/record";
import { LANG_NAME, nextStep, reach } from "@/lib/staff";
import { useStore } from "../store";
import { Icon } from "../ui";

/** The coordinator's list: who's booked, in what language, and what each person allows. */
export function Queue({ selected, onSelect }: { selected?: string; onSelect: (id: string) => void }) {
  const { queue, amendments } = useStore();
  return (
    <nav aria-label="Booked participants">
      <ul className="flex flex-col gap-2">
        {queue.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              aria-current={selected === p.id ? "true" : undefined}
              className={`w-full rounded-[14px] border p-3 text-left hover:border-dusk ${selected === p.id ? "border-2 border-cta bg-grace-light" : "border-line bg-white"}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-semibold">
                  {p.contact.first} {p.contact.last}
                </span>
                <span className="text-[13px] text-muted">{LANG_NAME[p.lang]}</span>
              </span>
              <span className="mt-0.5 block text-[14px] text-muted">{p.slot ? fmtSlot(p.slot, "en") : ""}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                <MatchTag p={p} amendments={amendments} />
                <Allows p={p} />
              </span>
              <span className="mt-1 block text-[13px] text-dusk">{nextStep(p, amendments)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MatchTag({ p, amendments }: { p: Participant; amendments: string[] }) {
  if (!p.consent.matching) return <span className="rounded bg-ivory px-1.5 py-0.5">Screening only</span>;
  const possible = matches(p, amendments).filter((r) => r.status === "possible").length;
  return <span className={`rounded px-1.5 py-0.5 ${possible ? "bg-grace" : "bg-ivory"}`}>{possible ? `${possible} possible match` : "No match yet"}</span>;
}

/** Text, automated call: allowed or not, as icons with words for screen readers. */
function Allows({ p }: { p: Participant }) {
  const r = Object.fromEntries(reach(p).map((x) => [x.action, x.gate.allowed]));
  const items = [
    { ok: r.sendText, on: "message" as const, off: "message-off" as const, label: "Texts" },
    { ok: r.autoCall, on: "robot" as const, off: "robot" as const, label: "Automated calls" },
  ];
  return (
    <>
      {items.map((i) => (
        <span key={i.label} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${i.ok ? "bg-grace-light text-cta" : "bg-not-bg text-not"}`}>
          <Icon name={i.ok ? i.on : i.off} className="h-3.5 w-3.5" />
          {i.label} {i.ok ? "OK" : "no"}
        </span>
      ))}
    </>
  );
}
