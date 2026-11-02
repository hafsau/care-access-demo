"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoordinatorRecord } from "@/components/coordinator/record";
import { ParticipantFlow } from "@/components/participant/flow";
import { rosaFill, useStore, type Screen } from "@/components/store";
import { btn, Eyebrow, Icon } from "@/components/ui";
import { steps } from "@/lib/flow";

const NOW: Partial<Record<string, string>> = {
  intro: "Rosa opens the booking link on her phone and switches to Spanish.",
  where: "She enters her ZIP and picks a site with Spanish-speaking staff.",
  who: "She's booking for herself, not for someone else.",
  dob: "Date of birth only. Her age is worked out, not asked twice.",
  choices: "Four separate choices: screening yes, study matching yes, texts yes, automated calls no.",
  "health:heart": "Matching questions only, because she said yes to matching, and only what a nearby study needs.",
  "health:kidney": "The kidney study needs this one.",
  "health:cancer5y": "Prediabetes rules out the kidney study, so this is asked for the heart study alone.",
  "health:smoking": "Amendment 2 added a smoking question. It appears without any UI change.",
  contact: "Phone, whether it's shared, voicemail, best time. Email is optional.",
  about: "Race and ethnicity in one question, with the reason shown and \"Prefer not to say\".",
  time: "She picks a time.",
  review: "She checks her answers. Nothing has left her phone yet.",
  done: "Booked. Her record reaches the coordinator, with her choices attached.",
};

export function BothSides() {
  const store = useStore();
  const { p, screen, booked, dispatch, minute, amendments } = store;
  const [play, setPlaying] = useState(false);
  const playing = play && screen !== "done";

  // Autoplay: fill Rosa's answers for the current screen, then move on.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (screen === "intro") {
        dispatch({ type: "lang", lang: "es" });
        dispatch({ type: "go", screen: "where" });
        return;
      }
      if (screen === "review") return dispatch({ type: "book" });
      const filled = rosaFill(screen, p, minute);
      const list = steps(filled.p, amendments);
      const next = list[list.indexOf(screen as never) + 1] ?? "review";
      dispatch({ type: "load", state: { p: filled.p, minute: filled.minute, screen: next as Screen } });
    }, 1300);
    return () => clearTimeout(t);
  }, [playing, screen, p, minute, amendments, dispatch]);

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Eyebrow>A Care Access concept · health screening pre-screen</Eyebrow>
          <h1 className="display mt-2 text-[40px] text-care-dusk sm:text-5xl">One record, both sides.</h1>
          <p className="mt-3 max-w-[640px] text-lg leading-7">
            Rosa books a free screening in Spanish and makes four separate choices. The coordinator&apos;s view of her record follows those choices exactly: who may call, how, and about what.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn("primary")} onClick={() => (booked ? (dispatch({ type: "reset", lang: "en" }), setPlaying(true)) : setPlaying(!playing))}>
            <Icon name={playing ? "pause" : "play"} className="h-4 w-4" />
            {playing ? "Pause" : booked ? "Play again" : "Play Rosa's booking"}
          </button>
          <button type="button" className={btn("secondary")} onClick={() => (setPlaying(false), dispatch({ type: "reset", lang: "en" }))}>
            <Icon name="refresh" className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <p role="status" className="mt-6 rounded-2xl bg-care-ivory px-4 py-3 text-base leading-6">
        <span className="font-semibold">Now: </span>
        {NOW[String(screen)] ?? "Rosa is filling in her booking."} <span className="text-care-gray_dark">{!playing && !booked && "Play it, or fill it in yourself on the phone."}</span>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[400px_1fr]">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-care-boots">
            <Icon name="user" className="h-4 w-4" /> Rosa&apos;s phone
          </p>
          <div className="mx-auto h-[780px] w-full max-w-[400px] overflow-y-auto rounded-[36px] border-[10px] border-care-dusk bg-care-background shadow-[0_12px_40px_rgba(15,61,66,0.18)]" data-phone>
            <ParticipantFlow framed manageFocus={!playing} />
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-care-boots">
            <Icon name="users" className="h-4 w-4" /> Coordinator · the same record
          </p>
          {booked ? (
            <>
              <CoordinatorRecord p={p} />
              <p className="mt-4 rounded-2xl border border-care-grace bg-white p-4 text-base leading-6">
                <span className="font-semibold">Try it:</span> on Rosa&apos;s phone, turn off <em>Mensajes de texto</em>. &ldquo;Send a text&rdquo; is blocked here immediately, with the time she changed it. Or open the{" "}
                <Link href="/coordinator" className="link">
                  full queue
                </Link>
                .
              </p>
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[20px] border border-dashed border-care-motion600 bg-white p-8 text-center">
              <Icon name="lock" className="h-8 w-8 text-care-boots" />
              <p className="display mt-3 text-2xl">Nothing here yet.</p>
              <p className="mt-2 max-w-[420px] text-base leading-6">Care Access sees nothing until Rosa books. Her answers stay on her phone until then, including the health questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
