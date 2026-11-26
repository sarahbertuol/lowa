"use client";

import { useState, type FormEvent } from "react";
import { Field, focusField, clearError } from "@/components/BriefingForm";
import { sendForm, honeypotProps } from "@/lib/send-form";

/** Contact form for business owners who found us through our work (not agencies). */
type Errors = Partial<Record<"d-name" | "d-email" | "d-need" | "d-about", string>>;

const needs = [
  "A new website for my business",
  "A new look for my current site",
  "A link page for my social bio",
  "An event or invitation site",
  "Not sure yet, I need advice",
];

/** `source` names the page the form was sent from (e.g. the /business page), so the email says where the lead came from. */
export default function DirectForm({ source }: { source?: string } = {}) {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<false | "email" | "whatsapp">(false);
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

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = (["d-name", "d-email", "d-need", "d-about"] as const).find((k) => found[k]);
      focusField(form, firstKey);
      return;
    }
    const v = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    const via = await sendForm("direct", form, [
      ["Name", v("d-name")],
      ["Business", v("d-business")],
      ["Email", v("d-email")],
      ["Phone or WhatsApp", v("d-phone")],
      ["Looking for", v("d-need")],
      ["Current website", v("d-site")],
      ["About the business", v("d-about")],
      ["When", v("d-when")],
      ["Sent from", source ?? ""],
    ]);
    setBusy(false);
    setDone(via);
  }

  if (done) {
    return (
      <div className="thanks" role="status" aria-live="polite">
        <span className="mono">Message received</span>
        {done === "email" ? (
          <>
            <h3>Thank you. We will be in touch soon.</h3>
            <p className="hint">Watch your inbox: we reply by email with the next steps.</p>
          </>
        ) : (
          <>
            <h3>Almost there: send it on WhatsApp.</h3>
            <p className="hint">
              Our email did not answer, so we opened WhatsApp with your message ready. Just press send.
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
      aria-label="Contact for business owners"
    >
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
      <input {...honeypotProps} />
      <div>
        {missing && (
          <p className="err form-err" role="alert">
            Some fields need your attention above.
          </p>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Sending..." : "Send message"} <span className="arr">→</span>
        </button>
      </div>
    </form>
  );
}
