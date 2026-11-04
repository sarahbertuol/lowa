"use client";

import { useState, type FormEvent } from "react";

type Errors = Partial<Record<"name" | "agency" | "email" | "goal" | "need", string>>;

const needs = [
  "Small website (US$920)",
  "Bigger website (from US$1,200)",
  "Not sure yet, I need advice",
];

export default function BriefingForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
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

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const found = validate(new FormData(form));
    setErrors(found);
    if (Object.keys(found).length) {
      const first = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    // No submission endpoint is decided yet (see CLAUDE.md). The brief is not sent anywhere.
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, 400);
  }

  if (done) {
    return (
      <div className="thanks" role="status" aria-live="polite">
        <span className="mono">Briefing received</span>
        <h3>Thank you. We reply within 5 hours.</h3>
        <p className="hint">Watch your inbox for the structure, timeline and fixed price.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-label="Project briefing">
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
      <div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending" : "Send the briefing"} <span className="arr">→</span>
        </button>
      </div>
    </form>
  );
}

function Field({
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
