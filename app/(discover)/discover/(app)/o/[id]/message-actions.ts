"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { teamClient } from "@/lib/engine/supabase/team";
import { createAdminClient } from "@/lib/engine/supabase/admin";
import { KINDS } from "@/lib/engine/messages";
import { writeMessages } from "@/lib/engine/research/outreach";
import type { ProposalContent } from "@/lib/engine/proposal";

/**
 * Outreach messages (OE-15). The app prepares and copies; it never sends. Writes run as the
 * signed-in user (row level security), except writing the messages with the AI, which reads the
 * team list on the server.
 */

type Result = { ok: true } | { ok: false; error: string };
const uuid = z.uuid();
const kind = z.enum(KINDS);

/** Only team members (OE-16): a session alone is not enough. */
const client = teamClient;

export async function saveMessage(oppId: string, k: string, body: string): Promise<Result> {
  const v = z.object({ oppId: uuid, k: kind, body: z.string().trim().min(1).max(2000) }).safeParse({ oppId, k, body });
  if (!v.success) return { ok: false, error: "The message is empty or too long." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to save." };
  const { error } = await db.from("outreach_messages").upsert(
    { opportunity_id: oppId, kind: v.data.k, body: v.data.body, edited: true },
    { onConflict: "opportunity_id,kind" },
  );
  if (error) return { ok: false, error: "Couldn't save. Try again." };
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}

/** Records that a message was copied or shared (no content is sent anywhere). */
export async function markCopied(oppId: string, k: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success || !kind.safeParse(k).success) return { ok: false, error: "Invalid message." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  await db.from("outreach_messages").update({ copied_at: new Date().toISOString() }).eq("opportunity_id", oppId).eq("kind", k);
  return { ok: true };
}

/** "Mark as contacted": the database stamps the first contact date and logs it in History. */
export async function markContacted(oppId: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  const { error } = await db.from("opportunities").update({ status: "contacted" }).eq("id", oppId);
  if (error) return { ok: false, error: "Couldn't update the status. Try again." };
  revalidatePath("/discover");
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}

/** A business email the founder trusts (from a card, a talk). Counts as verified. */
export async function addEmail(oppId: string, email: string): Promise<Result> {
  const e = z.email().max(200).safeParse(email.trim().toLowerCase());
  if (!uuid.safeParse(oppId).success || !e.success) return { ok: false, error: "Enter a valid email, like name@business.com." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  const { error } = await db.from("research_findings").insert({
    opportunity_id: oppId, kind: "contact", finding: `Email you added: ${e.data}`, source_url: null,
    verification: "verified", confidence: "high", origin: "manual", data: { email: e.data, source: "founder" },
  });
  if (error) return { ok: false, error: "Couldn't save the email. Try again." };
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}

/** Writes the messages now from the latest draft (for drafts made before OE-15). */
export async function generateMessages(oppId: string): Promise<Result> {
  if (!uuid.safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again." };
  // Row level security: only the team can read this proposal.
  const { data: p } = await db.from("proposals").select("content").eq("opportunity_id", oppId)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (!p) return { ok: false, error: "Write the proposal draft first." };
  // Only for drafts made before OE-15: later the messages come with each draft (and its limit).
  const { count } = await db.from("outreach_messages").select("id", { count: "exact", head: true }).eq("opportunity_id", oppId);
  if (count) return { ok: false, error: "The messages are already written. Regenerate the draft to rewrite them." };
  try {
    await writeMessages(createAdminClient(), oppId, p.content as ProposalContent);
  } catch {
    return { ok: false, error: "Couldn't write the messages. Try again." };
  }
  revalidatePath(`/discover/o/${oppId}`);
  return { ok: true };
}
