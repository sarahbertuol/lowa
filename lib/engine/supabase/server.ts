import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/engine/env";

/**
 * Supabase client for server components, route handlers and server actions, acting as the
 * signed-in user. Every query goes through RLS (only team members see data).
 */
export async function createUserClient() {
  const env = publicEnv();
  const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a server component, where cookies are read-only. The middleware
          // refreshes the session instead (OE-02).
        }
      },
    },
  });
}
