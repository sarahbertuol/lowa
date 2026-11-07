/**
 * Server-side gate for the private routine panel (/rotina-k7r2q9).
 *
 * The password lives only in the PANEL_PASSWORD environment variable. A session
 * is a signed cookie "<expiry>.<hmac>", signed with that same password, so
 * changing the password ends every open session. Uses Web Crypto, so it runs
 * in route handlers and server components alike.
 */

export const ROTINA_BASE = "/rotina-k7r2q9";
export const ROTINA_COOKIE = "rt_sess";
export const ROTINA_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

const enc = new TextEncoder();

function secret(): string | null {
  const pw = process.env.PANEL_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

export function isConfigured(): boolean {
  return secret() !== null;
}

async function hmac(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
  let s = "";
  for (const b of sig) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Compares in constant time by hashing both sides first (hides the length too). */
export async function checkPassword(input: string): Promise<boolean> {
  const pw = secret();
  if (!pw) return false;
  const [a, b] = await Promise.all([hmac("rotina-pw", input), hmac("rotina-pw", pw)]);
  return safeEqual(a, b);
}

export async function createSessionToken(): Promise<string> {
  const pw = secret();
  if (!pw) throw new Error("PANEL_PASSWORD is not set");
  const exp = Date.now() + ROTINA_MAX_AGE * 1000;
  return `${exp}.${await hmac(pw, `rotina-session:${exp}`)}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  const pw = secret();
  if (!pw || !token) return false;
  const [exp, sig] = token.split(".");
  const expN = Number(exp);
  if (!exp || !sig || !Number.isFinite(expN) || expN < Date.now()) return false;
  return safeEqual(sig, await hmac(pw, `rotina-session:${exp}`));
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: ROTINA_BASE,
  maxAge: ROTINA_MAX_AGE,
};
