"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createUserClient } from "@/lib/engine/supabase/server";
import { MANUAL_STATUSES, type Status } from "@/lib/engine/status";

/** Detail actions (OE-05). Run as the signed-in user: row level security applies. */

const id = z.uuid();
type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function refresh(oppId: string) {
  revalidatePath("/discover");
  revalidatePath(`/discover/o/${oppId}`);
}

/** One tap: sets a follow-up status. The database logs the change and stamps the first contact date. */
export async function setStatus(oppId: string, status: Status): Promise<Result> {
  if (!id.safeParse(oppId).success || !MANUAL_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sign in again to change the status." };
  const { error } = await supabase.from("opportunities").update({ status }).eq("id", oppId);
  if (error) return { ok: false, error: "Couldn't change the status. Try again." };
  refresh(oppId);
  return { ok: true };
}

export async function saveNotes(oppId: string, notes: string): Promise<Result> {
  const parsed = z.string().max(4000).safeParse(notes);
  if (!id.safeParse(oppId).success || !parsed.success) return { ok: false, error: "Notes are too long." };
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sign in again to save notes." };
  const value = parsed.data.trim() || null;
  const { error } = await supabase.from("opportunities").update({ notes: value }).eq("id", oppId);
  if (error) return { ok: false, error: "Couldn't save the notes. Try again." };
  refresh(oppId);
  return { ok: true };
}

/** Deletes the opportunity, its photos in Storage and everything linked to it (cascade). */
export async function deleteOpportunity(oppId: string): Promise<Result> {
  if (!id.safeParse(oppId).success) return { ok: false, error: "Invalid opportunity." };
  const supabase = await client();
  if (!supabase) return { ok: false, error: "Sign in again to delete." };

  const { data: photos } = await supabase.from("opportunity_photos").select("storage_path").eq("opportunity_id", oppId);
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length) {
    const { error } = await supabase.storage.from("opportunity-photos").remove(paths);
    if (error) return { ok: false, error: "Couldn't delete the photos. Nothing was deleted." };
  }
  const { error } = await supabase.from("opportunities").delete().eq("id", oppId);
  if (error) return { ok: false, error: "Couldn't delete. Try again." };
  revalidatePath("/discover");
  return { ok: true };
}
