/** Research steps, in order (docs/ARQUITETURA.md). No dependencies: safe for the phone bundle. */

export const STEPS = ["photo", "identity", "website", "social", "context", "analysis", "draft"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABEL: Record<Step, { title: string; hint: string }> = {
  photo: { title: "Your photo", hint: "Name, website and handle from the card or storefront." },
  identity: { title: "Business identity", hint: "Google profile: name, city, phone." },
  website: { title: "Official website", hint: "Pages, speed and how people get in touch." },
  social: { title: "Social and store", hint: "Instagram, Facebook and online store." },
  context: { title: "Local context", hint: "Competitors and seasonal demand." },
  analysis: { title: "Opportunities", hint: "Up to three, specific to this business." },
  draft: { title: "Proposal and messages", hint: "Draft for your review. Nothing is sent." },
};

export type JobStatus = "queued" | "running" | "done" | "failed";

export type Job = {
  step: Step;
  status: JobStatus;
  attempts: number;
  error: string | null;
  result: { summary?: string; skipped?: boolean } | null;
  finished_at: string | null;
};

/** Paused = at least one step failed after its tries. */
export const isPaused = (jobs: Pick<Job, "status">[]) => jobs.some((j) => j.status === "failed");
/** Active = something running, or queued and not stopped by a failed step. */
export const isActive = (jobs: Pick<Job, "status">[]) =>
  jobs.some((j) => j.status === "running") || (!isPaused(jobs) && jobs.some((j) => j.status === "queued"));
