import { z } from "zod";

/**
 * Opportunity Engine environment (docs/ARQUITETURA.md). Read lazily and per feature, so the
 * public site builds and runs without them, and login works before the AI keys exist.
 * Each getter throws a clear message naming what is missing.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const adminSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

const aiSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(20),
  AI_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  GOOGLE_PLACES_API_KEY: z.string().min(10),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type AdminEnv = z.infer<typeof adminSchema>;
export type AiEnv = z.infer<typeof aiSchema>;

function fail(scope: string, error: z.ZodError): never {
  const missing = error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Opportunity Engine: ${scope} environment is incomplete (${missing}). See .env.example.`);
}

function serverOnly(name: string) {
  if (typeof window !== "undefined") throw new Error(`${name}() called in the browser`);
}

/** Values the browser may see (Supabase URL and anon key, protected by RLS). */
export function publicEnv(): PublicEnv {
  // Listed one by one so Next.js inlines them in the client bundle.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return parsed.success ? parsed.data : fail("Supabase", parsed.error);
}

/** Supabase service role. Server only. */
export function adminEnv(): AdminEnv {
  serverOnly("adminEnv");
  const parsed = adminSchema.safeParse(process.env);
  return parsed.success ? parsed.data : fail("Supabase admin", parsed.error);
}

/** AI and research providers (OE-07). Server only. */
export function aiEnv(): AiEnv {
  serverOnly("aiEnv");
  const parsed = aiSchema.safeParse(process.env);
  return parsed.success ? parsed.data : fail("AI", parsed.error);
}

/** True when login and the database can work (used to show a setup notice instead of crashing). */
export function supabaseConfigured(): boolean {
  return adminSchema.safeParse(process.env).success;
}
