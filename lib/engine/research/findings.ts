import type { SupabaseClient } from "@supabase/supabase-js";
import type { Step } from "./steps";

/**
 * Findings (research_findings). Every saved finding has a source (link, or a label such as
 * "Google profile" or "Your photo"), a date (checked_at), a verification status and a confidence.
 * A step replaces its own automatic findings when it runs again, so running twice saves the same.
 */

export type Kind =
  | "website" | "google" | "instagram" | "facebook" | "store" | "contact" | "review"
  | "catalog" | "competitor" | "context" | "photo" | "note";
export type Verification = "verified" | "unverified" | "rejected";
export type Confidence = "high" | "medium" | "low";

/** Where a finding came from, for the label next to it. */
export type SourceKind = "capture" | "photo" | "google_places" | "website" | "web_search";
export const SOURCE_LABEL: Record<SourceKind, string> = {
  capture: "You entered it",
  photo: "Your photo",
  google_places: "Google profile",
  website: "Business website",
  web_search: "Web search",
};

export type NewFinding = {
  kind: Kind;
  finding: string;
  source: SourceKind;
  sourceUrl?: string | null;
  verification: Verification;
  confidence: Confidence;
  /** Why it is (or isn't) verified, in one short phrase. */
  why?: string;
  data?: Record<string, unknown>;
};

const httpUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u.slice(0, 2000) : null);

export async function replaceFindings(db: SupabaseClient, opportunityId: string, step: Step, items: NewFinding[]) {
  const del = await db.from("research_findings").delete()
    .eq("opportunity_id", opportunityId).eq("origin", "auto").eq("data->>step", step);
  if (del.error) throw new Error(`findings: ${del.error.message}`);
  if (!items.length) return;
  const rows = items.map((f) => ({
    opportunity_id: opportunityId,
    kind: f.kind,
    finding: f.finding.slice(0, 1000),
    source_url: httpUrl(f.sourceUrl),
    verification: f.verification,
    confidence: f.confidence,
    origin: "auto",
    data: { ...f.data, step, source: f.source, ...(f.why ? { why: f.why } : {}) },
  }));
  const ins = await db.from("research_findings").insert(rows);
  if (ins.error) throw new Error(`findings: ${ins.error.message}`);
}
