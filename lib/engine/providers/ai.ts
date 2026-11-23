import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import { aiEnv } from "@/lib/engine/env";
import type { Usage } from "./types";

/**
 * Claude API (docs/ARQUITETURA.md). One client per server instance; the model comes from AI_MODEL.
 * Prices are list prices per million tokens (US$), used only to measure the cost of a research.
 */

const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};
const WEB_SEARCH_USD = 0.01; // US$ 10 per 1,000 searches

/** Models that accept server-side refusal fallbacks (a declined request is retried on another model). */
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-2", "claude-fable-5-1"]);
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let cached: Anthropic | null = null;

export function claude() {
  const env = aiEnv();
  cached ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 90_000, maxRetries: 2 });
  return { client: cached, model: env.AI_MODEL };
}

/** Request options shared by every call: refusal fallback when the model supports it. */
export function fallbackParams(model: string) {
  return FALLBACK_MODELS.has(model)
    ? { betas: [FALLBACK_BETA] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const }
    : { betas: [] as Anthropic.Beta.AnthropicBeta[] };
}

type RawUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  server_tool_use?: { web_search_requests?: number | null } | null;
};

export function toUsage(model: string, u: RawUsage): Partial<Usage> {
  const p = PRICES[model];
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const searches = u.server_tool_use?.web_search_requests ?? 0;
  const cost = p
    ? (u.input_tokens * p.input + cacheWrite * p.input * 1.25 + cacheRead * p.cacheRead + u.output_tokens * p.output) / 1e6 +
      searches * WEB_SEARCH_USD
    : null;
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    webSearches: searches,
    aiCostUsd: cost,
  };
}

/** A declined or cut-off answer is an error, so the step retries and then pauses. */
export function assertFinished(stop: string | null) {
  if (stop === "refusal") throw new Error("The AI declined this request.");
  if (stop === "max_tokens") throw new Error("The AI answer was cut off.");
}

/**
 * One call with a validated JSON answer (structured outputs). Low effort: these are short
 * extraction tasks. Throws when the answer does not match the schema.
 */
export async function structured<S extends z.ZodType>(
  schema: S,
  input: { system: string; content: Anthropic.Beta.BetaContentBlockParam[] | string; maxTokens?: number },
): Promise<{ data: z.infer<S>; usage: Partial<Usage> }> {
  const { client, model } = claude();
  const res = await client.beta.messages.parse({
    model,
    max_tokens: input.maxTokens ?? 8000,
    system: input.system,
    messages: [{ role: "user", content: input.content }],
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    ...fallbackParams(model),
  });
  assertFinished(res.stop_reason);
  if (res.parsed_output == null) throw new Error("The AI answer did not match the expected format.");
  return { data: res.parsed_output as z.infer<S>, usage: toUsage(model, res.usage) };
}
