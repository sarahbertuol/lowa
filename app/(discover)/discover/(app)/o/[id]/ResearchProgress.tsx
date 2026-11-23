"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STEPS, STEP_LABEL, isActive, isPaused, researchCost, type Job, type Step } from "@/lib/engine/research/steps";

/**
 * Research progress (docs/referencia/Oportunidade.html, Researching). Polls every 2s while a step
 * is queued or running. A failed step pauses the research and shows Resume.
 */
export default function ResearchProgress({ id, initial, hasPhoto }: { id: string; initial: Job[]; hasPhoto: boolean }) {
  const [jobs, setJobs] = useState<Job[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const wasActive = useRef(isActive(initial));
  const lastKey = useRef<string | null>(null);

  // A fresh server render (for example after confirming the identity) brings new steps.
  useEffect(() => { setJobs(initial); }, [initial]);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/discover/opportunities/${id}/research`, { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { status: string; jobs: Job[] };
      setJobs(j.jobs);
      const active = isActive(j.jobs);
      // Status chip, history and sources live in the server page: refresh when they change.
      const done = j.jobs.filter((x) => x.status === "done").length;
      const key = `${j.status}|${isPaused(j.jobs)}|${active}|${done}`;
      if (lastKey.current && key !== lastKey.current) router.refresh();
      lastKey.current = key;
      wasActive.current = active;
    } catch {
      /* offline: keep what we have */
    }
  }, [id, router]);

  useEffect(() => {
    if (!isActive(jobs)) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [jobs, load]);

  async function start(failStep?: Step) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/discover/opportunities/${id}/research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(failStep ? { failStep } : {}),
      });
      if (!r.ok) throw new Error();
      wasActive.current = true;
      await load();
      setTimeout(load, 800);
    } catch {
      setError("Couldn't start. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const byStep = new Map(jobs.map((j) => [j.step, j]));
  const steps = STEPS.filter((s) => s !== "photo" || hasPhoto || byStep.get("photo")?.result?.skipped === false);
  const paused = isPaused(jobs);
  const active = isActive(jobs);
  const failed = jobs.find((j) => j.status === "failed");
  const cost = researchCost(jobs);

  // Preview-only test hook (?test=fail-website) to check pause and resume.
  const [testStep, setTestStep] = useState<Step | null>(null);
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("test")?.match(/^fail-(\w+)$/);
    if (m && (STEPS as readonly string[]).includes(m[1])) setTestStep(m[1] as Step);
  }, []);

  return (
    <section className="dx-group" aria-labelledby="h-research">
      <h2 id="h-research" className="dx-h2">Research</h2>
      <div className="dx-card dx-stack">
        {jobs.length === 0 ? (
          <>
            <p>Research hasn&apos;t started for this business.</p>
            <button type="button" className="dx-btn small" onClick={() => start()} disabled={busy}>
              {busy ? "Starting…" : "Start research"}
            </button>
          </>
        ) : (
          <>
            {active && <p className="dx-hint">You can close the app. We&apos;ll keep going and it will be here when you&apos;re back.</p>}
            <ol className="dx-steps" aria-live="polite">
              {steps.map((s) => {
                const j = byStep.get(s);
                const st = j?.status ?? "queued";
                const cls = st === "done" ? "done" : st === "running" ? "run" : st === "failed" ? "fail" : "wait";
                return (
                  <li key={s} className={cls}>
                    <span className="mk" aria-hidden="true">
                      {st === "done" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>}
                      {st === "failed" && "!"}
                    </span>
                    <div>
                      <b>{STEP_LABEL[s].title}</b>
                      <span className="sr"> · {st === "done" ? "done" : st === "running" ? "running" : st === "failed" ? "paused" : "waiting"}</span>
                      <p>{st === "done" && j?.result?.summary ? j.result.summary : st === "failed" ? "Didn't finish after 3 tries." : STEP_LABEL[s].hint}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {cost && !active && (
              <p className="dx-cost">
                Research cost: {cost.usd != null ? `US$${cost.usd.toFixed(2)}` : "unknown"} in AI
                {cost.searches ? `, ${cost.searches} web search${cost.searches > 1 ? "es" : ""}` : ""}
                {cost.places ? `, ${cost.places} Google lookup${cost.places > 1 ? "s" : ""}` : ""}
                {cost.pages ? `, ${cost.pages} page${cost.pages > 1 ? "s" : ""} read` : ""}.
              </p>
            )}
          </>
        )}
        {error && <p className="dx-error" role="alert">{error}</p>}
      </div>

      {paused && failed && (
        <div className="dx-card dx-paused dx-stack" role="status">
          <b>Research paused</b>
          <p>{STEP_LABEL[failed.step].title} didn&apos;t finish after 3 tries. Everything else is saved.</p>
          <button type="button" className="dx-btn small" onClick={() => start()} disabled={busy}>
            {busy ? "Resuming…" : "Resume research"}
          </button>
        </div>
      )}

      {testStep && !active && (
        <button type="button" className="dx-link" onClick={() => start(testStep)} disabled={busy}>
          Test: run research with “{STEP_LABEL[testStep].title}” failing
        </button>
      )}
    </section>
  );
}
