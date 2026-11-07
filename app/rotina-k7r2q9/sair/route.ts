import { NextResponse, type NextRequest } from "next/server";
import { ROTINA_BASE, ROTINA_COOKIE, sessionCookieOptions } from "@/lib/rotina-auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL(ROTINA_BASE, req.url), 303);
  res.cookies.set(ROTINA_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
