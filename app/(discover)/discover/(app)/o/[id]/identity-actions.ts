"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createUserClient } from "@/lib/engine/supabase/server";
import { requeueSteps, runResearch, settle } from "@/lib/engine/research/runner";
import { facebookPage, host, instagramHandle, isPlatform } from "@/lib/engine/research/match";
import { normalizeWebsite } from "@/lib/engine/capture";
import type { Step } from "@/lib/engine/research/steps";

/**
 * Identity and sources (OE-08). The founder picks the right business when the research found more
 * than one, or adds a source by hand. Writes run as the signed-in user (row level security); the
 * research that depends on the choice runs again in the background.
 */

const uuid = z.uuid();
type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}
type Db = NonNullable<Awaited<ReturnType<typeof client>>>;

function refresh(oppId: string) {
  revalidatePath("/discover");
  revalidatePath(`/discover/o/${oppId}`);
}

/** Runs the steps again after the response, when the research exists. */
async function rerun(db: Db, oppId: string, steps: Step[]) {
  const { count } = await db.from("research_jobs").select("id", { count: "exact", head: true }).eq("opportunity_id", oppId);
  if (!count) return false;
  await requeueSteps(oppId, steps);
  // Researching right away, so the screen that comes back shows the progress, not the old state.
  await db.from("opportunities").update({ status: "researching" }).eq("id", oppId).in("status", ["captured", "needs_verification"]);
  after(() => runResearch(oppId));
  return true;
}

type Parsed =
  | { kind: "instagram"; handle: string; url: string }
  | { kind: "facebook"; handle: string; url: string }
  | { kind: "google"; url: string }
  | { kind: "website"; url: string }
  | { kind: "note"; url: string };

function parseSource(raw: string): Parsed | null {
  const t = raw.trim();
  if (!t || t.length > 500) return null;
  if (/^@?[A-Za-z0-9._]{2,30}$/.test(t) && t.startsWith("@")) {
    const handle = t.slice(1).toLowerCase();
    return { kind: "instagram", handle, url: `https://www.instagram.com/${handle}/` };
  }
  let url: string;
  try {
    url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`).toString();
  } catch { return null; }
  if (!/^https?:\/\/[^/]+\.[a-z]{2,}/i.test(url)) return null;
  const ig = instagramHandle(url);
  if (ig) return { kind: "instagram", handle: ig, url: `https://www.instagram.com/${ig}/` };
  const fb = facebookPage(url);
  if (fb) return { kind: "facebook", handle: fb, url };
  const h = host(url);
  if (h === "maps.app.goo.gl" || h === "goo.gl" || h === "maps.google.com" || (h.endsWith("google.com") && /\/maps/.test(url))) return { kind: "google", url };
  if (isPlatform(url)) return { kind: "note", url };
  return { kind: "website", url: normalizeWebsite(url) };
}

const LABEL: Record<Parsed["kind"], string> = {
  instagram: "Instagram", facebook: "Facebook page", google: "Google profile", website: "Website", note: "Link",
};

/** Saves a source added by hand. Website and Instagram also become the business's own fields. */
async function saveSource(db: Db, oppId: string, raw: string): Promise<{ ok: true; steps: Step[] } | { ok: false; error: string }> {
  const s = parseSource(raw);
  if (!s) return { ok: false, error: "That doesn't look like a link or @handle." };
  const shown = s.kind === "instagram" ? `@${s.handle}` : s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const { error } = await db.from("research_findings").insert({
    opportunity_id: oppId,
    kind: s.kind,
    finding: `${LABEL[s.kind]} you added: ${shown}`,
    source_url: s.url,
    verification: "verified",
    confidence: "high",
    origin: "manual",
    data: { source: "capture", why: "You added it", ...("handle" in s ? { handle: s.handle } : {}) },
  });
  if (error) return { ok: false, error: "Couldn't save the source. Try again." };

  const steps: Step[] = [];
  if (s.kind === "website") {
    await db.from("opportunities").update({ website: s.url }).eq("id", oppId);
    steps.push("website", "social", "context");
  } else if (s.kind === "instagram") {
    await db.from("opportunities").update({ instagram: s.handle }).eq("id", oppId);
    steps.push("social");
  }
  return { ok: true, steps };
}

export async function addSource(oppId: string, raw: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to add a source." };
  const saved = await saveSource(db, oppId, raw);
  if (!saved.ok) return saved;
  // A new source can change the analysis (OE-09), so it runs again too.
  const reran = await rerun(db, oppId, [...saved.steps, "analysis", "draft"]);
  if (!reran) await settle(oppId);
  refresh(oppId);
  return { ok: true };
}

/**
 * "Change service" (OE-11): the founder's pick replaces the suggestion on the latest analysis
 * and stays when the analysis runs again. Only the id and page count are saved: the price is
 * always computed from the catalog.
 */
export async function chooseService(oppId: string, slug: string, extraPages: number): Promise<Result> {
  if (!uuid.safeParse(oppId).success || !/^[a-z0-9-]{1,80}$/.test(slug) || !Number.isInteger(extraPages) || extraPages < 0 || extraPages > 20) {
    return { ok: false, error: "Pick a service from the list." };
  }
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to change the service." };
  const { data: service } = await db.from("services").select("slug,active,price_type,extra_page_cents").eq("slug", slug).maybeSingle();
  if (!service?.active) return { ok: false, error: "That service is no longer offered. Reload and pick another." };
  const { data: a } = await db.from("analyses").select("id,dimensions").eq("opportunity_id", oppId)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (!a) return { ok: false, error: "Run the analysis first." };
  const perPage = service.extra_page_cents != null && service.price_type !== "custom";
  const { error } = await db.from("analyses").update({
    service_slug: slug,
    extra_pages: perPage ? extraPages : 0,
    dimensions: { ...(a.dimensions as Record<string, unknown>), serviceByFounder: true, serviceReason: "You chose this service." },
  }).eq("id", a.id);
  if (error) return { ok: false, error: "Couldn't save. Try again." };
  refresh(oppId);
  return { ok: true };
}

/** "Regenerate" (OE-09): a new analysis version from the same findings. Earlier versions stay. */
export async function regenerateAnalysis(oppId: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to regenerate." };
  const { data: running } = await db.from("research_jobs").select("id").eq("opportunity_id", oppId).in("status", ["running", "queued"]).limit(1);
  if (running?.length) return { ok: false, error: "The research is still running. Try again when it's done." };
  const reran = await rerun(db, oppId, ["analysis", "draft"]);
  if (!reran) return { ok: false, error: "Run the research first." };
  refresh(oppId);
  return { ok: true };
}

export async function removeSource(oppId: string, findingId: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success || !uuid.safeParse(findingId).success) return { ok: false, error: "Invalid source." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to remove a source." };
  const { error } = await db.from("research_findings").delete().eq("id", findingId).eq("opportunity_id", oppId).eq("origin", "manual");
  if (error) return { ok: false, error: "Couldn't remove the source. Try again." };
  await settle(oppId);
  refresh(oppId);
  return { ok: true };
}

const confirmSchema = z.object({
  candidate: z.number().int().min(0).max(9).nullable(),
  source: z.string().max(500).optional(),
});

/**
 * "Which one did you find?": the founder picks one Google profile, or none and adds a link.
 * Either way the identity counts as confirmed and the website, social and context steps run again.
 */
export async function confirmIdentity(oppId: string, input: { candidate: number | null; source?: string }): Promise<Result> {
  const parsed = confirmSchema.safeParse(input);
  if (!uuid.safeParse(oppId).success || !parsed.success) return { ok: false, error: "Pick one, or add a link." };
  const { candidate, source } = parsed.data;
  if (candidate === null && !source?.trim()) return { ok: false, error: "Pick one of them, or choose “Neither” and add a link you trust." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to confirm." };

  if (candidate !== null) {
    const { data: job } = await db.from("research_jobs").select("id,result").eq("opportunity_id", oppId).eq("step", "identity").maybeSingle();
    const result = (job?.result ?? null) as { summary?: string; data?: { candidates?: { name?: string; address?: string | null; extra?: string | null }[]; best?: number | null; ambiguous?: boolean } } | null;
    const cands = result?.data?.candidates ?? [];
    if (!job || candidate >= cands.length) return { ok: false, error: "That option is no longer there. Reload and try again." };
    const chosen = cands[candidate];
    cands[candidate] = { ...chosen, extra: chosen.extra ?? "picked by you" };
    await db.from("research_jobs").update({
      result: { ...result, summary: `You picked: ${chosen.address ?? chosen.name}.`, data: { ...result!.data, candidates: cands, best: candidate, ambiguous: false, picked: true } },
    }).eq("id", job.id);

    const { data: rows } = await db.from("research_findings").select("id,data").eq("opportunity_id", oppId).eq("kind", "google").eq("origin", "auto");
    for (const r of rows ?? []) {
      const d = (r.data ?? {}) as Record<string, unknown>;
      if (typeof d.candidate !== "number") continue;
      const mine = d.candidate === candidate;
      await db.from("research_findings").update({
        verification: mine ? "verified" : "rejected",
        confidence: mine ? "high" : "low",
        data: { ...d, best: mine, why: mine ? "You picked this one" : "You picked another one" },
      }).eq("id", r.id);
    }
  } else {
    // "Neither of these": every candidate is set aside.
    const { data: rows } = await db.from("research_findings").select("id,data").eq("opportunity_id", oppId).eq("kind", "google").eq("origin", "auto");
    for (const r of rows ?? []) {
      const d = (r.data ?? {}) as Record<string, unknown>;
      if (typeof d.candidate !== "number") continue;
      await db.from("research_findings").update({ verification: "rejected", data: { ...d, best: false, why: "You said it isn't this one" } }).eq("id", r.id);
    }
    const { data: job } = await db.from("research_jobs").select("id,result").eq("opportunity_id", oppId).eq("step", "identity").maybeSingle();
    if (job?.result) {
      const r = job.result as { data?: Record<string, unknown> };
      await db.from("research_jobs").update({ result: { ...r, summary: "You set the Google profiles aside.", data: { ...r.data, best: null, ambiguous: false, candidates: [] } } }).eq("id", job.id);
    }
  }

  if (source?.trim()) {
    const saved = await saveSource(db, oppId, source);
    if (!saved.ok) return saved;
  }

  const { error } = await db.from("opportunities").update({ identity_confirmed: true }).eq("id", oppId);
  if (error) return { ok: false, error: "Couldn't confirm. Try again." };
  const reran = await rerun(db, oppId, ["website", "social", "context", "analysis", "draft"]);
  if (!reran) await settle(oppId);
  refresh(oppId);
  return { ok: true };
}
