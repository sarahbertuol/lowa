import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/engine/supabase/server";
import { safeNext } from "@/lib/engine/auth";

/**
 * Link from the sign-in email. Preferred template link (works on any browser):
 *   {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
 * Fallback for Supabase's default template (?code=...): only works in the browser that asked for it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const type = (params.get("type") ?? "email") as EmailOtpType;
  const next = safeNext(params.get("next"));

  if (tokenHash || code) {
    const supabase = await createUserClient();
    const { error } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : await supabase.auth.exchangeCodeForSession(code!);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/discover/login?error=link", request.url));
}
