import { createClient } from "@supabase/supabase-js";
import { adminEnv } from "@/lib/engine/env";

/**
 * Service-role client: bypasses RLS. Server only, and only for:
 * - the research pipeline (runs without a user session),
 * - reading a published proposal snapshot by token for /opportunity/[token]
 *   (select public_content only, never internal tables).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") throw new Error("createAdminClient() called in the browser");
  const env = adminEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
