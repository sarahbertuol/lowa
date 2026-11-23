import { createAdminClient } from "@/lib/engine/supabase/admin";
import { STEPS, type Step } from "./steps";
import { runStep, type StepResult } from "./handlers";

/**
 * Research queue (OE-06). Server only, runs with the service role after the response (after()).
 * - One row per step in research_jobs; a step that is "done" is never run again.
 * - Each step gets up to 3 tries in a run; then it is "failed" and the research is paused.
 * - Resume puts failed steps back in the queue with 3 new tries and continues from there.
 * - A step stuck in "running" for 5 minutes (function stopped) can be taken again.
 */
const MAX_TRIES = 3;
const STALE_MS = 5 * 60_000;

type Options = { /** Preview only: makes this step fail, to test pause and resume. */ failStep?: Step };

export async function queueResearch(opportunityId: string) {
  const db = createAdminClient();
  const rows = STEPS.map((step) => ({ opportunity_id: opportunityId, step }));
  const { error } = await db.from("research_jobs").upsert(rows, { onConflict: "opportunity_id,step", ignoreDuplicates: true });
  if (error) throw new Error(`queue: ${error.message}`);
}

/** Resume: failed steps back to the queue with fresh tries. */
export async function resetFailed(opportunityId: string) {
  const db = createAdminClient();
  const { error } = await db
    .from("research_jobs")
    .update({ status: "queued", attempts: 0, error: null })
    .eq("opportunity_id", opportunityId)
    .eq("status", "failed");
  if (error) throw new Error(`resume: ${error.message}`);
}

export async function runResearch(opportunityId: string, opts: Options = {}) {
  const db = createAdminClient();

  const { data: opp } = await db
    .from("opportunities").select("id,name,city,website,instagram,category,status").eq("id", opportunityId).maybeSingle();
  if (!opp) return;
  const { count: photoCount } = await db
    .from("opportunity_photos").select("id", { count: "exact", head: true }).eq("opportunity_id", opportunityId);

  if (opp.status === "captured") await db.from("opportunities").update({ status: "researching" }).eq("id", opportunityId);

  const previous: Partial<Record<Step, StepResult>> = {};

  for (const step of STEPS) {
    const { data: job } = await db
      .from("research_jobs").select("id,status,attempts,result,started_at")
      .eq("opportunity_id", opportunityId).eq("step", step).maybeSingle();
    if (!job) return; // not queued
    if (job.status === "done") { previous[step] = job.result as StepResult; continue; }
    if (job.status === "failed") return; // paused until Resume
    if (job.status === "running" && job.started_at && Date.now() - Date.parse(job.started_at) < STALE_MS) return; // another run owns it

    let tries = 0;
    while (true) {
      // Claim the step: only one run can move it to "running".
      const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
      const { data: claimed } = await db
        .from("research_jobs")
        .update({ status: "running", attempts: job.attempts + tries + 1, started_at: new Date().toISOString(), error: null })
        .eq("id", job.id)
        .or(`status.in.(queued,failed),and(status.eq.running,started_at.lt."${staleBefore}")`)
        .select("id")
        .maybeSingle();
      if (!claimed) return;
      tries++;

      try {
        if (opts.failStep === step) throw new Error("Test failure (preview only).");
        const result = await runStep(step, { db, opportunity: opp, photoCount: photoCount ?? 0, previous });
        await db.from("research_jobs")
          .update({ status: "done", result, finished_at: new Date().toISOString() })
          .eq("id", job.id);
        previous[step] = result;
        break;
      } catch (e) {
        const message = e instanceof Error ? e.message.slice(0, 500) : "Unknown error";
        const last = tries >= MAX_TRIES;
        await db.from("research_jobs")
          .update({ status: last ? "failed" : "queued", error: message, finished_at: last ? new Date().toISOString() : null })
          .eq("id", job.id);
        if (last) return; // paused
        await new Promise((r) => setTimeout(r, 800 * tries));
      }
    }
  }

  // All steps done. Until analysis and drafts exist (OE-09, OE-12), the lead goes back to
  // "captured"; then the last step will set "draft_ready" or "needs_verification".
  const analysisReady = previous.draft && !previous.draft.skipped;
  await db.from("opportunities")
    .update({ status: analysisReady ? "draft_ready" : "captured" })
    .eq("id", opportunityId)
    .eq("status", "researching");
}
