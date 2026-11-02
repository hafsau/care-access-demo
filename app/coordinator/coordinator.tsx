"use client";

import { useState } from "react";
import { CoordinatorRecord } from "@/components/coordinator/record";
import { Queue } from "@/components/coordinator/queue";
import { useStore } from "@/components/store";
import { Eyebrow } from "@/components/ui";

export function CoordinatorPage({ initialId }: { initialId?: string }) {
  const { queue, booked } = useStore();
  const [id, setId] = useState(initialId);
  const p = queue.find((q) => q.id === id) ?? queue[0];
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">
      <Eyebrow>Member services · Maple Street site</Eyebrow>
      <h1 className="display mt-1 text-[36px] text-dusk">Booked screenings</h1>
      <p className="mt-2 max-w-2xl text-[16px] leading-7">
        What a coordinator sees after someone books. Every action is checked against that person&apos;s own choices.{" "}
        {!booked && "Book as Rosa on the Pre-screen page and she appears at the top."}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Queue
          selected={p?.id}
          onSelect={(x) => {
            setId(x);
            window.history.replaceState(null, "", `/coordinator?id=${x}`);
          }}
        />
        {p && <CoordinatorRecord key={p.id} p={p} />}
      </div>
    </div>
  );
}
