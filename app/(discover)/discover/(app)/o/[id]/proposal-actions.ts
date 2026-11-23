"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createUserClient } from "@/lib/engine/supabase/server";
import { requeueSteps, runResearch } from "@/lib/engine/research/runner";
import { copyCheck, type CopyIssue, type ProposalContent } from "@/lib/engine/proposal";
import { liveSnapshot, newToken, toPublic } from "@/lib/engine/publish";
import { loadAssessment } from "@/lib/engine/research/confidence";
import type { Template } from "@/lib/engine/research/insights";

/**
 * Proposal edits (OE-12). Every save is a new version; earlier versions stay. The price block
 * ("investment") is never taken from the form: it is copied from the version being edited,
 * which got it from the catalog.
 */

type Result = { ok: true; version: number; issues: CopyIssue[] } | { ok: false; error: string };

const t = (max: number) => z.string().trim().max(max);
const editable = z.object({
  hero: z.object({ headline: t(140).min(1), subline: t(240) }),
  opportunity: z.object({ title: t(100).min(1), body: z.array(t(700)).max(3) }),
  noticed: z.array(z.object({ title: t(120).min(1), saw: t(400), why: t(400), opportunity: t(400), source: t(160).optional() })).max(3),
  recommendation: z.object({ title: t(100).min(1), service: t(100), description: t(400), bullets: z.array(t(160)).max(6) }),
  nextStep: z.object({ title: t(100).min(1), body: t(400) }),
});

async function client() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function saveProposal(oppId: string, baseVersion: number, input: unknown): Promise<Result> {
  if (!z.uuid().safeParse(oppId).success || !Number.isInteger(baseVersion)) return { ok: false, error: "Invalid proposal." };
  const p = editable.safeParse(input);
  if (!p.success) return { ok: false, error: "Every title needs text, and each field has a length limit. Check and try again." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to save." };

  const { data: rows } = await db.from("proposals").select("version,template,service_slug,extra_pages,content")
    .eq("opportunity_id", oppId).order("version", { ascending: false }).limit(1);
  const last = rows?.[0];
  if (!last) return { ok: false, error: "There is no draft to edit yet." };
  if (last.version !== baseVersion) return { ok: false, error: `A newer version (v${last.version}) was saved in the meantime. Reload to edit it.` };

  const v = p.data;
  const content: ProposalContent = {
    ...v,
    opportunity: { ...v.opportunity, body: v.opportunity.body.filter(Boolean) },
    noticed: v.noticed.map((n) => ({ ...n, source: n.source || undefined })),
    recommendation: { ...v.recommendation, service: (last.content as ProposalContent).recommendation.service, bullets: v.recommendation.bullets.filter(Boolean) },
    investment: (last.content as ProposalContent).investment,
  };
  const version = last.version + 1;
  const { error } = await db.from("proposals").insert({
    opportunity_id: oppId, version, template: last.template, service_slug: last.service_slug,
    extra_pages: last.extra_pages, content, status: "draft",
  });
  if (error) return { ok: false, error: "Couldn't save. Try again." };
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true, version, issues: copyCheck(content) };
}

/** Writes a new draft from the latest analysis (and the current catalog price). */
export async function regenerateDraft(oppId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  const { data: busy } = await db.from("research_jobs").select("id").eq("opportunity_id", oppId).in("status", ["running", "queued"]).limit(1);
  if (busy?.length) return { ok: false, error: "The research is still running. Try again when it's done." };
  await requeueSteps(oppId, ["draft"]);
  await db.from("opportunities").update({ status: "researching" }).eq("id", oppId).in("status", ["captured", "needs_verification", "draft_ready"]);
  after(() => runResearch(oppId));
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}

/**
 * Publish (OE-13; the full review screen is OE-14). The founder's tap is the approval: the
 * latest version is frozen into a public snapshot. An opportunity has one live link: publishing
 * again keeps the same link and replaces what it shows. Blocked while the identity is LOW or the
 * copy check fails.
 */
export async function publishProposal(oppId: string, baseVersion: number): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(oppId).success || !Number.isInteger(baseVersion)) return { ok: false, error: "Invalid proposal." };
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again to publish." };

  const { data: o } = await supabase.from("opportunities").select("id,name,city,status,identity_confirmed").eq("id", oppId).maybeSingle();
  if (!o) return { ok: false, error: "Opportunity not found." };
  const a = await loadAssessment(supabase, oppId, o.identity_confirmed);
  if (a.level === "low" || o.status === "needs_verification") return { ok: false, error: "Confirm which business this is before publishing." };

  const { data: rows } = await supabase.from("proposals").select("id,version,template,content")
    .eq("opportunity_id", oppId).order("version", { ascending: false }).limit(1);
  const p = rows?.[0];
  if (!p) return { ok: false, error: "There is no draft to publish yet." };
  if (p.version !== baseVersion) return { ok: false, error: `A newer version (v${p.version}) exists. Reload before publishing.` };
  const content = p.content as ProposalContent;
  const issues = copyCheck(content);
  if (issues.length) return { ok: false, error: `Fix the ${issues.length} copy issue${issues.length > 1 ? "s" : ""} first.` };

  const publicContent = toPublic(content, { name: o.name, city: o.city }, p.template as Template);
  const now = new Date().toISOString();
  const live = await liveSnapshot(supabase, oppId);
  let token: string;
  if (live) {
    token = live.token;
    const { error } = await supabase.from("proposal_snapshots")
      .update({ proposal_id: p.id, public_content: publicContent, published_at: now }).eq("token", token);
    if (error) return { ok: false, error: "Couldn't publish. Try again." };
  } else {
    token = newToken();
    const { error } = await supabase.from("proposal_snapshots").insert({ token, proposal_id: p.id, public_content: publicContent, published_at: now });
    if (error) return { ok: false, error: "Couldn't publish. Try again." };
  }
  await supabase.from("proposals").update({ status: "draft" }).eq("opportunity_id", oppId).eq("status", "published").neq("id", p.id);
  await supabase.from("proposals").update({ status: "published", approved_by: user.id, approved_at: now }).eq("id", p.id);
  await supabase.from("opportunities").update({ status: "published" }).eq("id", oppId).in("status", ["captured", "draft_ready"]);
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true, token };
}

/** Unpublish: the link stops working right away (it answers 410). */
export async function unpublishProposal(oppId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!z.uuid().safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  const live = await liveSnapshot(db, oppId);
  if (!live) return { ok: false, error: "This proposal isn't published." };
  const { error } = await db.from("proposal_snapshots").update({ revoked_at: new Date().toISOString() }).eq("token", live.token);
  if (error) return { ok: false, error: "Couldn't unpublish. Try again." };
  await db.from("proposals").update({ status: "revoked" }).eq("opportunity_id", oppId).eq("status", "published");
  await db.from("opportunities").update({ status: "draft_ready" }).eq("id", oppId).eq("status", "published");
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}
