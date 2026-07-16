# Authentication Audit — Production Hardening Campaign (PHC) v1.0

Date: 2026-07-17
Branch: `main`

## Scope of this document

The campaign brief asks for complete resolution of every authentication
issue across signup, email verification, signin, redirect behavior,
session persistence, middleware, cookies, OAuth, logout, password reset,
protected routes, and production behavior. **All of that work was already
done in the immediately preceding session** on this same branch history
(commits `95fa273` and `2290b6f`), documented in full in
`PRODUCTION_AUTH_REPORT.md`. This document does not repeat that audit —
it re-verifies that today's campaign didn't regress it, and adds the one
new authentication-adjacent finding surfaced during today's security pass.

## What the prior session fixed (summary — see `PRODUCTION_AUTH_REPORT.md` for full detail)

1. **Root cause of the reported `otp_expired` redirect bug:** Supabase's
   email-confirmation and password-recovery links redirect with the
   session (or error) encoded in the URL *hash fragment*, which only
   client-side JS can read — nothing in the app read it. Fixed with a new
   `/auth/confirm` route + client handler; `signUpAction` now sets
   `emailRedirectTo` to point at it.
2. **Silent-static-prerendering risk:** every session-gated page's dynamic
   rendering depended on Next.js noticing a `cookies()` call during static
   analysis, which only happens if Supabase env vars are reachable at
   build time. Fixed with explicit `force-dynamic` on the app layout and
   root page.
3. **Middleware cookie-handling** hardened to Supabase's documented
   pattern (previously correct only by way of a Next.js internal
   implementation detail).
4. **Previously-dead `/forgot-password` link** — implemented the full
   forgot-password/reset-password flow.
5. Already-authenticated visitors now bounce off `/sign-in`, `/sign-up`,
   `/welcome` instead of re-seeing those forms (demo-mode sessions
   explicitly excluded).

That session investigated and **ruled out** (not just assumed clean) a
react-hook-form + Server Action redirect interaction via an isolated
Playwright reproduction, and verified the migration/env fixes against a
real local Postgres/Next.js build.

## Re-verification performed today

### 1. Confirmed no file overlap between today's changes and the auth core

Today's campaign touched: schema alignment (17 files — profile field
rename), `apps/web/lib/cron-auth.ts`, five unrelated feature server
actions (`interviews`, `journey`, `applications`, `notifications`,
`documents`), `packages/lib/src/ai/generate.ts`, the assistant API route,
`packages/lib/src/constants/integrations.ts`, the daily-briefing cron.

None of these are in `features/auth/*`, `packages/lib/src/supabase/
{client,server,proxy}.ts`, `app/auth/*`, or the `(marketing)/{sign-in,
sign-up,welcome,forgot-password,reset-password}` route group — the
authentication core from the prior session is untouched.

### 2. Full auth e2e re-run

```
e2e/auth-confirm.spec.ts   — 3/3 passed
e2e/demo-mode.spec.ts      — 5/5 passed
```

Both suites exercise the hash-fragment confirm-link handling, the
forgot-password link, and demo-mode session/redirect behavior. All pass
against today's `main`, confirming the prior fixes hold.

### 3. New finding this session: cron authentication (not user authentication)

`apps/web/lib/cron-auth.ts` — which gates the three scheduled background
jobs, not any user-facing sign-in path — compared the bearer token with a
plain `!==`, a non-constant-time secret comparison. This is adjacent to
"authentication" in the broad sense (it's how the daily-briefing,
job-ingestion, and interview-reminder cron routes authenticate the
caller) but has nothing to do with user signup/signin/session flows.
Fixed with a constant-time comparison; see `DEFECT_REGISTER.md` PHC-02 for
full detail. Logged here because the campaign brief explicitly lists
"middleware" and "production behavior" as authentication concerns, and
this is the one item in that neighborhood this session found.

## What could not be verified, today or previously

This environment has no network path to any live Supabase project — the
proxy's own connection log shows outbound connections to a configured
Supabase project being actively rejected by policy (documented in detail
in the prior session's work). This means, both then and now:

- No real signup → email → click-through → session round trip was
  performed.
- No real OAuth provider consent flow was exercised.
- No real concurrent-session / RLS-under-load test was run.
- The five ownership-scoping fixes in `DEFECT_REGISTER.md` PHC-03/PHC-04
  are verified by code inspection and RLS-policy reading, not by an actual
  cross-user attack attempt against a live database (which would require
  two real authenticated sessions this environment cannot create).

**One manual verification is still recommended** (carried over from the
prior session's report, still outstanding): a real sign-up → email
confirmation click-through in the actual Vercel deployment, after adding
`https://<your-domain>/auth/confirm` to Supabase's Redirect URLs
allowlist. Nothing in today's campaign changes that requirement or
resolves it further — it remains the one piece of this system that only
a live environment can confirm.

## Conclusion

Authentication is unchanged and re-confirmed working (in the ways this
environment can confirm) as of `main` at the end of this campaign. No new
user-facing authentication defects were found. One cron-authentication
hardening fix was applied and is unrelated to user sessions.
