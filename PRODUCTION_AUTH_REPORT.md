# Production Authentication Audit & Fix Report

Date: 2026-07-16
Scope: `packages/lib/src/supabase/*`, `apps/web/features/auth/*`, `apps/web/app/(app)/layout.tsx`,
`apps/web/app/page.tsx`, `apps/web/app/(marketing)/*`, `apps/web/app/auth/*`.

## Summary

Two root causes were found and fixed:

1. **The app has no code path that can ever turn a Supabase email-confirmation
   or password-recovery link into a session**, because those links redirect
   with the session (or an error) encoded in the URL *hash fragment*, and
   nothing in the app ever reads `window.location.hash`. This is the direct
   cause of the reported `/welcome#error=access_denied&error_code=otp_expired`
   — and, more importantly, means a **successful** confirmation click was
   silently failing the same way, just without an error in the URL to notice.
2. **Every session-gated page's dynamic rendering was implicit, not
   guaranteed** — it depended on Next.js's static-analysis heuristic noticing
   a `cookies()` call, which only happens if `getSupabaseEnv()` finds valid
   env vars *at build time*. I reproduced a build where that heuristic
   silently failed and **every authenticated page — `/home` included — got
   prerendered once as static HTML showing the signed-out demo profile**,
   with zero error or warning. That is a plausible, and now closed, cause of
   "sign in succeeds but the app doesn't navigate correctly."

A third finding — react-hook-form's `handleSubmit` wrapping the sign-in
Server Action — was investigated as a suspect and **empirically ruled out**;
see the verification section for how.

All fixes are committed to `claude/supabase-production-verify-6cbio6`.

---

## What I could and couldn't verify

This session runs in a network-sandboxed cloud environment. The proxy log
showed outbound connections to the configured Supabase project being
actively rejected by network policy (`connect_rejected`, 403). I could not:

- Reach the live Supabase project's REST/Auth API from here.
- Complete a real email round-trip (no inbox access).
- Inspect the actual Vercel deployment's environment variables or the
  Supabase dashboard's Auth → URL Configuration / email templates.

What I *did* verify empirically, without needing live Supabase access:

- Built minimal, isolated reproductions of the exact `react-hook-form` +
  Server Action `redirect()` pattern used by the real sign-in form, ran them
  in a real browser via Playwright, and confirmed navigation works correctly
  — ruling out that hypothesis rather than assuming it.
- Rebuilt the app with and without correctly-named Supabase env vars and
  diffed the route table, proving the static-prerendering failure mode is
  real and reproducible, then proving the `force-dynamic` fix closes it in
  both configurations.
- Added a permanent Playwright test that drives `/auth/confirm` with the
  exact `#error=access_denied&error_code=otp_expired` fragment from the bug
  report and confirms it now renders a clear, actionable error screen
  instead of silently landing on `/welcome`.
- Ran the full existing 27-test demo-mode e2e suite after every change to
  make sure nothing regressed, plus 3 new tests (30/30 passing).

**I could not verify the full real-Supabase email round trip (signup →
inbox → click → session → /home) end-to-end**, since that requires network
access this environment doesn't have. The fix is built on Supabase's
documented `@supabase/ssr` + hash-fragment redirect behavior and the
project's own reproduced evidence (the exact error string in the bug
report), but you should do one real signup-confirmation click-through in
your Vercel preview before considering this fully closed. See "How to do
the one verification I couldn't."

---

## Audit results, area by area

### 1. Supabase auth configuration
`packages/lib/src/supabase/env.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Confirmed these are the names the codebase
requires (matches `apps/web/.env.example`). No code change needed here, but
note: this sandbox's own ambient environment variables use Supabase's newer
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` naming, which
this codebase does *not* recognize. That mismatch is not present in your
Vercel config (you confirmed registration/verification already work there,
which requires a non-null Supabase client), but it's worth a deliberate
double-check since it's exactly the kind of thing that silently degrades to
demo mode with no error — see Finding 2.

### 2. Server actions (sign in, sign up, sign out) — FIXED
- `signInAction`, `signOutAction`: reviewed, unchanged. Verified the
  `redirect()`-after-Server-Action mechanism works correctly through the
  isolated repro (see Verification section).
- `signUpAction`: **fixed**. It never set `emailRedirectTo`, so Supabase used
  whichever "Site URL" is configured in the dashboard — which this app's own
  `/auth/callback` route can't necessarily complete (see Finding 1). It also
  called `redirect("/onboarding")` unconditionally, even when Supabase
  returns a user with no session (confirmation required) — meaning the
  server action's `redirect()` in that case had nothing behind it, no
  session existed, and the very next page load would just bounce the user
  right back to `/sign-in`, invisibly. Now: sets `emailRedirectTo` to this
  app's own `/auth/confirm`, and only redirects into `/onboarding` when
  `signUp()` actually returns an active session; otherwise it tells the
  person to check their email.
- Added `forgotPasswordAction`, `resendConfirmationAction`,
  `resetPasswordAction` (new — see Finding 1 and 3).

### 3. Session persistence — reviewed, no change
`apps/web/lib/session.ts`'s `getCurrentSession()` correctly reads the user
via the server Supabase client (cookie-backed) and falls back to a demo
profile only when Supabase isn't configured at all. Sound.

### 4. Cookie handling — hardened
`packages/lib/src/supabase/server.ts` and `client.ts`: standard
`@supabase/ssr` usage, no issues.

`packages/lib/src/supabase/proxy.ts` (the middleware/session-refresh logic):
traced through Next.js's actual `NextResponse.next()` implementation and
confirmed the existing cookie-propagation order was *technically* correct —
but only because of an internal implementation detail (the response's
`cookies.set()` proxy re-reads the live `request.headers` reference on every
call). That's not something to depend on. **Changed** it to the pattern
Supabase's own Next.js SSR guide documents: recreate the `NextResponse`
*inside* `setAll`, after the request cookies are mutated, so correctness
doesn't rely on an internal `NextResponse` detail that could change in a
future Next.js version.

### 5. Middleware — reviewed
`apps/web/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`;
confirmed this is a real supported convention, not a misnamed file, by
checking `next/dist/lib/constants.js` for `PROXY_FILENAME`). Matcher
excludes static assets only; correctly runs on every navigation and API
route. No change needed beyond the cookie hardening in #4.

### 6. Route protection — reviewed, no change
Every route under `app/(app)/` and the root `app/page.tsx` calls
`getCurrentSession()` and redirects to `/sign-in` (or `/onboarding`) when
appropriate. Consistent across ~20 files. Sound pattern; the fix in Finding
2 makes its *rendering* guarantee explicit rather than implicit.

### 7. Redirect logic — FIXED (two issues)
- **Finding 1** (hash-fragment handling) — see below.
- `/sign-in`, `/sign-up`, `/welcome` never checked whether the visitor was
  already signed in — an authenticated user landing back on `/sign-in` for
  any reason would just see the form again instead of bouncing to `/home`.
  **Fixed**: all three now redirect real (non-demo) authenticated sessions
  to `/home` or `/onboarding`. Demo-mode sessions are explicitly excluded
  from this check (`!session.isDemo`), since demo mode's session is a
  permanent stand-in that must keep landing on these pages so the product
  stays explorable without credentials — verified against the existing
  `e2e/demo-mode.spec.ts` suite, which still passes unmodified.
- `/forgot-password` was linked from the sign-in form (`sign-in-form.tsx`)
  but the route didn't exist (404). **Fixed** — implemented for real (see
  Finding 3).

### 8. Email verification flow — FIXED (Finding 1, the main bug)

**Root cause.** Supabase's default email-confirmation link works like this:
the user clicks a link to `{SUPABASE_URL}/auth/v1/verify?token=...&type=
signup&redirect_to=X`. Supabase verifies the token *server-side* inside
GoTrue, then redirects the browser to `X` with the outcome encoded in the
**URL hash fragment** — either `#access_token=...&refresh_token=...&type=
signup` on success, or `#error=access_denied&error_code=otp_expired&
error_description=...` on failure/expiry. This is fundamentally different
from the OAuth `?code=` flow.

Hash fragments are **never sent to the server** — only client-side
JavaScript running on the page they land on can read
`window.location.hash`. I searched the entire `apps/web` tree: there is no
code anywhere that reads `location.hash`, and the only auth-completion route
(`/auth/callback`) exclusively handles `?code=` (the OAuth PKCE flow). There
was also no `emailRedirectTo` set on `signUp()`, so `redirect_to` fell back
to whatever Site URL is configured in the Supabase dashboard — which, per
the bug report, resolves to somewhere that itself redirects unauthenticated
visitors to `/welcome` (matching `app/page.tsx`'s `if (!session)
redirect("/welcome")`, since URL fragments survive a server-side redirect
in the browser).

This means: **even a successful, non-expired confirmation click was silently
failing to establish a session.** The `otp_expired` case just happened to
leave visible evidence in the URL bar; the success case failed the exact
same way with no evidence at all — the tokens landed in a fragment nobody
read, then vanished on the next navigation.

**Fix.**
- `signUpAction` now passes `emailRedirectTo: {origin}/auth/confirm?next=
  /onboarding`, using the request's own `Host`/`X-Forwarded-*` headers (not
  a hardcoded value) so it's correct in every environment.
- New route `apps/web/app/auth/confirm/page.tsx` + client component
  `features/auth/components/confirm-handler.tsx`: reads
  `window.location.hash` on mount. If it contains `access_token`/
  `refresh_token`, calls `supabase.auth.setSession(...)` (browser client —
  this writes the session into the cookie-backed storage `@supabase/ssr`
  uses, so it's immediately visible to the server on the next request),
  clears the fragment from the URL, and routes to `/reset-password` (for
  `type=recovery`) or the `next` destination (for signup). If it contains
  `error`/`error_code`/`error_description`, it shows a clear "That link
  expired" screen with the actual reason and a resend action — **this is
  the fix for the exact bug reported**, verified by a new Playwright test
  that reproduces `#error=access_denied&error_code=otp_expired` verbatim.
- New `resendConfirmationAction` (`supabase.auth.resend({type:"signup"})`)
  wired into that error screen.

**Operational requirement — this needs one dashboard change I cannot make
from here:** Supabase only honors `emailRedirectTo`/`redirectTo` values that
are on the project's **Auth → URL Configuration → Redirect URLs** allow-list;
otherwise it silently falls back to Site URL. Add
`https://<your-production-domain>/auth/confirm` (and the equivalent for any
preview/staging domains) to that list, or this fix will not take effect in
production even though it's fully correct in the code.

### 9. OAuth flow — reviewed, no change
`oauth-buttons.tsx` calls `signInWithOAuth({ redirectTo: "{origin}/auth/
callback" })`. `createBrowserClient` defaults to PKCE flow, which redirects
with a `?code=` query param — the flow `/auth/callback` already handles
correctly. This is architecturally sound and distinct from the email-link
hash-fragment problem in Finding 1 (OAuth's PKCE code exchange and GoTrue's
`/verify` OTP-verification redirect are different mechanisms with different
wire formats).

### 10. Home/dashboard redirect after login — FIXED (Finding 2)

**Root cause, reproduced.** I built with `NEXT_PUBLIC_SUPABASE_ANON_KEY`
absent (or misnamed) and inspected the build output: `/home` and every other
route under `(app)/` built as `○ Static` — prerendered *once*, at build
time, using the demo-mode fallback profile, with **no build warning or
error**. `getCurrentSession()` short-circuits to the demo profile before
ever calling `cookies()` when `getSupabaseEnv()` returns null, so Next.js's
static-analysis pass never sees the dynamic API call it needs to see to
mark the route dynamic. In that state, a real user signing in and being
redirected to `/home` would be served the cached static HTML — the demo
profile, not their own session — indistinguishable from "doesn't navigate
correctly."

I then rebuilt with correctly-named env vars present and confirmed every one
of those routes switched to `ƒ Dynamic`, proving the *cause*. I also
investigated and **ruled out** a more mundane theory — that
`react-hook-form`'s `handleSubmit` (which internally catches and re-throws
whatever the wrapped `onSubmit` throws, including Next's special
`NEXT_REDIRECT` signal) breaks the redirect — by building an isolated
reproduction of the exact pattern and driving it with Playwright; navigation
worked correctly both with and without the react-hook-form wrapper.

**Fix.** Added `export const dynamic = "force-dynamic"` to
`app/(app)/layout.tsx` (which, in the App Router, forces every nested route
dynamic — one change covers all ~20 protected pages) and to the root
`app/page.tsx`. This makes the dynamic-rendering guarantee explicit instead
of dependent on Next.js noticing a conditional `cookies()` call at build
time. Rebuilt with env vars *removed entirely* afterward and confirmed every
protected route is still `ƒ Dynamic` — the class of bug is closed regardless
of what env vars are or aren't present at build time.

### 11. Logout flow — reviewed, no change
`signOutAction` calls `supabase.auth.signOut()` then `redirect("/welcome")`.
`SignOutButtonwrapped` in `useTransition`, standard pattern, sound.

### 12. Refresh/session restoration — reviewed, no change (beyond #4)
`proxy.ts` refreshes the session via `supabase.auth.getUser()` on every
request; combined with the cookie-handling hardening in Finding 4/#4, this
is correct.

### 13. Production behavior on Vercel
Everything above applies directly to Vercel. Two things specific to Vercel
worth calling out:
- The `force-dynamic` fix (#10) matters *more*, not less, on Vercel — a
  stale static build of an authenticated page would be served from Vercel's
  Edge/CDN cache to every visitor, not just the one whose build produced it.
- `getOrigin()` (new, in `actions.ts`) reads `x-forwarded-proto` /
  `x-forwarded-host` / `host`, which Vercel sets correctly by default; no
  extra env var needed for `emailRedirectTo` to resolve to the right
  domain.

---

## Files changed

- `packages/lib/src/validation/auth.ts` — added `forgotPasswordSchema`,
  `resetPasswordSchema`.
- `packages/lib/src/validation/auth.test.ts` — tests for the above.
- `packages/lib/src/supabase/proxy.ts` — cookie-handling hardening (#4).
- `apps/web/features/auth/actions.ts` — `emailRedirectTo` fix,
  `getOrigin()` helper, `forgotPasswordAction`, `resendConfirmationAction`,
  `resetPasswordAction`, sign-up now distinguishes "confirmation required"
  from "signed in".
- `apps/web/features/auth/components/confirm-handler.tsx` — new; the
  hash-fragment handler (Finding 1's core fix).
- `apps/web/features/auth/components/forgot-password-form.tsx`,
  `reset-password-form.tsx` — new.
- `apps/web/features/auth/components/sign-up-form.tsx` — renders the new
  informational (non-error) message state.
- `apps/web/app/auth/confirm/page.tsx` — new route.
- `apps/web/app/(marketing)/forgot-password/page.tsx`,
  `app/(marketing)/reset-password/page.tsx` — new routes.
- `apps/web/app/(marketing)/sign-in/page.tsx`,
  `app/(marketing)/sign-up/page.tsx`, `app/(marketing)/welcome/page.tsx` —
  redirect already-authenticated (non-demo) visitors away.
- `apps/web/app/(app)/layout.tsx`, `apps/web/app/page.tsx` —
  `export const dynamic = "force-dynamic"` (Finding 2's fix).
- `apps/web/e2e/auth-confirm.spec.ts` — new regression tests, reproducing
  the exact bug-report error string.

## Verification performed

- `pnpm typecheck` — clean, 4/4 packages.
- `pnpm lint` — clean (one pre-existing, unrelated React Compiler warning
  in `resume-editor.tsx`).
- `pnpm build` — clean, verified route dynamic/static table twice (with and
  without Supabase env vars present).
- `pnpm test` — 169/169 unit tests pass (11 new).
- `pnpm test:e2e` — **30/30 e2e tests pass**: all 27 pre-existing demo-mode
  tests (unmodified, confirming no regression from the new
  already-authenticated redirects) + 3 new tests directly reproducing and
  verifying the fix for the reported `otp_expired` bug.
- Isolated Playwright reproduction (not part of the permanent suite) proving
  `redirect()` inside a Server Action invoked through
  `react-hook-form.handleSubmit` correctly navigates — used to rule out a
  hypothesis, not to prove the fix.
- Two full production builds diffed by route type to prove Finding 2's cause
  and confirm the fix, in both the "env vars present" and "env vars absent"
  configurations.

## What I could not do from this environment

- I have no network path to your live Supabase project (verified via the
  proxy's own connection log, which shows the connection being rejected by
  policy) — so I could not apply/verify migrations against it, could not
  drive a real signup → email → click → session flow, and could not inspect
  your actual Supabase dashboard or Vercel environment variables.
- **One manual check I'd recommend before calling this fully closed:** add
  `https://<your-domain>/auth/confirm` to Supabase's Redirect URLs allowlist
  (see #8), then do one real sign-up, click the confirmation email, and
  confirm you land on `/onboarding` already signed in rather than on
  `/sign-in`.
