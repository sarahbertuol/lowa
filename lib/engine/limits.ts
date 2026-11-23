import { createAdminClient } from "@/lib/engine/supabase/admin";

/**
 * Usage limit for the paid research (OE-16): AI, web search and Google. Every research run,
 * re-run and new analysis or draft moves the opportunity to "researching", and the database logs
 * that in status_history (written by a trigger, never by the app), so that log is the meter.
 * Counted for the whole team. About US$ 0.15 per full research (OE-07): 60 a day is about US$ 9.
 * Sarah can change the numbers here.
 */
export const AI_LIMIT = { hour: 20, day: 60 };

export type LimitResult = { ok: true } | { ok: false; error: string };

export async function aiRunAllowed(): Promise<LimitResult> {
  const db = createAdminClient();
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const count = async (ms: number) => {
    const { count, error } = await db.from("status_history").select("id", { count: "exact", head: true })
      .eq("to_status", "researching").gte("changed_at", since(ms));
    if (error) throw new Error(`limit: ${error.message}`);
    return count ?? 0;
  };
  const [hour, day] = await Promise.all([count(3_600_000), count(86_400_000)]);
  if (day >= AI_LIMIT.day) return { ok: false, error: `Daily research limit reached (${AI_LIMIT.day}). It frees up over the next 24 hours.` };
  if (hour >= AI_LIMIT.hour) return { ok: false, error: `Hourly research limit reached (${AI_LIMIT.hour}). Try again in a little while.` };
  return { ok: true };
}
