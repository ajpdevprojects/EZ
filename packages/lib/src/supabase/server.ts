import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Server Supabase client for Server Components, Route Handlers, and
 * Server Actions. Returns null when Supabase has not been configured.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  // Diagnostic only — names and value lengths, never raw token values, so
  // this is safe to leave in logs (a leaked cookie value is a hijackable
  // session; a leaked name/length is not).
  console.error("[supabase/server createClient] cookies visible to this request", {
    names: cookieStore.getAll().map((c) => `${c.name} (${c.value.length}b)`),
  });

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        console.error("[supabase/server createClient] setAll invoked — session is being refreshed/rotated", {
          names: cookiesToSet.map((c) => c.name),
        });
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (err) {
          // Called from a Server Component with no request context to write
          // to — expected in that case, since session refresh should have
          // already happened in middleware. Logging the fact that it fired
          // here at all is the important signal: if it does, this request's
          // refreshed/rotated tokens are being silently discarded, and the
          // *next* request's cookie may already be invalid at Supabase's
          // end (refresh tokens are single-use).
          console.error(
            "[supabase/server createClient] setAll threw — refreshed session could not be persisted from this context",
            { message: err instanceof Error ? err.message : String(err) },
          );
        }
      },
    },
  });
}
