import { z } from "zod";
import { structured, claude } from "@/lib/engine/providers/ai";
import { addUsage, emptyUsage } from "@/lib/engine/providers/types";
import { loadAssessment } from "./confidence";
import { SOURCE_LABEL, type SourceKind } from "./findings";
import {
  DIMENSIONS, RATINGS, SENTENCE_KINDS,
  type DimensionRow, type Insight, type Sentence, type Template,
} from "./insights";
import type { StepContext, StepResult } from "./handlers";

/**
 * Opportunity analysis (OE-09). Uses only the saved findings and what the founder entered.
 * The AI returns up to 3 insights, the six dimensions, a catalog service id and whether
 * seasonality is strong; the server checks every insight against its sources, picks the
 * template by rule (docs/ARQUITETURA.md) and never takes a price from the AI.
 */

type Row = {
  id: string; kind: string; finding: string; source_url: string | null;
  verification: "verified" | "unverified" | "rejected"; origin: "auto" | "manual"; data: Record<string, unknown> | null;
};
type Service = { slug: string; name: string; category: string; price_type: string; included_pages: number | null; extra_page_cents: number | null; summary: string | null; notes: string | null; exclusions: string[] | null };

const dash = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").trim();
const GENERIC = /could be better|unlock|in today'?s digital|next level|online presence is (key|crucial|essential)|game[- ]changer|elevate your/i;
const ABSENCE = /\b(no|not|none|never|without|lacks?|missing)\b|n't\b/i;
const JARGON = /\b(the )?findings?\b|\bsearch results?\b|\bthe research\b/i;
const NUMBER =/\$\s?\d[\d,.]*|\d[\d,.]*\s?%|\d+(\.\d+)?x\b/gi;

export async function analysis(ctx: StepContext): Promise<StepResult> {
  const { db } = ctx;
  const o = ctx.opportunity;

  const { data: opp } = await db.from("opportunities")
    .select("identity_confirmed,observation,found_at,found_via,category").eq("id", o.id).maybeSingle();
  const confidence = await loadAssessment(db, o.id, !!opp?.identity_confirmed);
  if (confidence.level === "low") {
    return { summary: "Waiting for you to confirm which business this is.", skipped: true, data: { waiting: true } };
  }

  const [{ data: rows }, { data: services }] = await Promise.all([
    db.from("research_findings")
      .select("id,kind,finding,source_url,verification,origin,data")
      .eq("opportunity_id", o.id).neq("verification", "rejected").order("checked_at").limit(60),
    db.from("services")
      .select("slug,name,category,price_type,included_pages,extra_page_cents,summary,notes,exclusions")
      .eq("active", true).order("sort_order"),
  ]);
  const catalog = (services ?? []) as Service[];
  if (!catalog.length) throw new Error("The service catalog is empty.");

  // Only the Google profile that is this business, not the other candidates.
  const findings = ((rows ?? []) as Row[]).filter((f) => f.kind !== "google" || f.origin === "manual" || f.data?.best === true);
  const note = [opp?.observation, opp?.found_at && `Where: ${opp.found_at}`, opp?.found_via === "in_person" ? "Met in person" : null]
    .filter(Boolean).join(". ");

  const list = findings.map((f, i) => {
    const src = typeof f.data?.source === "string" && f.data.source in SOURCE_LABEL ? SOURCE_LABEL[f.data.source as SourceKind] : "Research";
    return `[${i + 1}] ${f.kind}, ${f.verification === "verified" ? "VERIFIED" : "not verified"}, ${src}: ${f.finding}${f.source_url ? ` (${f.source_url})` : ""}`;
  }).join("\n");
  const menu = catalog.map((s) =>
    `- ${s.slug}: ${s.name} (${s.category}, ${s.price_type}${s.included_pages ? `, ${s.included_pages} pages` : ""}). ${s.summary ?? ""}` +
    `${s.exclusions?.length ? ` Excludes: ${s.exclusions.join(", ")}.` : ""}${s.notes ? ` Rule: ${s.notes}` : ""}`,
  ).join("\n");

  const sentence = z.object({ text: z.string(), kind: z.enum(SENTENCE_KINDS) });
  const schema = z.object({
    dimensions: z.array(z.object({ dimension: z.enum(DIMENSIONS), rating: z.enum(RATINGS), note: z.string() })),
    insights: z.array(z.object({
      dimension: z.enum(DIMENSIONS),
      title: z.string(),
      observed: sentence,
      why_it_matters: sentence,
      what_we_would_do: sentence,
      benefit: sentence,
      sources: z.array(z.number().int()),
      uses_founder_note: z.boolean(),
    })),
    strong_seasonality: z.boolean(),
    service_slug: z.enum(catalog.map((s) => s.slug) as [string, ...string[]]),
    extra_pages: z.number().int(),
    needs_online_sales: z.boolean(),
    service_reason: z.string(),
  });

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const ex = await structured(schema, {
    effort: "medium",
    maxTokens: 8000,
    system: [
      "You are the analyst of LoWa Studio, a small US web studio. You read research about one local US business and find where a website or digital work would help it most.",
      "Rules:",
      "- Use only the numbered findings and the founder's note. Never invent facts, numbers, reviews, prices, revenue or conversion figures. A number may appear only if it is in a cited finding.",
      "- Rate six dimensions: discovery (can people find it), presentation (how the business shows itself), experience (site or profile usability), conversion (can people buy, book or ask easily), retention (reasons to come back), seasonality (timing and local events). Use unknown when there is no evidence.",
      "- Give at most 3 insights, best first. Fewer is fine. Each insight must name something concrete from the findings (a product, a page, a channel, a review count, a local event) and list the finding numbers it uses in sources. If nothing concrete supports it, leave it out. Never write generic advice such as \"your website could be better\".",
      "- Each insight has four sentences: observed (what is there), why it matters (for this business's customers), what we would do (a specific piece of web work), benefit (qualitative, no numbers). Tag each sentence: fact only when every part comes from a VERIFIED finding or the founder's note; observation for unverified findings; hypothesis for a reasoned guess; recommendation for what we would do.",
      "- Write about the business itself. Never mention \"findings\", \"the research\" or \"search results\": say where it was seen (on the website, on the Google profile, on Instagram, in local event listings).",
      "- Something we did not see is never a fact: tag it observation and write \"we didn't see\", not \"there is no\".",
      "- \"No website found\" means the search found none, not that the business has none. Say \"we couldn't find a website\", never \"you don't have a website\".",
      "- strong_seasonality: true only if a finding shows a strong seasonal driver within the next 3 months (gift product before the holidays, a local event, a season this business depends on) and one of your insights is about it.",
      "- Pick one service from the catalog by its id, following each service's rule. How to choose: a local business that mainly needs to present itself and take inquiries or bookings, with no website found or a weak one, gets the small website; one that clearly needs more than its pages gets the bigger website; a business that sells products and has no working online store found gets ecommerce, never the small website; a business that already has a working website (and store, if it sells) gets growth. extra_pages: only for a service sold by page count, otherwise 0. service_reason: one sentence, no price.",
      "- needs_online_sales: true when the business sells products people could buy online and no working online store was found. Taking orders by message, phone, email or at markets still means it sells products.",
      "- American English, short plain sentences, title under 9 words. No em dashes or en dashes; use commas, colons or parentheses. No hype words (unlock, elevate, next level, game changer), no emojis.",
    ].join("\n"),
    content:
      `Today is ${today}.\nBusiness: ${o.name}, ${o.city}${opp?.category ? `, ${opp.category}` : ""}.\n` +
      `Founder's note: ${note || "none"}\n\nFindings:\n${list || "none"}\n\nCatalog:\n${menu}`,
  });
  const a = ex.data;

  // Check each insight against what it cites.
  const ids = (nums: number[]) => [...new Set(nums.filter((n) => n >= 1 && n <= findings.length))].map((n) => findings[n - 1]);
  const insights: Insight[] = [];
  for (const i of a.insights) {
    const cited = ids(i.sources);
    const usesNote = i.uses_founder_note && !!note;
    if (!cited.length && !usesNote) continue;
    const anyVerified = cited.some((f) => f.verification === "verified") || usesNote;
    const evidence = (cited.map((f) => f.finding).join(" ") + " " + note).toLowerCase();
    const fix = (s: { text: string; kind: Sentence["kind"] }, role: "observed" | "why" | "action" | "benefit"): Sentence => {
      let kind = s.kind;
      if (role === "action") kind = "recommendation";
      else if (kind === "recommendation") kind = "hypothesis";
      if (kind === "fact" && (!anyVerified || role === "benefit")) kind = role === "observed" ? "observation" : "hypothesis";
      // An absence ("no email signup") is what we didn't see, not a verified fact.
      if (kind === "fact" && ABSENCE.test(s.text)) kind = "observation";
      return { text: dash(s.text), kind };
    };
    const s = {
      observed: fix(i.observed, "observed"), why: fix(i.why_it_matters, "why"),
      action: fix(i.what_we_would_do, "action"), benefit: fix(i.benefit, "benefit"),
    };
    const all = [i.title, s.observed.text, s.why.text, s.action.text, s.benefit.text].join(" ");
    if (GENERIC.test(all) || JARGON.test(all)) continue;
    const numbers = all.match(NUMBER) ?? [];
    if (numbers.some((n) => !evidence.includes(n.replace(/\s/g, "").toLowerCase()))) continue;
    insights.push({ dimension: i.dimension, title: dash(i.title).replace(/\.$/, ""), ...s, sources: cited.map((f) => f.id), usesNote });
    if (insights.length === 3) break;
  }

  const dimensions: DimensionRow[] = DIMENSIONS.map((d) => {
    const r = a.dimensions.find((x) => x.dimension === d);
    return { dimension: d, rating: r?.rating ?? "unknown", note: r ? dash(r.note) : "" };
  });

  // Template by rule: no verified website = A; strong season among the insights = C; otherwise B.
  const hasSite = findings.some((f) => f.kind === "website" && f.verification === "verified");
  const seasonal = a.strong_seasonality && insights.some((i) => i.dimension === "seasonality");
  const ruleTemplate: Template = !hasSite ? "missing_website" : seasonal ? "seasonal" : "growth";

  // Service (OE-11): the AI only names it. A business that needs to sell online never gets a
  // priced website package (the US$920 site is not an online store): it gets ecommerce.
  let service = catalog.find((s) => s.slug === a.service_slug)!;
  let reason = dash(a.service_reason);
  const ecommerce = catalog.find((s) => s.slug === "ecommerce");
  // Not left to the AI alone: a maker or boutique (the founder's category) with no online store
  // found counts as selling products too.
  const hasStore = findings.some((f) => f.kind === "store" && typeof f.data?.platform === "string");
  const productSeller = a.needs_online_sales || (!hasStore && ["Handmade", "Boutique"].includes(opp?.category ?? ""));
  if (productSeller && service.category === "website" && service.price_type !== "custom" && ecommerce) {
    service = ecommerce;
    reason = "It sells products and we didn't see a working online store, so it needs an online store, not a brochure site.";
  }
  let extraPages = service.extra_page_cents != null ? Math.max(0, Math.min(20, a.extra_pages)) : 0;

  const { data: last } = await db.from("analyses").select("version,service_slug,extra_pages,dimensions").eq("opportunity_id", o.id)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  // A service the founder picked stays when the analysis runs again.
  const picked = (last?.dimensions as { serviceByFounder?: boolean } | null)?.serviceByFounder
    ? catalog.find((s) => s.slug === last!.service_slug) : undefined;
  if (picked) {
    service = picked;
    extraPages = picked.extra_page_cents != null ? last!.extra_pages : 0;
    reason = "You chose this service.";
  }
  // A template the founder picked (OE-14) also stays.
  const lastDims = last?.dimensions as { templateByFounder?: Template } | null;
  const template: Template = lastDims?.templateByFounder ?? ruleTemplate;
  const version = (last?.version ?? 0) + 1;
  const { error } = await db.from("analyses").insert({
    opportunity_id: o.id,
    version,
    dimensions: {
      items: dimensions, strongSeasonality: a.strong_seasonality, serviceReason: reason,
      needsOnlineSales: a.needs_online_sales, productSeller, suggestedSlug: a.service_slug, serviceByFounder: !!picked,
      ruleTemplate, ...(lastDims?.templateByFounder ? { templateByFounder: lastDims.templateByFounder } : {}),
    },
    insights,
    service_slug: service.slug,
    extra_pages: extraPages,
    template,
    model: claude().model,
  });
  if (error) throw new Error(`analysis: ${error.message}`);
  await db.from("opportunities").update({ template }).eq("id", o.id);

  const count = insights.length
    ? `${insights.length} opportunit${insights.length > 1 ? "ies" : "y"}`
    : "No opportunity with enough evidence";
  return {
    summary: `${count}. Suggested: ${service.name}.`,
    data: { version, template, service: service.slug, insights: insights.length },
    usage: addUsage(emptyUsage(), ex.usage),
  };
}
