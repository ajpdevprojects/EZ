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

  // Diagnostic only — names and value lengths, never raw token values.
  console.error("[proxy updateSession] cookies on incoming request", {
    path: request.nextUrl.pathname,
    names: request.cookies.getAll().map((c) => `${c.name} (${c.value?.length ?? 0}b)`),
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        console.error("[proxy updateSession] setAll invoked — session is being refreshed/rotated", {
          path: request.nextUrl.pathname,
          names: cookiesToSet.map((c) => c.name),
        });
        // A setAll consisting solely of deletions is the SDK wiping the whole
        // session, which in middleware only ever happens because getUser()'s
        // token refresh failed. Refresh tokens are single-use, so parallel
        // requests (Next prefetches every visible link) race for the same
        // token; the losers get refresh_token_not_found even though the
        // winner just rotated the session successfully. Forwarding the
        // losers' deletions would wipe the winner's fresh cookies from the
        // browser and sign the user out mid-navigation. Genuinely dead
        // sessions still end up at /sign-in (no page sees a user) — their
        // stale cookies are cleaned up by the next sign-in/sign-out, both of
        // which run in Server Action context, not here.
        const isPureSessionWipe =
          cookiesToSet.length > 0 && cookiesToSet.every((cookie) => cookie.value === "");
        if (isPureSessionWipe) {
          console.error(
            "[proxy updateSession] suppressed session-wipe from a failed refresh (likely a lost refresh race with a concurrent request)",
            { path: request.nextUrl.pathname, names: cookiesToSet.map((c) => c.name) },
          );
          return;
        }
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

  const { data, error } = await supabase.auth.getUser();
  console.error("[proxy updateSession] auth.getUser() result", {
    path: request.nextUrl.pathname,
    userId: data.user?.id ?? null,
    errorCode: error?.code,
    errorStatus: error?.status,
    errorMessage: error?.message,
  });

  return response;
}
