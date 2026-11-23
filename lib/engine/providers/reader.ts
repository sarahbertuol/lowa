import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Page, PageLink, PageReader, ReadResult } from "./types";

/**
 * Server-side page reader (docs/ARQUITETURA.md, Segurança):
 * - only http and https on the default ports; no private, local or reserved addresses (checked
 *   for every address the name resolves to, and again on every redirect);
 * - 8 s time limit and 2 MB maximum per page; only HTML;
 * - respects robots.txt (our agent name or *);
 * - never reads Instagram, Facebook or other platforms that need a login: those come only from
 *   the link given or from public search results.
 * Known limit: the address is checked before the request, not pinned (DNS rebinding); the
 * reader only follows public business websites and keeps nothing it can't parse as HTML.
 */

export const USER_AGENT = "LoWaBot/1.0 (+https://lowa-studio.com)";
const AGENT_TOKEN = "lowabot";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;

const NO_READ_HOSTS = [
  "instagram.com", "facebook.com", "fb.com", "tiktok.com", "x.com", "twitter.com", "linkedin.com",
  "threads.net", "pinterest.com", "youtube.com", "google.com", "goo.gl", "yelp.com",
];

export const hostOf = (url: string) => {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};
const onHost = (host: string, list: string[]) => list.some((h) => host === h || host.endsWith(`.${h}`));

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}
function privateIp(ip: string): boolean {
  if (isIP(ip) === 4) return privateV4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return privateV4(mapped[1]);
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || /^ff/.test(v6) || v6.startsWith("64:ff9b") || v6.startsWith("2001:db8");
}

/** Throws a "not_allowed" reason when the URL must not be fetched. */
async function guard(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Refused("not_allowed", "Invalid address"); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Refused("not_allowed", "Only http and https");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Refused("not_allowed", "Non-standard port");
  if (u.username || u.password) throw new Refused("not_allowed", "Credentials in address");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(local|localhost|internal|lan|home|corp)$/.test(host) || !host.includes(".") && !isIP(host)) {
    throw new Refused("not_allowed", "Local address");
  }
  if (onHost(host.replace(/^www\./, ""), NO_READ_HOSTS)) throw new Refused("not_allowed", "Platform pages are not read");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Refused("network", "Address not found");
  if (addrs.some((a) => privateIp(a.address))) throw new Refused("not_allowed", "Private address");
  return u;
}

type Reason = Exclude<ReadResult, { ok: true }>["reason"];
class Refused extends Error {
  reason: Reason;
  constructor(reason: Reason, detail: string) { super(detail); this.reason = reason; }
}

/** GET with manual redirects (each hop guarded), time limit and size limit. */
async function get(raw: string, maxBytes: number, deadline: number) {
  let url = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = await guard(url);
    const left = deadline - Date.now();
    if (left <= 0) throw new Refused("timeout", "Took longer than 8 s");
    const res = await fetch(u, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,text/plain;q=0.8" },
      signal: AbortSignal.timeout(left),
      cache: "no-store",
    }).catch((e: unknown) => {
      const name = e instanceof Error ? e.name : "";
      throw name === "TimeoutError" || name === "AbortError" ? new Refused("timeout", "Took longer than 8 s") : new Refused("network", "Could not connect");
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, u).toString();
      await res.body?.cancel();
      continue;
    }
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > maxBytes) { await res.body?.cancel(); throw new Refused("too_large", "Page over 2 MB"); }

    const chunks: Uint8Array[] = [];
    let size = 0;
    let truncated = false;
    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read().catch(() => { throw new Refused("timeout", "Took longer than 8 s"); });
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { truncated = true; await reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const body = Buffer.concat(chunks).toString("utf8");
    return { url: u.toString(), status: res.status, type: res.headers.get("content-type") ?? "", body, bytes: Math.min(size, maxBytes), truncated };
  }
  throw new Refused("http_error", "Too many redirects");
}

/* ---------------------------------------------------------------- robots.txt */

const robotsCache = new Map<string, { at: number; rules: { allow: boolean; path: string }[] }>();

function parseRobots(txt: string) {
  // Groups: consecutive user-agent lines followed by rules. Our token wins over "*".
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const line of txt.split(/\r?\n/)) {
    const m = line.replace(/#.*/, "").match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === "user-agent") {
      if (!lastWasAgent || !current) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(m[2].toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (key === "allow" || key === "disallow")) current.rules.push({ allow: key === "allow", path: m[2] });
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a === AGENT_TOKEN));
  const pick = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return pick.flatMap((g) => g.rules);
}

function pathMatches(rule: string, path: string) {
  if (!rule) return false;
  const re = new RegExp("^" + rule.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*").replace(/\\\$$/, "$"));
  return re.test(path);
}

async function allowedByRobots(u: URL, deadline: number): Promise<boolean> {
  const origin = u.origin;
  let entry = robotsCache.get(origin);
  if (!entry || Date.now() - entry.at > 3600_000) {
    let rules: { allow: boolean; path: string }[] = [];
    try {
      const r = await get(`${origin}/robots.txt`, 256 * 1024, Math.min(deadline, Date.now() + 4000));
      if (r.status >= 200 && r.status < 300) rules = parseRobots(r.body);
      // 4xx: no rules (allowed). 5xx or network: treat as allowed for a single public home page read.
    } catch { /* no robots.txt reachable */ }
    entry = { at: Date.now(), rules };
    robotsCache.set(origin, entry);
  }
  const path = u.pathname + u.search;
  let best: { allow: boolean; path: string } | null = null;
  for (const r of entry.rules) {
    if (pathMatches(r.path, path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

/* ---------------------------------------------------------------- HTML */

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const clean = (s: string) => decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

function meta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? clean(content) : null;
}

function parse(url: string, html: string): Omit<Page, "status" | "ms" | "bytes" | "truncated"> {
  const links: PageLink[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let href: string;
    try { href = new URL(decode(m[1]), url).toString(); } catch { continue; }
    if (seen.has(href) || links.length >= 300) continue;
    seen.add(href);
    links.push({ href, text: clean(m[2]).slice(0, 80) });
  }
  const body = html.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  return {
    url,
    title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || null,
    description: meta(html, "description") ?? meta(html, "og:description"),
    h1: clean(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || null,
    generator: meta(html, "generator"),
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    links,
    text: clean(body).slice(0, 12000),
    html: html.slice(0, 400_000),
  };
}

export const pageReader: PageReader = {
  async read(url) {
    const started = Date.now();
    const deadline = started + TIMEOUT_MS;
    try {
      const u = await guard(url);
      if (!(await allowedByRobots(u, deadline))) return { ok: false, reason: "blocked_by_robots", detail: "robots.txt asks robots not to read this page" };
      const r = await get(u.toString(), MAX_BYTES, deadline);
      if (r.status >= 400) return { ok: false, reason: "http_error", detail: `The page answered ${r.status}` };
      if (!/html|text\/plain/i.test(r.type)) return { ok: false, reason: "not_html", detail: "Not a web page" };
      const page = parse(r.url, r.body);
      return { ok: true, page: { ...page, status: r.status, ms: Date.now() - started, bytes: r.bytes, truncated: r.truncated } };
    } catch (e) {
      if (e instanceof Refused) return { ok: false, reason: e.reason, detail: e.message };
      return { ok: false, reason: "network", detail: "Could not read the page" };
    }
  },
};
