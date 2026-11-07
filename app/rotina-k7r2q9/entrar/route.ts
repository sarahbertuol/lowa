import { NextResponse, type NextRequest } from "next/server";
import {
  ROTINA_BASE,
  ROTINA_COOKIE,
  checkPassword,
  createSessionToken,
  isConfigured,
  sessionCookieOptions,
} from "@/lib/rotina-auth";

/**
 * Login for the private panel. Rate limit: 5 failed attempts per IP in 15 minutes.
 * The counter lives in this function instance's memory (Fluid Compute reuses
 * instances), so it is a best-effort brake, not a global guarantee.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { n: number; reset: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function back(req: NextRequest, erro?: string) {
  const url = new URL(ROTINA_BASE, req.url);
  if (erro) url.searchParams.set("erro", erro);
  const res = NextResponse.redirect(url, 303);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return back(req, "config");

  const ip = clientIp(req);
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && entry.reset < now) fails.delete(ip);
  const current = fails.get(ip);
  if (current && current.n >= MAX_FAILS) return back(req, "limite");

  let password = "";
  try {
    const form = await req.formData();
    password = String(form.get("senha") ?? "");
  } catch {
    return back(req, "senha");
  }

  if (!(await checkPassword(password))) {
    fails.set(ip, { n: (current?.n ?? 0) + 1, reset: current?.reset ?? now + WINDOW_MS });
    return back(req, (current?.n ?? 0) + 1 >= MAX_FAILS ? "limite" : "senha");
  }

  fails.delete(ip);
  const res = back(req);
  res.cookies.set(ROTINA_COOKIE, await createSessionToken(), sessionCookieOptions);
  return res;
}
