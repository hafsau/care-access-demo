"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { Icon } from "../ui";

export type Option = { value: string; label: string; hint?: string };

/**
 * Prefix for ids and radio names, so several flows can share a page (the
 * states gallery) without their fields or radio groups colliding.
 */
export const Scope = createContext("");
export const useScope = () => useContext(Scope);

/**
 * A question as a fieldset of big tappable options (48px+). "None of these",
 * "Not sure" and "Prefer not to say" are exclusive: picking one clears the
 * others, and picking any other option clears them.
 */
export function OptionList({
  name,
  legend,
  hint,
  options,
  multiple = false,
  exclusive = [],
  value,
  onChange,
  error,
  legendAs = "legend",
  labelledBy,
}: {
  name: string;
  legend?: ReactNode;
  labelledBy?: string;
  hint?: ReactNode;
  options: Option[];
  multiple?: boolean;
  exclusive?: string[];
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  error?: string;
  legendAs?: "legend" | "h2";
}) {
  const id = useId();
  const ns = useScope();
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (v: string) => {
    if (!multiple) return onChange(v);
    if (exclusive.includes(v)) return onChange(selected.includes(v) ? [] : [v]);
    const rest = selected.filter((x) => !exclusive.includes(x));
    onChange(rest.includes(v) ? rest.filter((x) => x !== v) : [...rest, v]);
  };
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset id={ns + name} aria-labelledby={labelledBy ? ns + labelledBy : undefined} aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      {legend && <legend className={legendAs === "h2" ? "display text-3xl" : "text-lg font-medium leading-snug text-care-dusk"}>{legend}</legend>}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-base text-care-gray_dark">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      <div className={`mt-2 flex flex-col gap-0.5 ${error ? "border-l-4 border-red-800 pl-3" : ""}`}>
        {options.map((o, i) => {
          const on = selected.includes(o.value);
          const ex = exclusive.includes(o.value);
          return (
            <label
              key={o.value}
              className={`flex min-h-12 cursor-pointer items-baseline gap-3 rounded px-2 py-[10px] text-care-boots hover:bg-care-gray_light ${on ? "bg-care-grace_light" : ""} ${ex && i > 0 && !exclusive.includes(options[i - 1].value) ? "mt-2 border-t border-care-borderColor pt-3" : ""}`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={ns + name}
                value={o.value}
                checked={on}
                onChange={() => toggle(o.value)}
                className="h-5 w-5 flex-none translate-y-[3px] accent-care-dusk"
              />
              <span className="min-w-0">
                <span className="block text-lg leading-[1.35]">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-base leading-5 text-care-gray_dark">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  optional,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  id = useScope() + id;
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium text-care-dusk">
        {label}
        {optional && <span className="font-normal text-care-gray_dark"> ({optional})</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-care-gray_dark">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`mt-1 block min-h-12 w-full rounded border bg-white p-3 text-lg leading-[1.2] ${error ? "border-2 border-red-800" : "border-care-motion600"}`}
        {...rest}
      />
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-base font-semibold text-red-800">
      <Icon name="alert" className="mt-0.5 h-4 w-4 flex-none" />
      {children}
    </p>
  );
}

/** Listed at the top when Continue finds problems; focus moves here, and each item jumps to its field. */
export function ErrorSummary({ title, items, summaryRef }: { title: string; items: { field: string; text: string }[]; summaryRef: React.RefObject<HTMLDivElement | null> }) {
  const ns = useScope();
  if (!items.length) return null;
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby={`${ns}error-summary-title`} className="mb-5 rounded-2xl border-2 border-red-800 bg-red-50 p-4">
      <h3 id={`${ns}error-summary-title`} className="text-base font-semibold text-red-800">
        {title}
      </h3>
      <ul className="mt-2 list-disc pl-5 text-base">
        {items.map((it) => (
          <li key={it.field + it.text}>
            <a
              href={`#${ns}${it.field}`}
              className="link text-red-800"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(ns + it.field);
                const target = el?.matches("input,select,textarea") ? el : el?.querySelector<HTMLElement>("input,select,textarea,button");
                (target ?? el)?.focus();
                el?.scrollIntoView({ block: "center" });
              }}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Yes / No as two big radio options, used for short questions inside a step. */
export function YesNo({ name, legend, hint, value, onChange, error, yes, no }: { name: string; legend: string; hint?: string; value: boolean | undefined; onChange: (v: boolean) => void; error?: string; yes: string; no: string }) {
  return (
    <OptionList
      name={name}
      legend={legend}
      hint={hint}
      options={[
        { value: "yes", label: yes },
        { value: "no", label: no },
      ]}
      value={value === undefined ? undefined : value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      error={error}
    />
  );
}
