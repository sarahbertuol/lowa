import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/engine/supabase/server";

/** Who is signed in. The middleware already answers 401 without a session. */
export async function GET() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ email: user.email }, { headers: { "Cache-Control": "no-store" } });
}
