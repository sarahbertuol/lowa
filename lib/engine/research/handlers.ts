import type { Step } from "./steps";

/**
 * What each step does. OE-06 ships the queue with placeholder steps; the real providers
 * (Google Places, web search, page reader, vision, AI) replace these in OE-07 to OE-12.
 * A handler must be idempotent: running it twice gives the same saved result.
 */
export type StepContext = {
  opportunity: { id: string; name: string; city: string; website: string | null; instagram: string | null };
  photoCount: number;
  /** Results of the steps already done, by step. */
  previous: Partial<Record<Step, StepResult>>;
};

export type StepResult = { summary: string; skipped?: boolean; data?: unknown };

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NOT_YET: Record<Exclude<Step, "photo">, string> = {
  identity: "Google lookup arrives in OE-07.",
  website: "Website reading arrives in OE-07.",
  social: "Social and store search arrive in OE-07.",
  context: "Local context arrives in OE-07.",
  analysis: "Opportunity analysis arrives in OE-09.",
  draft: "Proposal draft arrives in OE-12.",
};

export async function runStep(step: Step, ctx: StepContext): Promise<StepResult> {
  if (step === "photo" && ctx.photoCount === 0) return { summary: "No photo added.", skipped: true };
  await pause(600); // keeps the progress readable until real providers exist
  if (step === "photo") return { summary: "Photo reading arrives in OE-07.", skipped: true };
  return { summary: NOT_YET[step], skipped: true };
}
