import { after, NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/engine/supabase/server";
import { queueResearch, resetFailed, runResearch } from "@/lib/engine/research/runner";
import { STEPS, type Step } from "@/lib/engine/research/steps";

/**
 * Research for one opportunity (OE-06).
 * GET: step status for the progress screen. POST: start, or resume after a pause.
 * The signed-in user is checked with RLS; the pipeline itself runs after the response.
 */
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Ctx = { params: Promise<{ id: string }> };

async function allowed(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("opportunities").select("id,status").eq("id", id).maybeSingle();
  return data ? { supabase, opp: data } : null;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ok = await allowed(id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: jobs } = await ok.supabase
    .from("research_jobs")
    .select("step,status,attempts,error,result,finished_at")
    .eq("opportunity_id", id);
  const sorted = (jobs ?? []).sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  return NextResponse.json({ status: ok.opp.status, jobs: sorted }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ok = await allowed(id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { failStep?: string };
  // Test hook, never in production: forces one step to fail to check pause and resume.
  const failStep =
    process.env.VERCEL_ENV !== "production" && STEPS.includes(body.failStep as Step) ? (body.failStep as Step) : undefined;

  if (failStep) {
    // Test run starts from scratch so the failing step is actually reached.
    await ok.supabase.from("research_jobs").delete().eq("opportunity_id", id);
  }
  await queueResearch(id);
  await resetFailed(id);
  after(() => runResearch(id, { failStep }).catch((e) => console.error("research", id, e)));
  return NextResponse.json({ started: true }, { status: 202 });
}
