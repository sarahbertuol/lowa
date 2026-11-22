"use client";

import { useState, type FormEvent } from "react";
import { sendForm, honeypotProps } from "@/lib/send-form";

type Errors = Partial<Record<"name" | "agency" | "email" | "goal" | "need", string>>;

const needs = [
  "Small website (US$920)",
  "Bigger website (from US$1,200)",
  "Not sure yet, I need advice",
];

export default function BriefingForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<false | "email" | "whatsapp">(false);
  const [busy, setBusy] = useState(false);

  function validate(f: FormData): Errors {
    const e: Errors = {};
    if (!String(f.get("name") ?? "").trim()) e.name = "Tell us your name.";
    if (!String(f.get("agency") ?? "").trim()) e.agency = "Tell us your agency name.";
    const email = String(f.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (!String(f.get("goal") ?? "").trim()) e.goal = "Tell us what the site needs to do.";
    if (!String(f.get("need") ?? "")) e.need = "Pick the option closest to your client's need.";
    return e;
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) {
      // aria-invalid is not rendered yet at this point, so focus by field order instead.
      const firstKey = (["name", "agency", "email", "need", "goal"] as const).find((k) => found[k]);
      focusField(form, firstKey);
      return;
    }
    const v = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    const via = await sendForm("agency", form, [
      ["Name", v("name")],
      ["Agency", v("agency")],
      ["Email", v("email")],
      ["Need", v("need")],
      ["What the site should do", v("goal")],
      ["Audience", v("audience")],
      ["Deadline", v("deadline")],
    ]);
    setBusy(false);
    setDone(via);
  }

  if (done) {
    return (
      <div className="thanks" role="status" aria-live="polite">
        <span className="mono">Briefing received</span>
        {done === "email" ? (
          <>
            <h3>Thank you. We reply within 5 hours.</h3>
            <p className="hint">Watch your inbox for the structure, timeline and fixed price.</p>
          </>
        ) : (
          <>
            <h3>Almost there: send it on WhatsApp.</h3>
            <p className="hint">
              Our email did not answer, so we opened WhatsApp with your briefing ready. Just press send.
            </p>
          </>
        )}
      </div>
    );
  }

  const missing = Object.keys(errors).length > 0;

  return (
    <form
      className="form"
      onSubmit={onSubmit}
      onInput={(e) => setErrors((prev) => clearError(prev, (e.target as HTMLElement).id))}
      noValidate
      aria-label="Project briefing"
    >
      <div className="row">
        <Field id="name" label="Your name" error={errors.name} autoComplete="name" />
        <Field id="agency" label="Agency name" error={errors.agency} autoComplete="organization" />
      </div>
      <div className="row">
        <Field id="email" label="Work email" type="email" error={errors.email} autoComplete="email" />
        <div className="field">
          <label htmlFor="need">What do you need?</label>
          <select
            id="need"
            name="need"
            defaultValue=""
            aria-invalid={errors.need ? "true" : undefined}
            aria-describedby={errors.need ? "need-err" : undefined}
          >
            <option value="" disabled>
              Choose one
            </option>
            {needs.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span id="need-err" className="err">{errors.need}</span>
        </div>
      </div>
      <div className="field">
        <label htmlFor="goal">What should the site do for your client?</label>
        <textarea
          id="goal"
          name="goal"
          aria-invalid={errors.goal ? "true" : undefined}
          aria-describedby={errors.goal ? "goal-err" : undefined}
        />
        <span id="goal-err" className="err">{errors.goal}</span>
      </div>
      <div className="row">
        <Field id="audience" label="Who is the audience? (optional)" />
        <Field id="deadline" label="Deadline in mind? (optional)" />
      </div>
      <input {...honeypotProps} />
      <div>
        {missing && (
          <p className="err form-err" role="alert">
            Some fields need your attention above.
          </p>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending..." : "Send the briefing"} <span className="arr">→</span>
        </button>
      </div>
    </form>
  );
}

/** Removes the error of a field as soon as the person changes it. */
export function clearError<T extends Record<string, string | undefined>>(prev: T, id: string): T {
  if (!id || !(id in prev)) return prev;
  const next = { ...prev };
  delete next[id];
  return next;
}

/** Brings the first invalid field to the middle of the screen and focuses it. */
export function focusField(form: HTMLFormElement, id?: string) {
  if (!id) return;
  const el = form.querySelector<HTMLElement>(`#${id}`);
  if (!el) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
  el.focus({ preventScroll: true });
}

export function Field({
  id,
  label,
  type = "text",
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <span id={`${id}-err`} className="err">{error}</span>
    </div>
  );
}
