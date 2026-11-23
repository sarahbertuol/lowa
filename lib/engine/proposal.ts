/**
 * Proposal content (OE-12): the six sections of the public page (docs/DESIGN.md, Proposta).
 * No dependencies: the editor in the browser runs the same copy check as the server.
 * Prices are never written by the AI: "investment" is filled from the catalog on the server.
 */

export type Noticed = {
  title: string;
  saw: string;
  why: string;
  opportunity: string;
  /** "Source: your Contact page, checked Nov 20" (template B), optional. */
  source?: string;
};

export type ProposalContent = {
  hero: { headline: string; subline: string };
  opportunity: { title: string; body: string[] };
  noticed: Noticed[];
  recommendation: { title: string; service: string; description: string; bullets: string[] };
  investment: {
    label: string;           // "$920", "from $1,450", "Custom quote" (from the catalog)
    unit: string;            // "one time", "a month", ""
    note: string;            // how the total was reached, or the custom quote line
    payment: string;         // catalog payment terms, or "[payment terms]"
    delivery: string;        // catalog delivery, or "[delivery time]"
    notIncluded: string[];
    care: string | null;     // optional care plan line, from the catalog
  };
  nextStep: { title: string; body: string };
};

export type CopyIssue = { where: string; text: string; problem: string };

const DASH = /[\u2014\u2013]/;
const RULES: [RegExp, string][] = [
  [/\b(guarantee[ds]?|guaranteed)\b/i, "Promise we can't back: \"guarantee\""],
  [/\b(double|triple|10x|skyrocket|boost (your )?(sales|revenue))\b/i, "Promise of results without data"],
  [/\b(increase|grow|raise)\w* (your )?(sales|revenue|bookings|conversions?|traffic) by\b/i, "Promise of a number without data"],
  [/\d+(\.\d+)?\s?%/, "Percentage without a source"],
  [/\b(#1|number one|best in (town|the city|tampa|asheville))\b/i, "Claim we can't back"],
  [/\b(live|ready|online) (in|within) \d+ ?(hours?|hrs?)\b|\b24[- ]hours?\b/i, "Delivery promise still pending Sarah's confirmation"],
  [/\btestimonials?\b|\bour (clients|customers) (say|love)\b|\btrusted by\b/i, "Testimonial or social proof we don't have"],
  [/\b(award[- ]winning|as seen (on|in)|featured (on|in))\b/i, "Award or press we don't have"],
  [/\b(unlock|elevate|game[- ]changer|next level|in today'?s digital (world|age)|supercharge)\b/i, "Hype phrase (sounds like AI)"],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "Emoji"],
];

/** Copy rules (CLAUDE.md, DESIGN.md): no long dash, no promise without data, no invented proof. */
export function copyCheck(c: ProposalContent): CopyIssue[] {
  const issues: CopyIssue[] = [];
  const check = (where: string, text: string) => {
    if (!text) return;
    if (DASH.test(text)) issues.push({ where, text, problem: "Long dash: use a comma, colon or parentheses" });
    for (const [re, problem] of RULES) if (re.test(text)) issues.push({ where, text, problem });
    // Dollar amounts belong to Investment, which comes from the catalog.
    if (!where.startsWith("Investment") && /\$\s?\d/.test(text)) issues.push({ where, text, problem: "Price outside Investment: prices come only from the catalog" });
  };
  check("Hero headline", c.hero.headline);
  check("Hero subline", c.hero.subline);
  check("The opportunity, title", c.opportunity.title);
  c.opportunity.body.forEach((p, i) => check(`The opportunity, paragraph ${i + 1}`, p));
  c.noticed.forEach((n, i) => {
    const w = `What we noticed ${i + 1}`;
    check(`${w}, title`, n.title); check(`${w}, what we saw`, n.saw); check(`${w}, why it matters`, n.why); check(`${w}, the opportunity`, n.opportunity);
    if (n.source) check(`${w}, source`, n.source);
  });
  check("Recommendation, title", c.recommendation.title);
  check("Recommendation, description", c.recommendation.description);
  c.recommendation.bullets.forEach((b, i) => check(`Recommendation, item ${i + 1}`, b));
  check("Investment, note", c.investment.note);
  check("Next step, title", c.nextStep.title);
  check("Next step, text", c.nextStep.body);
  return issues;
}

/** Plain text of everything the client reads, for the reading time. */
export function plainText(c: ProposalContent) {
  return [
    c.hero.headline, c.hero.subline, c.opportunity.title, ...c.opportunity.body,
    ...c.noticed.flatMap((n) => [n.title, n.saw, n.why, n.opportunity]),
    c.recommendation.title, c.recommendation.description, ...c.recommendation.bullets,
    c.investment.label, c.investment.note, c.investment.payment, c.investment.delivery, ...c.investment.notIncluded, c.investment.care ?? "",
    c.nextStep.title, c.nextStep.body,
  ].join(" ");
}

/** Reading time at about 200 words a minute: "about 90 seconds". The brief asks for 1 to 2 minutes. */
export function readingTime(c: ProposalContent) {
  const words = plainText(c).split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(15, Math.round((words / 200) * 60 / 15) * 15);
  const half = Math.max(0.5, Math.round(seconds / 30) / 2);
  const label = half < 1 ? "under a minute" : `about ${half} minute${half > 1 ? "s" : ""}`;
  return { words, seconds, label };
}
