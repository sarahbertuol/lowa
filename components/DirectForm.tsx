"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/BriefingForm";

/** Contact form for business owners who found us through our work (not agencies). */
type Errors = Partial<Record<"d-name" | "d-email" | "d-need" | "d-about", string>>;

const needs = [
  "A new website for my business",
  "A new look for my current site",
  "A link page for my social bio",
  "An event or invitation site",
  "Not sure yet, I need advice",
];

export default function DirectForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function validate(f: FormData): Errors {
    const e: Errors = {};
    if (!String(f.get("d-name") ?? "").trim()) e["d-name"] = "Tell us your name.";
    const email = String(f.get("d-email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e["d-email"] = "Enter a valid email address.";
    if (!String(f.get("d-need") ?? "")) e["d-need"] = "Pick the option closest to what you need.";
    if (!String(f.get("d-about") ?? "").trim()) e["d-about"] = "Tell us a little about your business.";
    return e;
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const found = validate(new FormData(form));
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = (["d-name", "d-email", "d-need", "d-about"] as const).find((k) => found[k]);
      if (firstKey) form.querySelector<HTMLElement>(`#${firstKey}`)?.focus();
      return;
    }
    // No submission endpoint is decided yet (see CLAUDE.md). The message is not sent anywhere.
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, 400);
  }

  if (done) {
    return (
      <div className="thanks" role="status" aria-live="polite">
        <span className="mono">Message received</span>
        <h3>Thank you. We will be in touch soon.</h3>
        <p className="hint">Watch your inbox: we reply by email with the next steps.</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-label="Contact for business owners">
      <div className="row">
        <Field id="d-name" label="Your name" error={errors["d-name"]} autoComplete="name" />
        <Field id="d-business" label="Business name (optional)" autoComplete="organization" />
      </div>
      <div className="row">
        <Field id="d-email" label="Email" type="email" error={errors["d-email"]} autoComplete="email" />
        <Field id="d-phone" label="Phone or WhatsApp (optional)" type="tel" autoComplete="tel" />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="d-need">What are you looking for?</label>
          <select
            id="d-need"
            name="d-need"
            defaultValue=""
            aria-invalid={errors["d-need"] ? "true" : undefined}
            aria-describedby={errors["d-need"] ? "d-need-err" : undefined}
          >
            <option value="" disabled>
              Choose one
            </option>
            {needs.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span id="d-need-err" className="err">{errors["d-need"]}</span>
        </div>
        <Field id="d-site" label="Current website, if any (optional)" type="url" autoComplete="url" />
      </div>
      <div className="field">
        <label htmlFor="d-about">Tell us about your business and what the site should do</label>
        <textarea
          id="d-about"
          name="d-about"
          aria-invalid={errors["d-about"] ? "true" : undefined}
          aria-describedby={errors["d-about"] ? "d-about-err" : undefined}
        />
        <span id="d-about-err" className="err">{errors["d-about"]}</span>
      </div>
      <Field id="d-when" label="When would you like it live? (optional)" />
      <div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending" : "Send message"} <span className="arr">→</span>
        </button>
      </div>
    </form>
  );
}
