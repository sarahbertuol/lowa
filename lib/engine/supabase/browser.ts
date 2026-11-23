"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/engine/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Supabase client for /discover client components (signed-in user, RLS applies). */
export function getBrowserClient() {
  if (!client) {
    const env = publicEnv();
    client = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
