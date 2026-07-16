import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth session on every request. No-ops when
 * Supabase has not been configured.
 */
export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) return NextResponse.next({ request });

  // `response` is intentionally re-created inside setAll (not reused from
  // outer scope) so it's always built from a request whose cookies already
  // reflect the refreshed session — otherwise the Server Component render
  // for *this* navigation can read stale request cookies even though the
  // browser receives the new ones. This is the cookie-handling pattern
  // Supabase's Next.js SSR guide specifies for this exact reason.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
