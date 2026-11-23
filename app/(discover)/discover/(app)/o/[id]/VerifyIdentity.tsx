"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmIdentity } from "./identity-actions";

/**
 * Needs verification (docs/referencia/Oportunidade.html, state 2). Low confidence: the research
 * won't use any of these profiles until the founder picks one, or picks "Neither" and adds a link.
 */

export type Candidate = {
  index: number;
  plausible: boolean;
  name: string;
  detail: string;
  url: string | null;
  checked: string;
};

export default function VerifyIdentity({ id, candidates, reasons }: { id: string; candidates: Candidate[]; reasons: string[] }) {
  const [choice, setChoice] = useState<number | "none" | null>(candidates.length ? null : "none");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const plausible = candidates.filter((c) => c.plausible).length;
  const lead = plausible > 1
    ? `${plausible} businesses match this name. We won't use any of them until you pick.`
    : candidates.length > 1
      ? `Google found ${candidates.length} businesses nearby, but none matches both the name and the city. Pick one only if it's really them.`
      : candidates.length === 1
        ? "One Google profile came close, but it doesn't match both the name and the city."
        : "We couldn't tie this name to a business in this city. Add a link you trust.";

  function submit() {
    setError(null);
    if (choice === null) { setError("Pick one of them, or choose “Neither” and add a link."); return; }
    if (choice === "none" && !source.trim()) { setError("Add a website, Instagram or Google link you trust."); return; }
    start(async () => {
      const r = await confirmIdentity(id, { candidate: choice === "none" ? null : choice, source: source.trim() || undefined });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <section className="dx-group" aria-labelledby="h-verify">
      <div className="dx-card dx-stack dx-verify">
        <h2 id="h-verify">Which one did you find?</h2>
        <p className="lead">{lead}</p>
        {reasons.length > 0 && <p className="dx-why">Why low: {reasons.join("; ")}.</p>}

        <div className="dx-stack" role="radiogroup" aria-labelledby="h-verify">
          {candidates.map((c) => (
            <label key={c.index} className="dx-cand">
              <input type="radio" name="cand" checked={choice === c.index} onChange={() => setChoice(c.index)} />
              <div>
                <b>{c.name}</b>
                <p>{c.detail}</p>
                <p className="mono">
                  {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer nofollow">Open in Google Maps</a> : null}
                  {c.url ? " · " : ""}checked {c.checked}
                </p>
              </div>
            </label>
          ))}
          {candidates.length > 0 && (
            <label className="dx-cand">
              <input type="radio" name="cand" checked={choice === "none"} onChange={() => setChoice("none")} />
              <div><b>Neither of these</b><p>Add a link you trust below.</p></div>
            </label>
          )}
        </div>

        <div className="dx-field">
          <label htmlFor="verify-src">Add a source{choice === "none" ? "" : " (optional)"}</label>
          <input
            id="verify-src" className="dx-input" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false}
            placeholder="Website, Instagram or Google link" value={source} onChange={(e) => setSource(e.target.value)}
          />
        </div>

        {error && <p className="dx-error" role="alert">{error}</p>}
        <button type="button" className="dx-btn block" onClick={submit} disabled={pending}>
          {pending ? "Confirming…" : "Confirm and continue"}
        </button>
      </div>
    </section>
  );
}
