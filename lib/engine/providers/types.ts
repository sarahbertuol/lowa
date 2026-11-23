/**
 * Research providers (docs/ARQUITETURA.md). Each integration lives in one file of this folder and
 * implements one of these shapes, so swapping a provider means swapping one file.
 * Server only.
 */

/** What one research run spent. Summed per step and saved with the step result. */
export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  placesCalls: number;
  pagesRead: number;
  /** Claude API cost in US$ at list price (tokens + web searches). Null when the model has no known price. */
  aiCostUsd: number | null;
};

export const emptyUsage = (): Usage => ({
  inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
  webSearches: 0, placesCalls: 0, pagesRead: 0, aiCostUsd: 0,
});

export function addUsage(a: Usage, b: Partial<Usage>): Usage {
  return {
    inputTokens: a.inputTokens + (b.inputTokens ?? 0),
    outputTokens: a.outputTokens + (b.outputTokens ?? 0),
    cacheReadTokens: a.cacheReadTokens + (b.cacheReadTokens ?? 0),
    cacheWriteTokens: a.cacheWriteTokens + (b.cacheWriteTokens ?? 0),
    webSearches: a.webSearches + (b.webSearches ?? 0),
    placesCalls: a.placesCalls + (b.placesCalls ?? 0),
    pagesRead: a.pagesRead + (b.pagesRead ?? 0),
    aiCostUsd: a.aiCostUsd === null || b.aiCostUsd === null ? null : a.aiCostUsd + (b.aiCostUsd ?? 0),
  };
}

/** Google profile candidate. */
export type Place = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
  status: string | null;
  type: string | null;
};

export interface PlacesProvider {
  search(query: string): Promise<{ places: Place[]; usage: Partial<Usage> }>;
}

/** A web result, always with the URL it came from. */
export type SearchResult = { url: string; title: string; pageAge: string | null };

export interface SearchProvider {
  search(input: { question: string; city?: string }): Promise<{ answer: string; results: SearchResult[]; usage: Partial<Usage> }>;
}

export type PageLink = { href: string; text: string };

export type Page = {
  url: string;
  status: number;
  ms: number;
  bytes: number;
  truncated: boolean;
  title: string | null;
  description: string | null;
  h1: string | null;
  generator: string | null;
  hasViewport: boolean;
  links: PageLink[];
  text: string;
  html: string;
};

export type ReadResult =
  | { ok: true; page: Page }
  | { ok: false; reason: "blocked_by_robots" | "not_allowed" | "timeout" | "too_large" | "not_html" | "http_error" | "network"; detail: string };

export interface PageReader {
  read(url: string): Promise<ReadResult>;
}

/** What a photo of a card or storefront shows. Suggestions, never facts. */
export type PhotoReading = {
  business_name: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  what_it_shows: string;
};

export interface VisionProvider {
  readPhotos(images: { data: Buffer; mediaType: "image/jpeg" | "image/png" | "image/webp" }[]): Promise<{ reading: PhotoReading; usage: Partial<Usage> }>;
}
