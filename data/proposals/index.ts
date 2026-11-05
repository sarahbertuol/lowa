import fs from "node:fs";
import path from "node:path";
import type { Proposal } from "./types";
import { proposal as gampi } from "./gampi";

/**
 * Proposals are discovered from the files in this folder: data/proposals/[slug].ts
 * becomes /proposal/[slug]. New client = duplicate gampi.ts, rename it, change `slug`.
 */
const DIR = path.join(process.cwd(), "data", "proposals");
const NOT_PROPOSALS = new Set(["index", "types"]);
const SLUG = /^[a-z0-9-]+$/;

// Compile-time check that the reference file still matches the template shape.
const _shape: Proposal = gampi;
void _shape;

export function proposalSlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.slice(0, -3))
    .filter((s) => SLUG.test(s) && !NOT_PROPOSALS.has(s));
}

export async function getProposal(slug: string): Promise<Proposal | undefined> {
  if (!SLUG.test(slug) || NOT_PROPOSALS.has(slug)) return undefined;
  try {
    const mod = (await import(`./${slug}`)) as { proposal?: Proposal };
    return mod.proposal;
  } catch {
    return undefined;
  }
}

export type { Proposal };
