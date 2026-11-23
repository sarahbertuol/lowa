/**
 * Analysis shapes and labels (OE-09). No dependencies: the screens import this too.
 * Saved in the analyses table: dimensions (jsonb), insights (jsonb, at most 3), service_slug, template.
 */

export const DIMENSIONS = ["discovery", "presentation", "experience", "conversion", "retention", "seasonality"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  discovery: "Discovery",
  presentation: "Presentation",
  experience: "Experience",
  conversion: "Conversion",
  retention: "Retention",
  seasonality: "Seasonality",
};

export const SENTENCE_KINDS = ["fact", "observation", "hypothesis", "recommendation"] as const;
export type SentenceKind = (typeof SENTENCE_KINDS)[number];

export const SENTENCE_LABEL: Record<SentenceKind, string> = {
  fact: "Verified fact",
  observation: "Observation",
  hypothesis: "Hypothesis",
  recommendation: "Recommendation",
};

export type Sentence = { text: string; kind: SentenceKind };

export type Insight = {
  dimension: Dimension;
  title: string;
  observed: Sentence;
  why: Sentence;
  action: Sentence;
  benefit: Sentence;
  /** Findings the insight is based on (research_findings ids). */
  sources: string[];
  /** The founder's note was used. */
  usesNote: boolean;
};

export const RATINGS = ["strong", "fair", "weak", "unknown"] as const;
export type Rating = (typeof RATINGS)[number];

export type DimensionRow = { dimension: Dimension; rating: Rating; note: string };

export type Template = "missing_website" | "growth" | "seasonal";
export const TEMPLATE_LABEL: Record<Template, string> = {
  missing_website: "A · Missing website",
  growth: "B · Growth",
  seasonal: "C · Seasonal",
};
