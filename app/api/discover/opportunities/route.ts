import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/engine/supabase/server";
import { captureSchema, plausibleCaptureTime } from "@/lib/engine/capture";

/**
 * Saves a captured opportunity (OE-04). Multipart body: `data` (JSON) and optional `photo` (JPG,
 * already resized on the phone). Idempotent by `client_ref`: the offline queue can retry safely.
 * Runs as the signed-in user, so row level security applies.
 */
const MAX_PHOTO = 4 * 1024 * 1024;
const BUCKET = "opportunity-photos";

export async function POST(request: Request) {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = captureSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const { client_ref, captured_at, ...fields } = parsed.data;

  const photo = form.get("photo");
  if (photo instanceof File && (photo.size > MAX_PHOTO || !photo.type.startsWith("image/"))) {
    return NextResponse.json({ error: "photo_invalid" }, { status: 400 });
  }

  // Insert once; a retry with the same client_ref finds the existing row.
  const row = { client_ref, ...fields, ...(plausibleCaptureTime(captured_at) ? { captured_at: plausibleCaptureTime(captured_at) } : {}) };
  const insert = await supabase.from("opportunities").upsert(row, { onConflict: "client_ref", ignoreDuplicates: true });
  if (insert.error) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  const { data: opp, error: readError } = await supabase
    .from("opportunities").select("id").eq("client_ref", client_ref).single();
  if (readError || !opp) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  if (photo instanceof File && photo.size > 0) {
    const path = `${opp.id}/${client_ref}.jpg`;
    const up = await supabase.storage.from(BUCKET).upload(path, photo, { contentType: "image/jpeg", upsert: false });
    const exists = up.error && /exists|duplicate/i.test(up.error.message);
    if (up.error && !exists) return NextResponse.json({ error: "photo_failed" }, { status: 500 });
    const link = await supabase
      .from("opportunity_photos")
      .upsert({ opportunity_id: opp.id, storage_path: path }, { onConflict: "storage_path", ignoreDuplicates: true });
    if (link.error) return NextResponse.json({ error: "photo_failed" }, { status: 500 });
  }

  // Research starts here once OE-06 exists; until then the opportunity stays "captured".
  return NextResponse.json({ id: opp.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
