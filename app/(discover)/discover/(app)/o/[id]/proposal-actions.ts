"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createUserClient } from "@/lib/engine/supabase/server";
import { requeueSteps, runResearch } from "@/lib/engine/research/runner";
import { copyCheck, type CopyIssue, type ProposalContent } from "@/lib/engine/proposal";

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
