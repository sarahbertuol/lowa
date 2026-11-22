import { z } from "zod";

/**
 * Opportunity Engine environment (docs/ARQUITETURA.md). Read lazily, so the public site
 * builds and runs even when these are not set. Each getter throws a clear message instead.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ANTHROPIC_API_KEY: z.string().min(20),
  AI_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  GOOGLE_PLACES_API_KEY: z.string().min(10),
  PUBLIC_BASE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function fail(scope: string, error: z.ZodError): never {
  const missing = error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Opportunity Engine: ${scope} environment is incomplete (${missing}). See .env.example.`);
}

/** Values the browser may see (Supabase URL and anon key, protected by RLS). */
export function publicEnv(): PublicEnv {
  // Listed one by one so Next.js inlines them in the client bundle.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return parsed.success ? parsed.data : fail("public", parsed.error);
}

/** Secrets. Server only: never import this from a client component. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") throw new Error("serverEnv() called in the browser");
  const parsed = serverSchema.safeParse(process.env);
  return parsed.success ? parsed.data : fail("server", parsed.error);
}

/** True when the Engine can run (used to show a setup notice instead of crashing). */
export function engineConfigured(): boolean {
  return serverSchema.safeParse(process.env).success;
}
