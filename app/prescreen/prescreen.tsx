"use client";

import { useEffect } from "react";
import { ParticipantFlow } from "@/components/participant/flow";
import { useStore } from "@/components/store";
import type { Lang } from "@/lib/rules/engine";

export function PrescreenPage({ lang }: { lang?: Lang }) {
  const { dispatch, p, screen } = useStore();
  // ?lang=es opens the flow in Spanish, but only before she's started, so it never overrides her own switch.
  useEffect(() => {
    if (lang && screen === "intro" && p.lang !== lang) dispatch({ type: "lang", lang });
  }, [lang, screen, p.lang, dispatch]);
  return (
    <div className="min-h-[70vh] bg-background">
      <ParticipantFlow />
    </div>
  );
}
