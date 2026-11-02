"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Both sides" },
  { href: "/prescreen", label: "Pre-screen" },
  { href: "/coordinator", label: "Coordinator" },
  { href: "/states", label: "States" },
  { href: "/case-study", label: "Case study" },
  { href: "/system", label: "System" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-care-dusk focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div className="bg-care-dusk px-4 py-2 text-center text-sm leading-5 text-white">
        Unofficial concept by{" "}
        <a href="https://hafsausmani.com" className="link">
          Hafsa Usmani
        </a>{" "}
        for Care Access&apos;s Product Designer role. Not affiliated with Care Access. Synthetic people and fictional studies; nothing is sent anywhere.
      </div>
      <header className="sticky top-0 z-30 border-b border-care-borderColor bg-care-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 flex-wrap items-baseline gap-x-2" aria-label="One Record, Both Sides: home">
            <span className="display text-xl">One Record, Both Sides</span>
            <span className="rounded-full border border-care-motion600 px-2 py-0.5 text-xs font-medium text-care-gray_dark">concept</span>
          </Link>
          <nav aria-label="Main" className="-mx-1 flex min-w-0 basis-full items-center gap-1 overflow-x-auto lg:flex-1 lg:basis-auto lg:justify-end">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap ${active(n.href) ? "bg-care-dusk text-white" : "text-care-dusk hover:bg-care-grace_light"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="mt-24 bg-care-dusk text-white">
        <div className="mx-auto max-w-[1320px] px-4 py-10 text-sm leading-6 sm:px-6">
          <p className="display text-2xl">Asked once, for a reason.</p>
          <p className="mt-3 max-w-3xl text-white/85">
            A concept, not Care Access&apos;s product. Rosa and everyone in the queue are fictional; HL-204 and KD-118 are made-up studies. Consent wording is a content proposal that would need legal and regulatory review.
            Design tokens come from the public CSS of Care Access&apos;s screening site; type is IBM Plex. No logo is used.{" "}
            <Link href="/case-study#real" className="link text-white">
              What&apos;s real and what isn&apos;t
            </Link>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
