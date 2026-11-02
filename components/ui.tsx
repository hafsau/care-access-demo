import type { ReactNode } from "react";
import type { Tri } from "@/lib/rules/engine";

/*
 * Class helpers and small primitives, following careaccess.com components.
 * Server-safe.
 *  - Buttons: pills, IBM Plex Sans semibold, 48px tall; primary is the live
 *    CTA's care-motion600 with white text (4.5:1), secondary is the form's
 *    light "Continue" pill.
 *  - Cards: white, 1px care-grace border, 20px corners, 24px padding.
 *  - Chips: care-grace fill, dusk text, 14px.
 */

export function btn(kind: "primary" | "dusk" | "secondary" | "outline" | "ghost" = "primary", size: "md" | "sm" = "md") {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { md: "min-h-12 px-6 text-lg", sm: "min-h-11 px-4 text-base" };
  const kinds = {
    primary: "bg-care-motion600 text-white hover:bg-care-ctaDefault",
    dusk: "bg-care-dusk text-white hover:bg-care-boots",
    secondary: "bg-care-gray_light text-care-dusk hover:bg-care-ivory",
    outline: "border border-care-dusk bg-white text-care-dusk hover:bg-care-gray_light",
    ghost: "text-care-dusk underline underline-offset-4 hover:decoration-2",
  };
  return `${base} ${sizes[size]} ${kinds[kind]}`;
}

export function Card({ className = "", children, tone = "white" }: { className?: string; children: ReactNode; tone?: "white" | "ivory" | "grace" }) {
  const bg = { white: "border border-care-grace bg-white", ivory: "bg-care-ivory", grace: "bg-care-grace_light" }[tone];
  return <div className={`rounded-[20px] ${bg} ${className}`}>{children}</div>;
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded bg-care-grace px-2 py-0.5 text-sm text-care-dusk ${className}`}>{children}</span>;
}

export type IconName = "check" | "x" | "question" | "phone" | "phone-off" | "message" | "message-off" | "robot" | "lock" | "pin" | "clock" | "user" | "users" | "globe" | "arrow" | "back" | "alert" | "doc" | "voicemail" | "flask" | "info" | "play" | "pause" | "refresh" | "spark";

const PATHS: Record<IconName, string> = {
  check: "M5 12l5 5L20 7",
  x: "M6 6l12 12M18 6L6 18",
  question: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  "phone-off": "M3 3l18 18M5 4h4l2 5-2.5 1.5M15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  message: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  "message-off": "M3 3l18 18M8 4.6A8 8 0 0 1 20.4 15M17.6 17.6A8 8 0 0 1 9.4 19.1L4 20l1-4.6A8 8 0 0 1 6.3 6.4",
  robot: "M12 4v3M6 8h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9.5 16.5h5",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  alert: "M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
  voicemail: "M6.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6.5 16h11",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 14h9",
  info: "M12 16v-5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  play: "M7 5v14l11-7z",
  pause: "M8 5v14M16 5v14",
  refresh: "M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Met / not met / not known yet. Shape and words carry the meaning, color only reinforces it. */
export function TriBadge({ result, children }: { result: Tri; children?: ReactNode }) {
  const style = {
    met: { cls: "bg-care-grace_light text-care-ctaDefault", icon: "check" as const, label: "Met" },
    notMet: { cls: "bg-care-white text-care-sunset border border-care-sunset", icon: "x" as const, label: "Not met" },
    unknown: { cls: "bg-care-ivory text-care-dusk border border-dashed border-care-motion600", icon: "question" as const, label: "Not known yet" },
  }[result];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${style.cls}`}>
      <Icon name={style.icon} className="h-3.5 w-3.5" />
      {children ?? style.label}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm font-semibold uppercase tracking-[0.08em] text-care-sunset ${className}`}>{children}</p>;
}
