import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Browser Supabase client. Returns null when Supabase has not been
 * configured (no project URL / anon key) so the app can still run in a
 * local demo mode without live credentials.
 */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  return createBrowserClient<Database>(env.url, env.anonKey);
}
