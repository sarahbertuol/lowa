import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProposalContent } from "@/lib/engine/proposal";
import type { Template } from "@/lib/engine/research/insights";

/**
 * Public proposal (OE-13). What the client sees is a frozen copy ("snapshot") of one proposal
 * version: the six sections, the business name and city, and the price already computed.
 * Nothing from the research, notes, confidence or contact details goes in here.
 */

export const PROPOSAL_EMAIL = "hello@lowa-studio.com";
export const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export type PublicProposal = ProposalContent & {
  v: 1;
  business: { name: string; city: string };
  template: Template;
  contactEmail: string;
};

/** 128 random bits in base64url: 22 characters. */
export const newToken = () => randomBytes(16).toString("base64url");

/** Builds the public copy from a proposal version. Only whitelisted fields are copied. */
export function toPublic(c: ProposalContent, business: { name: string; city: string }, template: Template): PublicProposal {
  return {
    v: 1,
    business: { name: business.name, city: business.city },
    template,
    contactEmail: PROPOSAL_EMAIL,
    hero: { headline: c.hero.headline, subline: c.hero.subline },
    opportunity: { title: c.opportunity.title, body: [...c.opportunity.body] },
    noticed: c.noticed.map((n) => ({ title: n.title, saw: n.saw, why: n.why, opportunity: n.opportunity, ...(n.source ? { source: n.source } : {}) })),
    recommendation: { title: c.recommendation.title, service: c.recommendation.service, description: c.recommendation.description, bullets: [...c.recommendation.bullets] },
    investment: { ...c.investment, notIncluded: [...c.investment.notIncluded] },
    nextStep: { title: c.nextStep.title, body: c.nextStep.body },
  };
}

/** The opportunity's link that still works (not revoked, not expired), if any. */
export async function liveSnapshot(db: SupabaseClient, oppId: string) {
  const { data: ids } = await db.from("proposals").select("id").eq("opportunity_id", oppId);
  if (!ids?.length) return null;
  const { data } = await db.from("proposal_snapshots").select("token,published_at,expires_at,proposal_id")
    .in("proposal_id", ids.map((r) => r.id)).is("revoked_at", null).gt("expires_at", new Date().toISOString())
    .order("published_at", { ascending: false }).limit(1);
  return data?.[0] ?? null;
}

export type SnapshotRead =
  | { state: "ok"; content: PublicProposal; publishedAt: string; expiresAt: string }
  | { state: "gone"; why: "revoked" | "expired" }
  | { state: "missing" };

/** Reads one snapshot by token (service role, public columns only). */
export async function readSnapshot(db: SupabaseClient, token: string): Promise<SnapshotRead> {
  if (!TOKEN_RE.test(token)) return { state: "missing" };
  const { data } = await db.from("proposal_snapshots").select("public_content,published_at,expires_at,revoked_at")
    .eq("token", token).maybeSingle();
  if (!data) return { state: "missing" };
  if (data.revoked_at) return { state: "gone", why: "revoked" };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { state: "gone", why: "expired" };
  return { state: "ok", content: data.public_content as PublicProposal, publishedAt: data.published_at, expiresAt: data.expires_at };
}
