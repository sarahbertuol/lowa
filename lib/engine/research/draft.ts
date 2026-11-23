import { z } from "zod";
import { structured } from "@/lib/engine/providers/ai";
import { addUsage, emptyUsage } from "@/lib/engine/providers/types";
import { SERVICE_COLUMNS, money, type Service } from "@/lib/engine/catalog";
import { quote } from "@/lib/engine/pricing";
import { copyCheck, readingTime, type ProposalContent } from "@/lib/engine/proposal";
import type { Insight, Template } from "./insights";
import type { StepContext, StepResult } from "./handlers";

/**
 * Proposal draft (OE-12). Writes the six sections from the latest analysis, in American English,
 * for a 1 to 2 minute read. The AI writes words only: the price block comes from the catalog.
 * Each run saves a new version; nothing is published (that is the founder's tap, OE-14).
 */

const dash = (s: string) => s.replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").trim();

const TEMPLATE_BRIEF: Record<Template, string> = {
  missing_website: "Template A, The missing website: we couldn't find a website. Show what a simple site would do for them. Never say they have no website; say people can't find one.",
  growth: "Template B, The growth opportunity: they have a website. Point to specific pages or paths we read and what to change.",
  seasonal: "Template C, The seasonal opportunity: tie the proposal to the season or local date in the insights.",
};

export async function draft(ctx: StepContext): Promise<StepResult> {
  const { db } = ctx;
  const o = ctx.opportunity;

  const { data: a } = await db.from("analyses")
    .select("version,insights,dimensions,service_slug,extra_pages,template")
    .eq("opportunity_id", o.id).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!a || ctx.previous.analysis?.skipped) {
    return { summary: "Waiting for the analysis.", skipped: true };
  }
  const insights = (a.insights ?? []) as Insight[];
  const template = (a.template ?? "growth") as Template;

  const { data: rows } = await db.from("services").select(SERVICE_COLUMNS);
  const catalog = (rows ?? []) as Service[];
  const service = catalog.find((s) => s.slug === a.service_slug);
  if (!service) throw new Error("The suggested service is no longer in the catalog.");
  const care = catalog.find((s) => s.slug === "maintenance" && s.active);

  const schema = z.object({
    hero: z.object({ headline: z.string(), subline: z.string() }),
    opportunity: z.object({ title: z.string(), body: z.array(z.string()) }),
    noticed: z.array(z.object({ insight: z.number().int(), title: z.string(), saw: z.string(), why: z.string(), opportunity: z.string() })),
    recommendation: z.object({ title: z.string(), description: z.string(), bullets: z.array(z.string()) }),
    next_step: z.object({ title: z.string(), body: z.string() }),
  });

  const list = insights.map((i, n) =>
    `[${n + 1}] ${i.title}\n  observed (${i.observed.kind}): ${i.observed.text}\n  why (${i.why.kind}): ${i.why.text}\n  we'd do: ${i.action.text}\n  benefit (${i.benefit.kind}): ${i.benefit.text}`,
  ).join("\n");
  const scope = [service.summary, ...service.inclusions].filter(Boolean).join("; ");

  const ex = await structured(schema, {
    effort: "medium",
    maxTokens: 6000,
    system: [
      "You write a short web proposal from LoWa Studio, a small US web studio, to one local business owner. They read it on a phone in 1 to 2 minutes. Keep what you write to 200 to 280 words in total (a price block of about 60 words is added after).",
      "Sections: hero (a headline under 12 words about their situation, not about us, plus one subline), the opportunity (a title under 7 words and two short paragraphs), what we noticed (one item per insight, same order: title, what we saw, why it matters, the opportunity, one sentence each), our recommendation (a title under 7 words, one sentence on the service, 3 to 5 bullets from the service scope, written for them), next step (a title and one or two sentences inviting a reply or a short call).",
      "Rules:",
      "- Use only what the insights say. Never add facts, numbers, reviews, awards, clients, testimonials or results. A number may appear only if it is in the insights.",
      "- An insight sentence marked hypothesis must stay a guess: start it with \"We think\" or \"It's likely\". Facts stay plain.",
      "- No prices, no dollar amounts, no delivery times, no guarantees and no promised results: the price block and terms are added separately.",
      "- Name the recommended service for what it is (an online store is a store, not a simple site) and keep the hero and the opportunity about it.",
      "- Talk to the owner as \"you\". Warm, plain, specific. American English. Short sentences.",
      "- No long dashes (use commas, colons or parentheses), no emojis, no hype words (unlock, elevate, next level, game changer, supercharge, in today's digital world).",
      "- Never say they have no website; say we couldn't find one, or people can't find one.",
    ].join("\n"),
    content:
      `Business: ${o.name}, ${o.city}${o.category ? ` (${o.category})` : ""}.\n${TEMPLATE_BRIEF[template]}\n\n` +
      `Insights:\n${list || "none"}\n\nRecommended service: ${service.name}. Scope: ${scope || service.name}.`,
  });
  const d = ex.data;

  // Investment: only from the catalog.
  const q = quote(service, a.extra_pages);
  const unit = service.price_type === "fixed" ? "one time" : service.price_type === "monthly" ? "a month" : "";
  const note = service.price_type === "custom"
    ? "We scope it with you first, then send a fixed quote before any work starts."
    : q.lines.length
      ? `${q.lines.join(", ")}.${service.price_type === "from" ? " Final scope agreed before we start." : ""}`
      : service.price_type === "from" ? "Final scope agreed before we start." : "";
  const isSite = service.category === "website";
  const content: ProposalContent = {
    hero: { headline: dash(d.hero.headline), subline: dash(d.hero.subline) },
    opportunity: { title: dash(d.opportunity.title), body: d.opportunity.body.slice(0, 3).map(dash) },
    noticed: d.noticed
      .filter((n) => n.insight >= 1 && n.insight <= insights.length)
      .slice(0, 3)
      .map((n) => ({ title: dash(n.title).replace(/\.$/, ""), saw: dash(n.saw), why: dash(n.why), opportunity: dash(n.opportunity) })),
    recommendation: {
      title: dash(d.recommendation.title), service: service.name,
      description: dash(d.recommendation.description), bullets: d.recommendation.bullets.slice(0, 5).map(dash),
    },
    investment: {
      label: q.label,
      unit,
      note,
      payment: service.payment_terms ?? "[payment terms]",
      delivery: service.delivery ?? "[delivery time]",
      notIncluded: service.exclusions,
      care: isSite && care?.price_cents != null
        ? `Optional care plan: ${money(care.price_cents)} a month${care.summary ? ` (${care.summary.replace(/\.$/, "").toLowerCase()})` : ""}.`
        : null,
    },
    nextStep: { title: dash(d.next_step.title), body: dash(d.next_step.body) },
  };

  const { data: last } = await db.from("proposals").select("version").eq("opportunity_id", o.id)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (last?.version ?? 0) + 1;
  const { error } = await db.from("proposals").insert({
    opportunity_id: o.id, version, template, service_slug: service.slug, extra_pages: q.extraPages,
    content, status: "draft",
  });
  if (error) throw new Error(`draft: ${error.message}`);

  const issues = copyCheck(content);
  const read = readingTime(content);
  return {
    summary: `Proposal draft v${version} ready, ${read.label} to read${issues.length ? `, ${issues.length} copy issue${issues.length > 1 ? "s" : ""} to fix` : ""}. Messages arrive in OE-15.`,
    data: { version, issues: issues.length, words: read.words },
    usage: addUsage(emptyUsage(), ex.usage),
  };
}
