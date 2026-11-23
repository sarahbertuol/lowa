import type { SupabaseClient } from "@supabase/supabase-js";
import type { Confidence } from "./findings";

/**
 * Confidence (docs/ARQUITETURA.md, Confiança). Worked out from the saved findings only:
 * - HIGH: identity confirmed (name + city + one more fact: address, phone or cross link) and the
 *   relevant channels verified (website, or a social profile when there is no website) and a contact.
 * - MEDIUM: identity confirmed, but something important is missing.
 * - LOW: more than one plausible candidate, none, or a name without a matching city.
 * A same-named business is never taken as this one without the city and one more fact, or the
 * founder's choice. LOW means "Needs verification" and blocks publishing (OE-14).
 */

export type FindingLite = {
  kind: string;
  verification: "verified" | "unverified" | "rejected";
  origin: "auto" | "manual";
  data: Record<string, unknown> | null;
};

type PlaceLite = { nameMatch?: boolean; cityMatch?: boolean; extra?: string | null; phone?: string | null };

export type Assessment = {
  level: Confidence;
  identity: "confirmed" | "ambiguous" | "none" | "mismatch" | "not_checked";
  /** Plain reasons for the level, for "Why medium" or "Why low". */
  reasons: string[];
};

export function assess(input: { identityConfirmed: boolean; findings: FindingLite[] }): Assessment {
  const f = input.findings.filter((x) => x.verification !== "rejected");
  const google = f.filter((x) => x.kind === "google" && x.origin === "auto" && x.data?.place);
  const places = google.map((g) => ({ place: g.data!.place as PlaceLite, best: g.data!.best === true, verified: g.verification === "verified" }));
  const plausible = places.filter((p) => p.place.nameMatch && p.place.cityMatch);
  const best = places.find((p) => p.best) ?? null;
  const googleChecked = input.findings.some((x) => x.kind === "google" && x.data?.step === "identity");
  const manual = f.some((x) => x.origin === "manual" && x.verification === "verified");
  const has = (kinds: string[]) => f.some((x) => kinds.includes(x.kind) && x.verification === "verified");

  // The identity step only marks a "best" profile when it is the single one with name and city
  // (or the single one with an extra fact). The founder's choice also confirms it.
  const confirmed = input.identityConfirmed || !!best;
  if (!confirmed) {
    const reasons =
      plausible.length > 1 ? [`${plausible.length} similar businesses match the name and city`]
      : !googleChecked ? [manual ? "Your sources need a Google profile or your confirmation" : "Google lookup not done yet"]
      : places.length === 0 ? ["No Google profile found for this name and city"]
      : ["No Google profile matches both the name and the city"];
    return {
      level: "low",
      identity: plausible.length > 1 ? "ambiguous" : !googleChecked ? "not_checked" : places.length === 0 ? "none" : "mismatch",
      reasons,
    };
  }

  const site = has(["website"]);
  const social = has(["instagram", "facebook"]);
  const noSiteFound = f.some((x) => x.kind === "website" && !x.data?.origin && x.data?.checked);
  const contact = has(["contact"]) || !!best?.place.phone;
  const extra = input.identityConfirmed || !!best?.place.extra || site || social;

  const missing: string[] = [];
  if (!extra) missing.push("only the name and city match, nothing else confirms it yet");
  if (!site) missing.push(noSiteFound ? "no website found" : "website not verified");
  if (!site && !social) missing.push("social profiles not confirmed");
  if (!contact) missing.push("no contact found");

  const channels = site || (noSiteFound && social);
  if (extra && channels && contact) return { level: "high", identity: "confirmed", reasons: [] };
  return { level: "medium", identity: "confirmed", reasons: missing.length ? missing : ["some channels are not verified yet"] };
}

export async function loadAssessment(db: SupabaseClient, opportunityId: string, identityConfirmed: boolean) {
  const { data } = await db.from("research_findings").select("kind,verification,origin,data").eq("opportunity_id", opportunityId);
  return assess({ identityConfirmed, findings: (data ?? []) as FindingLite[] });
}
