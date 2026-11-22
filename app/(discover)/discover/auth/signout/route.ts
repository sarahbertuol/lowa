import { NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/engine/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createUserClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/discover/login", request.url), { status: 303 });
}
