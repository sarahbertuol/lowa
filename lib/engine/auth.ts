import { headers } from "next/headers";

/** Only paths inside the app are valid "next" targets after login (no open redirects). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/discover") || next.startsWith("//") || next.includes("\\")) return "/discover";
  return next;
}

/** Origin of the current request (production domain or the preview URL being tested). */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function normalizeEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}
