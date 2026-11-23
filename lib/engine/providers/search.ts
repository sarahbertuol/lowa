import type Anthropic from "@anthropic-ai/sdk";
import { assertFinished, claude, fallbackParams, toUsage } from "./ai";
import { addUsage, emptyUsage, type SearchProvider, type SearchResult } from "./types";

/**
 * Web search through the Claude API search tool. Every result keeps the URL it came from;
 * the answer text is only a reading aid, sources come from the result blocks.
 */

const SYSTEM =
  "You research small local businesses in the United States for a web studio. Search the web, then answer briefly " +
  "in plain text. Only state what the results show. Never guess a URL. If nothing relevant is found, say so.";

export const webSearch: SearchProvider = {
  async search({ question, city }) {
    const { client, model } = claude();
    const tools = [{
      type: "web_search_20260209" as const,
      name: "web_search" as const,
      max_uses: 3,
      ...(city ? { user_location: { type: "approximate" as const, city: city.split(",")[0].trim(), country: "US" } } : {}),
    }];

    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: question }];
    let usage = emptyUsage();
    const results = new Map<string, SearchResult>();
    let answer = "";

    // The server may pause a long search turn; resume it a couple of times at most.
    for (let turn = 0; turn < 3; turn++) {
      const res = await client.beta.messages.create({
        model,
        max_tokens: 8000,
        system: SYSTEM,
        messages,
        tools,
        output_config: { effort: "low" },
        ...fallbackParams(model),
      });
      usage = addUsage(usage, toUsage(model, res.usage));

      for (const block of res.content) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (!results.has(r.url)) results.set(r.url, { url: r.url, title: r.title, pageAge: r.page_age ?? null });
          }
        } else if (block.type === "text") {
          answer += block.text;
        }
      }

      if (res.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: res.content });
        continue;
      }
      assertFinished(res.stop_reason);
      break;
    }

    return { answer: answer.trim(), results: [...results.values()], usage };
  },
};
