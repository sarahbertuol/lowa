import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Step } from "./steps";
import { replaceFindings, type Confidence, type NewFinding } from "./findings";
import {
  digits, facebookPage, host, instagramHandle, isPlatform, sameCity, sameHost, sameName, samePhone, storeFrom, tokens,
} from "./match";
import { addUsage, emptyUsage, type Page, type Place, type PhotoReading, type SearchResult, type Usage } from "@/lib/engine/providers/types";
import { googlePlaces, PlacesNotConfigured } from "@/lib/engine/providers/places";
import { webSearch } from "@/lib/engine/providers/search";
import { pageReader } from "@/lib/engine/providers/reader";
import { claudeVision } from "@/lib/engine/providers/vision";
import { structured } from "@/lib/engine/providers/ai";

/**
 * What each step does (OE-07). Each step saves its findings (replacing its own earlier ones) and
 * returns a short summary plus the data the next steps need. Analysis and drafts arrive in
 * OE-09 and OE-12. A handler must be idempotent: running it twice gives the same saved result.
 */

export type StepContext = {
  db: SupabaseClient;
  opportunity: { id: string; name: string; city: string; website: string | null; instagram: string | null; category: string | null };
  photoCount: number;
  /** Results of the steps already done, by step. */
  previous: Partial<Record<Step, StepResult>>;
};

export type StepResult = { summary: string; skipped?: boolean; data?: unknown; usage?: Usage };

type PhotoData = { reading: PhotoReading };
type IdentityData = { candidates: (Place & { nameMatch: boolean; cityMatch: boolean; extra: string | null })[]; best: number | null; ambiguous: boolean; skippedReason?: string };
type WebsiteData = {
  url: string | null;
  origin: "capture" | "google" | "photo" | "search" | null;
  verified: boolean;
  social: { instagram: string[]; facebook: string[] };
  search?: SearchResult[];
};

const data = <T>(r: StepResult | undefined) => r?.data as T | undefined;

export async function runStep(step: Step, ctx: StepContext): Promise<StepResult> {
  switch (step) {
    case "photo": return photo(ctx);
    case "identity": return identity(ctx);
    case "website": return website(ctx);
    case "social": return social(ctx);
    case "context": return context(ctx);
    case "analysis": return { summary: "Opportunity analysis arrives in OE-09.", skipped: true };
    case "draft": return { summary: "Proposal draft arrives in OE-12.", skipped: true };
  }
}

/* ---------------------------------------------------------------- photo */

async function photo(ctx: StepContext): Promise<StepResult> {
  if (ctx.photoCount === 0) return { summary: "No photo added.", skipped: true };
  const { data: rows } = await ctx.db.from("opportunity_photos").select("id,storage_path")
    .eq("opportunity_id", ctx.opportunity.id).order("created_at").limit(3);
  const images: { data: Buffer; mediaType: "image/jpeg" | "image/png" | "image/webp" }[] = [];
  for (const r of rows ?? []) {
    const { data: blob } = await ctx.db.storage.from("opportunity-photos").download(r.storage_path);
    if (!blob) continue;
    const type = blob.type === "image/png" || blob.type === "image/webp" ? blob.type : "image/jpeg";
    images.push({ data: Buffer.from(await blob.arrayBuffer()), mediaType: type });
  }
  if (!images.length) return { summary: "Photo couldn't be opened.", skipped: true };

  const { reading, usage } = await claudeVision.readPhotos(images);
  await ctx.db.from("opportunity_photos").update({ extracted: reading }).eq("opportunity_id", ctx.opportunity.id);

  const got = [
    reading.business_name && `name "${reading.business_name}"`,
    reading.website && `website ${reading.website}`,
    reading.instagram && `Instagram @${reading.instagram.replace(/^@/, "")}`,
    reading.phone && `phone ${reading.phone}`,
    reading.email && `email ${reading.email}`,
  ].filter(Boolean) as string[];

  await replaceFindings(ctx.db, ctx.opportunity.id, "photo", [{
    kind: "photo",
    finding: `${reading.what_it_shows}${got.length ? `. Shows ${got.join(", ")}.` : ". No name, link or contact legible."}`,
    source: "photo",
    verification: "unverified",
    confidence: "low",
    why: "Read from a photo: a suggestion until another source confirms it",
    data: { reading },
  }]);

  return {
    summary: got.length ? `Your photo shows ${got.slice(0, 3).join(", ")}.` : "Nothing legible on the photo.",
    data: { reading } satisfies PhotoData,
    usage: addUsage(emptyUsage(), usage),
  };
}

/* ---------------------------------------------------------------- identity (Google profile) */

async function identity(ctx: StepContext): Promise<StepResult> {
  const o = ctx.opportunity;
  const reading = data<PhotoData>(ctx.previous.photo)?.reading;
  let places: Place[];
  let usage = emptyUsage();
  try {
    const r = await googlePlaces.search(`${o.name}, ${o.city}`);
    places = r.places;
    usage = addUsage(usage, r.usage);
  } catch (e) {
    if (e instanceof PlacesNotConfigured) {
      await replaceFindings(ctx.db, o.id, "identity", []);
      return {
        summary: "Google lookup skipped: the Google key isn't set yet.",
        skipped: true,
        data: { candidates: [], best: null, ambiguous: false, skippedReason: "no_key" } satisfies IdentityData,
      };
    }
    throw e;
  }

  const candidates = places.map((p) => {
    const nameMatch = sameName(o.name, p.name);
    const cityMatch = sameCity(o.city, p.city, p.address);
    const extra =
      samePhone(p.phone, reading?.phone) ? "phone matches your photo"
      : sameHost(p.website, o.website) ? "website matches what you entered"
      : sameHost(p.website, reading?.website) ? "website matches your photo"
      : null;
    return { ...p, nameMatch, cityMatch, extra };
  });
  const plausible = candidates.filter((c) => c.nameMatch && c.cityMatch);
  const withExtra = plausible.filter((c) => c.extra);
  const best = withExtra.length === 1 ? candidates.indexOf(withExtra[0])
    : plausible.length === 1 ? candidates.indexOf(plausible[0]) : null;
  const ambiguous = plausible.length > 1 && withExtra.length !== 1;

  const findings: NewFinding[] = candidates.map((c, i) => {
    const confidence: Confidence = c.nameMatch && c.cityMatch ? (c.extra ? "high" : "medium") : "low";
    const parts = [
      c.address,
      c.phone && `phone ${c.phone}`,
      c.website ? `website ${host(c.website)}` : "no website on the profile",
      c.rating != null && `${c.rating.toFixed(1)} stars (${c.reviews ?? 0} reviews)`,
      c.status && c.status !== "OPERATIONAL" && c.status.toLowerCase().replace(/_/g, " "),
    ].filter(Boolean);
    return {
      kind: "google",
      finding: `Google profile "${c.name}"${c.type ? `, ${c.type}` : ""}: ${parts.join(", ")}.`,
      source: "google_places",
      sourceUrl: c.mapsUrl,
      verification: c.nameMatch && c.cityMatch && c.extra ? "verified" : "unverified",
      confidence,
      why: !c.nameMatch ? "Name doesn't match" : !c.cityMatch ? "City doesn't match"
        : c.extra ? `Name, city and ${c.extra}` : i === best && !ambiguous ? "Name and city match, nothing else to cross-check yet" : "One of several similar profiles",
      data: { place: c, candidate: i, best: i === best },
    };
  });
  if (!candidates.length) {
    findings.push({
      kind: "google", finding: `No Google profile found for "${o.name}" in ${o.city}.`, source: "google_places",
      verification: "unverified", confidence: "low", why: `Searched Google for "${o.name}, ${o.city}"`, data: { query: `${o.name}, ${o.city}` },
    });
  }
  await replaceFindings(ctx.db, o.id, "identity", findings);

  const b = best != null ? candidates[best] : null;
  const summary = b
    ? `Google profile found: ${b.address ?? b.name}${b.rating != null ? `, ${b.rating.toFixed(1)} stars` : ""}.`
    : ambiguous ? `${plausible.length} similar Google profiles. You'll choose the right one.`
    : candidates.length ? "No Google profile clearly matches the name and city."
    : "No Google profile found.";
  return { summary, data: { candidates, best, ambiguous } satisfies IdentityData, usage };
}

/* ---------------------------------------------------------------- website */

const GENERIC = new Set(["coffee", "cafe", "bakery", "studio", "restaurant", "bar", "grill", "kitchen", "salon", "boutique", "market", "design", "shop", "store", "brewing", "roasters"]);

/** True when the site address contains the business name (or its distinctive words). */
export function hostCarriesName(name: string, url: string) {
  const base = host(url).split(".").slice(0, -1).join("").replace(/[^a-z0-9]/g, "");
  const all = tokens(name);
  if (!base || !all.length) return false;
  if (base.includes(all.join("")) || (all.length > 1 && base.includes(all.slice(0, 2).join("")))) return true;
  const distinct = all.filter((t) => t.length >= 3 && !GENERIC.has(t));
  if (!distinct.length) return false;
  const hits = distinct.filter((t) => base.includes(t)).length;
  // One or two distinctive words: all of them; more: at least half.
  return hits >= (distinct.length <= 2 ? distinct.length : Math.ceil(distinct.length / 2));
}

const usPhone = (p: string) => {
  const d = digits(p);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
};

const PAGE_HINTS = /(contact|about|our-story|story|menu|services|service|shop|store|order|book|booking|appointments|products|catalog|pricing|visit|locations?)/i;
const BOOKING = [["calendly.com", "Calendly"], ["squareup.com/appointments", "Square Appointments"], ["vagaro.com", "Vagaro"], ["mindbodyonline.com", "Mindbody"], ["opentable.com", "OpenTable"], ["resy.com", "Resy"], ["booksy.com", "Booksy"], ["acuityscheduling.com", "Acuity"], ["fresha.com", "Fresha"], ["toasttab.com", "Toast"]] as const;

function signals(pages: Page[]) {
  const all = pages.flatMap((p) => p.links);
  const emails = new Set<string>();
  const phones = new Set<string>();
  for (const l of all) {
    if (l.href.startsWith("mailto:")) emails.add(decodeURIComponent(l.href.slice(7).split("?")[0]).toLowerCase());
    if (l.href.startsWith("tel:")) phones.add(decodeURIComponent(l.href.slice(4)).trim());
  }
  for (const p of pages) for (const m of p.text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) emails.add(m[0].toLowerCase());
  const html = pages.map((p) => p.html).join("\n").toLowerCase();
  const store =
    html.includes("cdn.shopify.com") ? "Shopify" : html.includes("woocommerce") ? "WooCommerce"
    : html.includes("squarespace-commerce") || html.includes("sqs-add-to-cart") ? "Squarespace Commerce"
    : html.includes("ecwid") ? "Ecwid" : html.includes("wix-ecommerce") || html.includes("wixstores") ? "Wix Stores"
    : all.some((l) => /\/(cart|checkout)\b/i.test(l.href)) ? "Online store" : null;
  const booking = BOOKING.find(([h]) => all.some((l) => l.href.includes(h)) || html.includes(h))?.[1] ?? null;
  const gen = pages.map((p) => p.generator ?? "").find((g) => /wordpress|wix|squarespace|shopify|webflow|godaddy|weebly|joomla|drupal|duda|framer/i.test(g))?.replace(/\s+[\d.]+$/, "") ?? null;
  const platform = gen ?? (html.includes("wixstatic.com") ? "Wix" : html.includes("squarespace.com") ? "Squarespace" : html.includes("wp-content") ? "WordPress" : html.includes("godaddy") ? "GoDaddy" : null);
  return {
    emails: [...emails].filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !e.includes("sentry") && !e.includes("example.")).slice(0, 3),
    phones: [...phones].slice(0, 3),
    instagram: [...new Set(all.map((l) => instagramHandle(l.href)).filter(Boolean) as string[])].slice(0, 3),
    facebook: [...new Set(all.map((l) => facebookPage(l.href)).filter(Boolean) as string[])].slice(0, 3),
    store, booking, platform,
  };
}

async function website(ctx: StepContext): Promise<StepResult> {
  const o = ctx.opportunity;
  const reading = data<PhotoData>(ctx.previous.photo)?.reading;
  const id = data<IdentityData>(ctx.previous.identity);
  const best = id?.best != null ? id.candidates[id.best] : null;
  let usage = emptyUsage();

  let url: string | null = null;
  let origin: WebsiteData["origin"] = null;
  let search: SearchResult[] | undefined;
  const norm = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
  if (o.website) { url = norm(o.website); origin = "capture"; }
  else if (best?.website && !isPlatform(best.website)) { url = best.website; origin = "google"; }
  else if (reading?.website && !isPlatform(norm(reading.website))) { url = norm(reading.website); origin = "photo"; }
  else {
    const r = await webSearch.search({
      city: o.city,
      question: `Find the official website and the Instagram and Facebook pages of the business "${o.name}" in ${o.city}. List the links you found.`,
    });
    usage = addUsage(usage, r.usage);
    search = r.results;
    // The address itself must carry the name: a news or list site that mentions the business is not its website.
    const cand = r.results.find((x) => !isPlatform(x.url) && !storeFrom(x.url) && hostCarriesName(o.name, x.url));
    if (cand) { url = new URL(cand.url).origin; origin = "search"; }
  }

  const base: WebsiteData = { url, origin, verified: false, social: { instagram: [], facebook: [] }, search };
  if (!url) {
    const checked = ["what you entered", best ? "the Google profile" : "Google", reading ? "your photo" : null, "a web search"].filter(Boolean).join(", ");
    await replaceFindings(ctx.db, o.id, "website", [{
      kind: "website", finding: `No website found. Checked ${checked}.`, source: "web_search",
      verification: "unverified", confidence: "medium", why: "A website may still exist: add it if you know it", data: { checked },
    }]);
    return { summary: "No website found.", data: base, usage };
  }

  const home = await pageReader.read(url);
  usage = addUsage(usage, { pagesRead: 1 });
  const fromLabel = { capture: "you entered it", google: "listed on the Google profile", photo: "from your photo", search: "found in a web search" }[origin!];
  if (!home.ok) {
    await replaceFindings(ctx.db, o.id, "website", [{
      kind: "website", finding: `Website ${host(url)} (${fromLabel}) couldn't be read: ${home.detail}.`,
      source: origin === "capture" ? "capture" : origin === "google" ? "google_places" : origin === "photo" ? "photo" : "web_search",
      sourceUrl: url, verification: "unverified", confidence: "low", why: home.reason === "blocked_by_robots" ? "The site asks robots not to read it" : home.detail,
      data: { reason: home.reason },
    }]);
    return { summary: `Website ${host(url)} couldn't be read.`, data: base, usage };
  }

  // Up to 3 inside pages that say the most about the business.
  const siteHost = host(home.page.url);
  const inner = home.page.links
    .filter((l) => host(l.href) === siteHost && l.href.replace(/[#?].*$/, "") !== home.page.url.replace(/[#?].*$/, "") && PAGE_HINTS.test(`${l.href} ${l.text}`))
    .map((l) => l.href.replace(/#.*$/, ""))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3);
  const pages: Page[] = [home.page];
  for (const href of inner) {
    const r = await pageReader.read(href);
    usage = addUsage(usage, { pagesRead: 1 });
    if (r.ok) pages.push(r.page);
  }
  const s = signals(pages);

  // Verified: you entered it, it is on the matching Google profile, or the site shows the profile's phone.
  const sitePhones = [...s.phones, ...pages.flatMap((p) => [...p.text.matchAll(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g)].map((m) => m[0]))];
  const phoneMatch = !!best?.phone && sitePhones.some((p) => samePhone(p, best.phone));
  const googleMatch = !!best?.website && sameHost(best.website, home.page.url);
  const verified = origin === "capture" || googleMatch || phoneMatch;
  const why = origin === "capture" ? "You entered it" : googleMatch ? "Linked from the Google profile" : phoneMatch ? "Shows the Google profile's phone" : "Not linked from another source yet";
  const confidence: Confidence = verified ? (origin === "capture" || (googleMatch && phoneMatch) ? "high" : "medium") : "low";

  const p0 = pages[0];
  const facts = [
    p0.title && `title "${p0.title.slice(0, 80)}"`,
    s.platform && `built with ${s.platform}`,
    p0.url.startsWith("https://") ? "secure (https)" : "not secure (http)",
    p0.hasViewport ? "mobile layout tag present" : "no mobile layout tag",
    `home answered in ${(p0.ms / 1000).toFixed(1)} s`,
  ].filter(Boolean);
  const findings: NewFinding[] = [{
    kind: "website",
    finding: `Website ${siteHost} (${fromLabel}): ${facts.join(", ")}. ${pages.length} page${pages.length > 1 ? "s" : ""} read.`,
    source: "website", sourceUrl: p0.url, verification: verified ? "verified" : "unverified", confidence, why,
    data: {
      origin, platform: s.platform, https: p0.url.startsWith("https://"), viewport: p0.hasViewport,
      pages: pages.map((p) => ({ url: p.url, title: p.title, status: p.status, ms: p.ms, bytes: p.bytes, h1: p.h1, description: p.description, text: p.text.slice(0, 3000) })),
    },
  }];
  for (const e of s.emails) findings.push({ kind: "contact", finding: `Email on the website: ${e}`, source: "website", sourceUrl: p0.url, verification: verified ? "verified" : "unverified", confidence, why: verified ? "Shown on the verified website" : "Website not verified yet", data: { email: e } });
  for (const ph of s.phones) findings.push({ kind: "contact", finding: `Phone on the website: ${usPhone(ph)}`, source: "website", sourceUrl: p0.url, verification: verified ? "verified" : "unverified", confidence, why: verified ? "Shown on the verified website" : "Website not verified yet", data: { phone: ph } });
  if (s.store) findings.push({ kind: "store", finding: `Online store on the website (${s.store}).`, source: "website", sourceUrl: p0.url, verification: verified ? "verified" : "unverified", confidence, data: { platform: s.store } });
  if (s.booking) findings.push({ kind: "catalog", finding: `Online booking or ordering through ${s.booking}.`, source: "website", sourceUrl: p0.url, verification: verified ? "verified" : "unverified", confidence, data: { booking: s.booking } });
  if (!s.store) findings.push({ kind: "store", finding: "No online store found on the website.", source: "website", sourceUrl: p0.url, verification: "unverified", confidence: "medium", why: `Checked ${pages.length} page${pages.length > 1 ? "s" : ""}` });
  await replaceFindings(ctx.db, o.id, "website", findings);

  return {
    summary: `${siteHost}: ${pages.length} page${pages.length > 1 ? "s" : ""} read${s.store ? `, store on ${s.store}` : ""}${verified ? "" : ", not verified yet"}.`,
    data: { ...base, url: p0.url, verified, social: { instagram: s.instagram, facebook: s.facebook } } satisfies WebsiteData,
    usage,
  };
}

/* ---------------------------------------------------------------- social and store */

async function social(ctx: StepContext): Promise<StepResult> {
  const o = ctx.opportunity;
  const reading = data<PhotoData>(ctx.previous.photo)?.reading;
  const site = data<WebsiteData>(ctx.previous.website);
  let usage = emptyUsage();

  let results = site?.search;
  if (!results) {
    const r = await webSearch.search({
      city: o.city,
      question: `Find the Instagram and Facebook pages and any online store (Etsy, Shopify, Square) of the business "${o.name}" in ${o.city}. List the links you found.`,
    });
    usage = addUsage(usage, r.usage);
    results = r.results;
  }

  const findings: NewFinding[] = [];
  const add = (kind: "instagram" | "facebook", handle: string, from: { source: NewFinding["source"]; url: string | null; why: string; verified: boolean }) => {
    if (findings.some((f) => f.kind === kind && f.data?.handle === handle)) return;
    const label = kind === "instagram" ? `Instagram @${handle}` : `Facebook page facebook.com/${handle}`;
    findings.push({
      kind, finding: `${label}.`, source: from.source,
      sourceUrl: from.url ?? (kind === "instagram" ? `https://www.instagram.com/${handle}/` : `https://www.facebook.com/${handle}`),
      verification: from.verified ? "verified" : "unverified", confidence: from.verified ? "high" : "low", why: from.why, data: { handle },
    });
  };

  const captured = o.instagram?.toLowerCase().replace(/^@/, "") ?? null;
  const fromPhoto = reading?.instagram?.toLowerCase().replace(/^@/, "") ?? null;
  const onSite = site?.verified ? site.social : { instagram: [], facebook: [] };
  const siteUrl = site?.url ?? null;

  // Order matters: the strongest reason is saved first.
  if (captured) add("instagram", captured, { source: "capture", url: null, why: "You entered it", verified: true });
  for (const h of onSite.instagram) add("instagram", h, { source: "website", url: siteUrl, why: "Linked from the verified website", verified: true });
  for (const h of onSite.facebook) add("facebook", h, { source: "website", url: siteUrl, why: "Linked from the verified website", verified: true });
  if (fromPhoto) add("instagram", fromPhoto, { source: "photo", url: null, why: "From your photo, not cross-checked", verified: false });
  for (const r of results) {
    const ig = instagramHandle(r.url);
    // Search results only count when the handle carries the name (or matches your photo).
    if (ig && (ig === fromPhoto || hostCarriesName(o.name, `https://${ig.replace(/[._]/g, "")}.com`))) add("instagram", ig, { source: "web_search", url: r.url, why: ig === fromPhoto ? "Matches your photo, not cross-checked" : "Found in a web search, not cross-checked", verified: false });
    const fb = facebookPage(r.url);
    if (fb && hostCarriesName(o.name, `https://${fb.replace(/[.-]/g, "")}.com`)) add("facebook", fb, { source: "web_search", url: r.url, why: "Found in a web search, not cross-checked", verified: false });
    const st = storeFrom(r.url);
    if (st && !findings.some((f) => f.kind === "store" && f.sourceUrl === r.url)) {
      findings.push({ kind: "store", finding: `${st} store: ${r.title}.`, source: "web_search", sourceUrl: r.url, verification: "unverified", confidence: "low", why: "Found in a web search, not cross-checked", data: { platform: st } });
    }
  }
  // Web results are limited to the few strongest per kind.
  const capped = (["instagram", "facebook", "store"] as const).flatMap((k) => findings.filter((f) => f.kind === k).slice(0, 3));
  if (!capped.some((f) => f.kind === "instagram")) capped.push({ kind: "instagram", finding: "No Instagram found.", source: "web_search", verification: "unverified", confidence: "medium", why: "Checked what you entered, the website and a web search" });
  await replaceFindings(ctx.db, o.id, "social", capped);

  const ig = capped.find((f) => f.kind === "instagram" && f.data?.handle);
  const fb = capped.find((f) => f.kind === "facebook");
  const parts = [
    ig ? `Instagram @${ig.data!.handle}${ig.verification === "verified" ? "" : " (to confirm)"}` : "no Instagram found",
    fb ? `Facebook ${fb.verification === "verified" ? "linked" : "to confirm"}` : null,
    capped.some((f) => f.kind === "store") ? "store found" : null,
  ].filter(Boolean);
  return { summary: `${parts.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()), data: { instagram: ig?.data?.handle ?? null }, usage };
}

/* ---------------------------------------------------------------- local context */

const contextSchema = z.object({
  competitors: z.array(z.object({ name: z.string(), url: z.string(), why: z.string() })),
  seasonal: z.array(z.object({ note: z.string(), url: z.string() })),
});

async function context(ctx: StepContext): Promise<StepResult> {
  const o = ctx.opportunity;
  const id = data<IdentityData>(ctx.previous.identity);
  const type = o.category ?? (id?.best != null ? id.candidates[id.best].type : null) ?? "local business";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

  const r = await webSearch.search({
    city: o.city,
    question:
      `Today is ${today}. For "${o.name}", a ${type} in ${o.city}: find up to 3 other ${type} businesses in or near ${o.city} ` +
      `that compete for the same customers, and any seasonal demand or local events in ${o.city} in the next 3 months that matter to this kind of business.`,
  });
  let usage = addUsage(emptyUsage(), r.usage);

  const allowed = new Set(r.results.map((x) => x.url));
  const list = r.results.slice(0, 20).map((x, i) => `${i + 1}. ${x.title} | ${x.url}`).join("\n");
  const ex = await structured(contextSchema, {
    system:
      "You turn web search notes into a short list. Use only URLs from the numbered results, copied exactly. " +
      "Competitors: at most 3 real local businesses (not directories, not lists, not the business itself). " +
      "Seasonal: at most 2 facts about timing or local events, each tied to one result URL. Write in American English, one short sentence each.",
    content: `Business: ${o.name} (${type}), ${o.city}.\n\nSearch notes:\n${r.answer.slice(0, 6000)}\n\nResults:\n${list}`,
    maxTokens: 4000,
  });
  usage = addUsage(usage, ex.usage);

  const own = host(data<WebsiteData>(ctx.previous.website)?.url);
  const competitors = ex.data.competitors.filter((c) => allowed.has(c.url) && host(c.url) !== own && !sameName(o.name, c.name)).slice(0, 3);
  const seasonal = ex.data.seasonal.filter((s) => allowed.has(s.url)).slice(0, 2);

  await replaceFindings(ctx.db, o.id, "context", [
    ...competitors.map((c): NewFinding => ({ kind: "competitor", finding: `${c.name}: ${c.why}`, source: "web_search", sourceUrl: c.url, verification: "unverified", confidence: "medium", why: "From a web search", data: { name: c.name } })),
    ...seasonal.map((s): NewFinding => ({ kind: "context", finding: s.note, source: "web_search", sourceUrl: s.url, verification: "unverified", confidence: "medium", why: "From a web search", data: {} })),
  ]);

  const parts = [
    competitors.length ? `${competitors.length} local competitor${competitors.length > 1 ? "s" : ""}` : "no clear local competitor",
    seasonal.length ? `${seasonal.length} seasonal note${seasonal.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return { summary: `${parts.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()), data: { competitors, seasonal }, usage };
}
