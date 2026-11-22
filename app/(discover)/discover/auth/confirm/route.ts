import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/engine/supabase/server";
import { safeNext } from "@/lib/engine/auth";

/** Link from the sign-in email: {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = (params.get("type") ?? "email") as EmailOtpType;
  const next = safeNext(params.get("next"));

  if (tokenHash) {
    const supabase = await createUserClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/discover/login?error=link", request.url));
}
