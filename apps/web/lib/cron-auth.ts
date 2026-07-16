import { NextResponse } from "next/server";

/**
 * Guards a background job route so it can only be triggered by the
 * scheduler (Vercel Cron) that knows the shared secret, never by an
 * arbitrary public request. Fails closed: if `CRON_SECRET` has not been
 * configured, the route reports itself as disabled rather than running
 * unauthenticated. Not marked `server-only` — Route Handlers already only
 * ever execute on the server, and the guard would block this file's own
 * unit tests (which run under a jsdom environment).
 */
export function verifyCronRequest(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — this background job is disabled until it is set." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
