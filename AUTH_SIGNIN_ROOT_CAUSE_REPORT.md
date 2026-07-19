# Auth Sign-In Root Cause Report

Date: 2026-07-18
Branch: `main`

## Symptom

Sign Up works and reaches onboarding. Existing users completing Sign In
do not proceed into the authenticated app. No 4xx/5xx network responses,
no browser console errors, Supabase configured and connected, Vercel
deployment succeeds.

## Root cause

`apps/web/lib/session.ts`'s `getCurrentSession()` — called by every
protected page (`(app)/layout.tsx`, `/home`, and 13 other route files) —
treated **any failure to read the `profiles` row** identically to
**"nobody is signed in"**:

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return null;                 // correct: really not signed in

const { data: profileRow } = await supabase
  .from("profiles").select("*").eq("id", user.id).single();
if (!profileRow) return null;           // BUG: conflates "no profile row"
                                         // with "not signed in", even
                                         // though auth.getUser() above
                                         // just confirmed a real session
```

`@supabase/supabase-js`'s `.single()` never throws — it returns
`{ data: null, error }` for every failure mode: the row genuinely doesn't
exist, RLS denies it, the table doesn't exist, or a transient error
occurred. The code only ever destructured `data`, discarding `error`
entirely, so all of these collapse into the same silent `return null`.
Every session-gated page's `if (!session) redirect("/sign-in")` then
bounces a **genuinely authenticated** user straight back to the sign-in
page — with no error thrown, no failed network request the browser would
show as 4xx/5xx (it's a server-side Postgres query inside the RSC render,
not a distinct fetch the Network tab tracks), and no console output.

### Why the profile row can be missing for a real user

New profile rows are created by `public.handle_new_user()`, a
`SECURITY DEFINER` trigger on `auth.users` insert
(`supabase/migrations/20260101000000_init_schema.sql`). That trigger
bypasses RLS by running with the function owner's privileges, so it works
regardless of policy state — but only when it actually ran. It doesn't
fire for a user created before the trigger existed, or if the migration
that installs it never fully applied (this repository's own migration
history includes exactly that case: `20260101000000_init_schema.sql`
originally failed at a later, unrelated statement — see
`DEFECT_REGISTER.md` PHC-01 / `SCHEMA_ALIGNMENT_REPORT.md` — meaning any
signup that happened against a database where that migration hadn't yet
been corrected and re-applied would have no working trigger and no
profile row).

### Why fixing the code path alone wasn't enough

The natural fix — have `getCurrentSession()` create the missing row
itself, since `auth.getUser()` already proved the session is real — runs
as the signed-in user's own RLS-scoped client, not the trigger's
elevated privileges. `profiles` had RLS policies for `select` and
`update` only, no `insert`:

```sql
create policy "profiles are viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "profiles are updatable by owner" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
```

Verified empirically against a local PostgreSQL 16 instance running the
actual migration files: attempting the self-heal insert as the
`authenticated` role, before adding a policy, fails —

```
ERROR:  permission denied for table profiles
```

— then succeeds once the new policy (below) is applied, and is correctly
*still* denied when attempting to insert a row for a different user's id
(`new row violates row-level security policy for table "profiles"`),
confirming the policy is scoped correctly rather than opened too wide.

## Why Sign Up worked while Sign In failed

Both `signInAction` and `signUpAction` use the identical mechanism —
same `createClient()`, same `redirect()` pattern — and both correctly
establish a session. The difference is entirely in what they redirect
*to*:

- `signUpAction` redirects to `/onboarding`
  (`apps/web/app/onboarding/page.tsx`), which has **no session check at
  all** — it just renders the wizard. A broken profile lookup is
  invisible there; the page "succeeds" regardless of whether the session
  or profile layer works.
- `signInAction` redirects to `/home`, which sits under
  `(app)/layout.tsx` — the one place that calls `getCurrentSession()` and
  acts on a `null` result by redirecting away. This is the first point in
  either flow where the bug becomes observable.

So "Sign Up works, Sign In fails" was never evidence that sign-up and
sign-in behave differently at the Supabase Auth level — they don't. It's
evidence that only one of their two redirect targets happens to depend on
the thing that was actually broken.

## Item-by-item verification (per the six items requested)

1. **`signInAction()` completes successfully** — confirmed by code
   reading: `signInWithPassword` → on success, unconditionally
   `redirect("/home")`. No hidden failure path.
2. **Supabase session cookies are written** — `packages/lib/src/
   supabase/server.ts`'s `createClient()` wires `cookieStore.set()` into
   the `setAll` callback, which Server Actions have request context for.
   This mechanism was independently verified working in the prior
   session's authentication audit (`PRODUCTION_AUTH_REPORT.md`) via an
   isolated Playwright reproduction of the exact `redirect()`-inside-
   Server-Action pattern used here; nothing in this investigation found
   reason to revisit that finding.
3. **Middleware/proxy recognizes authenticated sessions** —
   `packages/lib/src/supabase/proxy.ts`'s `updateSession()` correctly
   recreates the response after mutating request cookies (the pattern
   Supabase's SSR guide specifies) and runs on every route via
   `apps/web/proxy.ts`'s matcher. No caching directive
   (`revalidatePath`/`unstable_cache`/`export const revalidate`) exists
   anywhere in the auth-adjacent pages — confirmed by grep — so nothing
   masks or delays a session state change.
4. **`/home` authentication logic** — this is where the bug actually
   lived: `getCurrentSession()`, called from both `(app)/layout.tsx` and
   `/home/page.tsx` directly. Fixed (see below).
5. **Redirect chain after login** — `signInAction` → `/home` →
   `(app)/layout.tsx` → `getCurrentSession()`. Confirmed the chain itself
   is correct; the failure was inside the last link, not the chain
   structure.
6. **Redirect loop between `/welcome` and `/home`** — investigated
   directly, no loop mechanism found. `getCurrentSession()` has no
   memoization or caching, so for a given user its result is consistent
   across requests within the same underlying auth/profile state — under
   the bug, that means a **consistent** `null`, producing a **dead-end**
   bounce to `/sign-in` (the target `(app)/layout.tsx` actually redirects
   to), not an oscillation between two pages. A genuine `/welcome` ↔
   `/home` loop would require `getCurrentSession()` to return different
   results across near-simultaneous requests for the same session, which
   would need a caching or race condition this codebase doesn't have. Not
   fabricating a loop finding that the evidence doesn't support — the
   dead-end-at-sign-in explanation fits every reported symptom precisely
   and is the one actually verified.

## Fix

### 1. `apps/web/lib/session.ts` — self-heal instead of silently logging out

When `auth.getUser()` confirms a real session but the profile row can't
be read, insert it (mirroring what `handle_new_user()` should have done)
instead of returning `null`. Only degrades to `null` if the insert itself
also fails (e.g., the table genuinely doesn't exist — a strictly worse
problem that does legitimately mean the app can't proceed).

### 2. `supabase/migrations/20260201060000_profiles_insert_policy.sql` — new

```sql
create policy "profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);
```

Additive only, mirrors the existing select/update policies exactly. This
migration **must be applied to the live database** for the fix to take
effect there — this environment has no network path to the production
Supabase project (established repeatedly in prior sessions' reports; see
"What remains outstanding" below).

## Files changed

- `apps/web/lib/session.ts` — self-healing profile lookup
- `apps/web/lib/session.test.ts` — new; reproduction + regression tests
- `supabase/migrations/20260201060000_profiles_insert_policy.sql` — new

## Verification performed

### Reproduction (before the fix)

`apps/web/lib/session.test.ts`, run against the unfixed code: the
"REPRODUCTION" test — an authenticated user (`auth.getUser()` returns a
real user) whose profile query returns `{ data: null, error }` — asserted
`getCurrentSession()` returns a valid session and **failed**, returning
`null` instead. This is the bug, reproduced directly, not inferred.

### Regression tests (after the fix)

All 4 tests in `session.test.ts` pass:
- The reproduction case now self-heals and returns a valid session.
- A `PGRST116` ("0 rows") profile-lookup failure specifically triggers
  the insert path, and the inserted row's shape is asserted.
- A normal case where the profile row is found on the first try still
  works, and does **not** insert (no wasted write for the common path).
- A genuinely unauthenticated user (`auth.getUser()` returns no user)
  still correctly returns `null` without ever querying `profiles`.

### Database-level verification (empirical, not assumed)

Ran the actual migration files against a local PostgreSQL 16 instance
(with a minimal `auth` schema stub standing in for Supabase's
platform-provisioned objects, including the default `GRANT` Supabase
applies to the `authenticated` role — confirmed necessary by first
observing `permission denied for table profiles` even with a correct RLS
policy, before adding the grant, which the live Supabase project already
has since existing select/update operations work today):

1. Simulated the trigger having never fired (deleted a trigger-created
   profile row) and attempted the self-heal insert as the `authenticated`
   role scoped to that user — denied (`permission denied for table
   profiles`) before the new migration.
2. Applied `20260201060000_profiles_insert_policy.sql` — the same insert
   now succeeds.
3. Attempted to insert a profile row for a **different** user id under
   the same session — correctly denied (`new row violates row-level
   security policy`), confirming the policy isn't overly permissive.
4. Ran the full migration sequence end-to-end, all 8 files in order,
   confirming no conflict with any earlier migration (one file,
   `20260201010000_documents_storage.sql`, fails in this bare-Postgres
   harness because it references Supabase's platform-managed
   `storage.buckets`/`storage.objects`, which don't exist outside a real
   Supabase project — an environment limitation, not a regression; it was
   already excluded from local verification in prior sessions for the
   same reason).

### Full application validation suite

- `pnpm typecheck` — clean, 4/4 packages
- `pnpm lint` — clean, 0 errors (1 pre-existing, unrelated warning)
- `pnpm test` — **25/25** unit tests in `web` (21 prior + 4 new), 178
  total across the monorepo unaffected elsewhere
- `pnpm build` — clean production build
- `pnpm test:e2e` — **58/58** Playwright tests pass, including demo-mode
  and auth-confirm suites, confirming no regression

## What "verify on Vercel" could and couldn't mean here

This environment has no network path to any live Supabase project or
Vercel deployment (established and re-verified across every prior
session on this branch — outbound connections to the configured project
are rejected by network policy). "Verified locally" above means: the
exact bug was reproduced and fixed in isolation with mocks, the fix's
database dependency (the new RLS policy) was verified against a real
PostgreSQL instance running the actual migration files, and the full
application validates cleanly. It does **not** mean a real sign-in was
performed against the live Vercel deployment — that step requires the
project owner, for the same reason every prior report on this branch has
flagged it.

## What remains outstanding

1. **Apply `20260201060000_profiles_insert_policy.sql` to the live
   database** — required for the fix to take effect in production. Same
   constraint as every previous migration in this campaign: apply via the
   Supabase Dashboard SQL editor or `supabase db push --linked` from an
   environment with network access to the project.
2. **Confirm existing affected users can now sign in** — once the
   migration is applied, any user who was stuck (real `auth.users` row,
   missing `profiles` row) will self-heal on their next sign-in attempt
   automatically; no manual data repair should be needed.
3. **One real sign-in verification in the live Vercel deployment** is the
   only way to close the loop this environment cannot perform — carried
   forward as the same category of outstanding manual verification noted
   in `PRODUCTION_AUTH_REPORT.md` and `AUTHENTICATION_AUDIT.md`.

---

## Addendum — 2026-07-17: re-investigation after production evidence contradicted this report

Live production evidence, reported directly by the project owner after
commit `c7e4160` (which included the self-heal fix above) had already been
deployed:

- Auth users exist in `auth.users`.
- `public.profiles` is **empty**.
- `public.handle_new_user()` does not exist.
- `on_auth_user_created` does not exist.
- `"profiles are insertable by owner"` (the INSERT policy from this
  report) **does** exist.
- Sign In still cannot proceed past the login screen.

This directly contradicts this report's framing that the trigger was
"not the primary mechanism" and that the self-heal insert would cover for
its absence. It doesn't — the table is empty, meaning the self-heal path
is either never reached or never succeeding. This addendum documents a
from-scratch re-investigation that assumed nothing from the original
report was correct until re-verified, per explicit instruction not to
assume the prior fix was working.

### Finding 1: the self-heal insert had the exact bug it was written to fix

`getCurrentSession()`'s insert call read:

```ts
const { data: createdRow } = await supabase
  .from("profiles").insert({...}).select().single();
if (!createdRow) return null;
```

`error` was discarded — identical in shape to the original bug this report
fixed on the `select()` call, just one insert-call later. If the insert
failed for *any* reason in production (a missing platform GRANT, a schema
mismatch, an RLS edge case not covered by local testing, anything), there
would be no log line, no thrown error, nothing — just a silent `null`,
indistinguishable from "not signed in." This is a real gap in this
report's original verification: the reproduction tests
(`session.test.ts`) used a hand-mocked Supabase client that always made
the insert succeed, so this path was never exercised against a failure
case.

Fixed in `apps/web/lib/session.ts`: `auth.getUser()`, the profile
`select()`, and the self-heal `insert()` now each log their outcome
(`console.error`, since Vercel captures stderr in function logs) with the
Supabase error's `code`/`message`/`details`/`hint` on failure. Same
instrumentation added at both `redirect()` decision points in
`(app)/layout.tsx`, and at both branches of `signInWithPassword` in
`signInAction`. These cover exactly the five checkpoints requested:
`auth.getUser()` result, profile lookup result, whether the insert
executes, the insert result/error, and why `/home` redirects. The next
real sign-in attempt in the live deployment will produce a definitive
answer in Vercel's function logs — something no amount of local
inspection can substitute for, since this sandbox has no network path to
the live Supabase project or Vercel deployment (unchanged from every
prior report on this branch).

### Finding 2: the original report's "trigger is optional" conclusion was an overreach

The original report verified that the self-heal *insert statement* is
capable of succeeding, given the RLS policy and the standard
Supabase-provisioned `GRANT`, against a local PostgreSQL instance. That is
a real, valid finding — but it is not the same claim as "the self-heal
path in the deployed application actually runs and succeeds," which was
never verified end-to-end. Two gaps in that chain, neither exercised by
the mocked unit tests:

1. Whether `auth.getUser()` recognizes the session cookie on the very
   first server render immediately after `signInAction`'s redirect, in
   the real deployed runtime — not assumed here, but not verified either.
2. Whether the insert itself succeeds in the *actual* production
   database, which could differ from the local replica in ways this
   sandbox cannot observe (e.g. a revoked default `GRANT`, a constraint
   difference) — and, per Finding 1, would have failed *silently* even if
   it didn't.

Restated plainly: "the SQL can work" is not "the SQL is working." The
corrected position is that `public.handle_new_user()` is the **primary**
mechanism — it runs `SECURITY DEFINER` inside the same transaction as the
`auth.users` insert, bypassing RLS and the client's own session state
entirely, so it cannot fail for any of the reasons the client-side
self-heal can. The self-heal in `session.ts` is correctly framed as a
fallback for drift, not a replacement for the trigger, and the original
report should not have implied the trigger was dispensable.

### Corrected migration

`supabase/migrations/20260201070000_restore_handle_new_user_trigger.sql`
(new) does two things, both required by the verified production facts:

1. Restores `handle_new_user()` and `on_auth_user_created`
   (`create or replace` / `drop trigger if exists` + `create trigger`, so
   it's safe to run regardless of the target database's exact partial
   state) — fixes profile creation for **future** signups.
2. **Backfills every existing `auth.users` row that has no matching
   `public.profiles` row.** This is the part the trigger alone cannot
   fix: a trigger fires on new `INSERT`s into `auth.users`, not
   retroactively, and the verified production facts state the affected
   accounts already exist. Without this, restoring the trigger would stop
   the bleeding for new signups but leave every currently-locked-out user
   exactly as locked out as before.

Empirically verified against a local PostgreSQL 16 instance rebuilt to
match the exact verified production state (`profiles` table and its
insert/select/update policies present, `handle_new_user`/trigger absent,
one `auth.users` row with no matching `profiles` row):

- Applying the migration inserted exactly one row — the orphaned user —
  and left an already-resolved user's row untouched.
- A subsequent `insert into auth.users` (simulating a brand-new signup)
  then correctly produced a matching `profiles` row automatically via the
  restored trigger, with no application code involved.

### Local end-to-end reproduction attempt: what it did and didn't establish

To go beyond mocked unit tests, a minimal HTTP server
(`mock-supabase.mjs`, not committed — scratch tooling) was built to stand
in for Supabase's Auth and REST APIs, so the **real**
`@supabase/ssr`/`@supabase/supabase-js` code paths in this codebase could
run against it unmodified, driven through a real browser via Playwright.

This surfaced a failure — `signInWithPassword` rejecting with a
"Host not in allowlist"-shaped, non-JSON response — when exercised through
the actual `signInAction` Server Action inside the Next.js dev server.
Isolated by elimination before concluding anything from it:

- `curl`, plain Node `fetch`, and a standalone Node script using
  `@supabase/supabase-js`'s plain (non-SSR) client all reached the mock
  server successfully.
- A plain Next.js Route Handler doing `fetch()`, and the same Route
  Handler using the plain `@supabase/supabase-js` client, also succeeded.
- The same Route Handler switched to the actual
  `createClient()` from `packages/lib/src/supabase/server.ts` (the real
  `@supabase/ssr` `createServerClient` wrapper `signInAction` uses,
  integrated with Next's `cookies()`) **reproduced the failure**.
- A standalone Node script — no Next.js involved at all — calling that
  exact same `createServerClient()` construction against the same mock
  server **succeeded** (`{"hasSession":true}`).

That last result is decisive: the `@supabase/ssr` client construction
itself is not the cause, since it works correctly outside the Next.js dev
server. The failure is specific to running inside this sandbox's Next.js
dev server once a `cookies()`-triggered dynamic request is involved —
most likely this environment's own request interception reacting to
Next's dynamic-rendering fetch instrumentation, not application code. No
string resembling "Host not in allowlist" exists anywhere in this
repository's dependencies or this sandbox's filesystem, which is
consistent with it originating from the sandbox's own network layer
rather than from Supabase or Next.js source.

This is reported for transparency rather than omitted, but it is **not**
treated as a production-relevant finding: it could not be reproduced
outside the Next dev server, and this sandbox has no network path to
verify it either way against the real Vercel runtime. It's a dead end in
this particular reproduction technique, not a conclusion about the app.

### What this addendum does and does not establish

Does establish, empirically:
- A real, previously-unnoticed bug in this codebase's own self-heal code
  (silent error-swallowing on insert failure), now fixed with full
  instrumentation at every requested checkpoint.
- A migration that fixes the verified production symptom
  (`profiles` empty despite existing `auth.users` rows) directly and
  immediately upon application — the backfill does not depend on any
  user signing in again, and does not depend on the self-heal path
  working correctly at all.
- The restored trigger, verified against a local replica of the exact
  reported production schema state, both fixes future signups and cannot
  fail for the same reasons the client-side self-heal can.

Does not and cannot establish from this sandbox:
- The precise reason `auth.getUser()` / the self-heal insert were not
  producing a profile row in the *live* production runtime specifically —
  this sandbox has no network path to the live Supabase project or Vercel
  deployment, a limitation unchanged from every prior report on this
  branch. The instrumentation added this turn is what will answer that
  definitively, from real Vercel function logs, on the next sign-in
  attempt against the current deployment.
- Whether the "Host not in allowlist" artifact has any counterpart in the
  real Vercel/Supabase network path — treated as an unresolved, sandbox-
  specific dead end rather than asserted either way.

### Files changed this turn

- `apps/web/lib/session.ts` — instrumentation on all three Supabase calls
- `apps/web/app/(app)/layout.tsx` — instrumentation on both redirects
- `apps/web/features/auth/actions.ts` — instrumentation on
  `signInWithPassword` success/failure in `signInAction`
- `supabase/migrations/20260201070000_restore_handle_new_user_trigger.sql`
  — new; restores the trigger and backfills existing orphaned users,
  **must be applied to the live database** (same outstanding-application
  constraint as every migration in this campaign — this environment
  cannot reach the live project to apply it directly)

### What remains outstanding

1. **Apply `20260201070000_restore_handle_new_user_trigger.sql` to the
   live database.** This is the fix for the exact reported symptom
   (empty `profiles` table) and does not require anyone to sign in again
   for existing users to be repaired.
2. **Attempt a real sign-in against the current Vercel deployment** once
   the migration above is applied, and read the function logs — the
   instrumentation added this turn will show exactly which of the five
   checkpoints is failing, if any still are, with the actual Supabase
   error code/message/details attached rather than a silent `null`.
3. If the logs from step 2 show the self-heal insert itself is still
   failing even with the trigger restored (which would only matter for
   any future drift, since the trigger is now the primary path), the
   `insertError` fields logged will name the exact Postgres error to act
   on next — no further guessing required.

---

## Addendum — 2026-07-17 (second): the database was ruled out, so was the bug elsewhere in the redirect chain?

New production evidence, gathered after the migration above and the
first addendum's instrumentation were live:

- The browser holds a valid `sb-...-auth-token` cookie.
- `signInWithPassword()` succeeds and returns a session.
- The browser navigates to `/home`.
- `/home` immediately redirects back to `/sign-in`.
- `auth.users` and `profiles` have matching rows.
- `handle_new_user()` and `on_auth_user_created` exist.

This rules out everything the first addendum was uncertain about: the
database side is confirmed correct, so the self-heal path and the
trigger are no longer suspects. The symptom is now narrowed to exactly
one claim — **the server does not see the same session the browser has**
— and the instruction was to investigate `proxy.ts`
(`packages/lib/src/supabase/proxy.ts`, Next 16's rename of
`middleware.ts`), `packages/lib/src/supabase/server.ts`,
`apps/web/lib/session.ts`, every `createServerClient()` call site, and
every redirect guarding `/home`, and to instrument the cookies the server
actually receives.

### Code review of every requested file

- **`packages/lib/src/supabase/proxy.ts`** (the middleware) — follows
  Supabase's documented Next.js SSR pattern exactly: `response` is
  re-created inside `setAll` from the *mutated* `request`, so a
  same-request cookie refresh is visible to the Server Component render
  that follows. The matcher
  (`apps/web/proxy.ts`) excludes only static assets, not `/home`.
- **`packages/lib/src/supabase/server.ts`** — also the documented
  pattern: `cookies()` is read once per call and wired straight through
  to `createServerClient`. No custom `cookieOptions` (name/domain/path)
  anywhere in the codebase — confirmed by grep — so there is no
  browser/server cookie-name mismatch to find.
- **`apps/web/lib/session.ts`** — see "the one real defect found" below.
- **Every `createServerClient()` call site** — exactly two in the whole
  repository (`proxy.ts`, `server.ts`), both grepped and read in full.
  No third, divergent client construction exists anywhere. The browser
  client (`packages/lib/src/supabase/client.ts`, `createBrowserClient`)
  uses the same `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
  and no custom cookie options either, so it encodes/names cookies
  identically to what the server expects to read.
- **Every redirect guarding `/home`** — `(app)/layout.tsx` (`if
  (!session) redirect("/sign-in")`) and `home/page.tsx`'s own identical,
  redundant check. Both call `getCurrentSession()`, and — this turn's one
  real finding — both called it *independently*.

### The one real defect found: two un-memoized `getCurrentSession()` calls per request

Every navigation to `/home` calls `getCurrentSession()` twice: once from
`(app)/layout.tsx`, once from `home/page.tsx`. Before this turn, each
call built its own `createServerClient` from scratch and called
`auth.getUser()` independently — two separate round trips doing
identical work, with no coordination between them.

Verified locally, against the real `@supabase/ssr`/`@supabase/auth-js`
code (not a mock of it) driven by a hand-built mock Supabase Auth server,
exactly how `auth.getUser()` behaves near a token's expiry:

- `getUser()` (with no explicit JWT argument, which is how this codebase
  always calls it) goes through `_useSession` → `__loadSession`, which
  checks the stored session's `expires_at` against a **90-second
  proactive-refresh margin** (`EXPIRY_MARGIN_MS` in `@supabase/auth-js`'s
  constants) — independent of the `autoRefreshToken` setting, which only
  controls the background timer, not this on-demand check.
- Inside that margin, `getUser()` refreshes and **rotates the refresh
  token** (single-use) before answering.
- `createServerClient`'s built-in `onAuthStateChange` handler persists
  that rotation through the `setAll` callback this codebase provides —
  which, in `server.ts`, is wrapped in a `try { cookieStore.set(...) }
  catch {}` that **silently discarded any error** before this turn.
  `cookies().set()` always throws when called from a plain Server
  Component (as opposed to a Server Action or Route Handler) — Next.js
  gives Server Components no response to attach `Set-Cookie` headers to.
  So if a refresh happens while `home/page.tsx` (a Server Component) is
  rendering, the new tokens are computed but never saved, and the
  now-consumed old refresh token is gone.
- Two independent, un-memoized calls hitting this at once — as
  `(app)/layout.tsx` and `home/page.tsx` did every single request — would
  race for that one single-use refresh token. Confirmed the SDK is more
  resilient than the naive version of this theory predicts: a losing
  refresh attempt whose access token is *still* technically valid falls
  back to using it directly rather than failing outright (a documented
  "proactive-preserve" mirror in this version of `@supabase/auth-js`).
  But that fallback depends on the access token not having actually
  expired yet — only being inside the 90-second proactive margin. If it's
  raced at a moment where the access token has already passed its real
  expiry, the losing call has no fallback left and correctly, from the
  SDK's perspective, reports no user — which is indistinguishable from
  "not signed in" by the time it reaches `getCurrentSession()`.

Fixed by wrapping `getCurrentSession()` in React's `cache()`
(`apps/web/lib/session.ts`), the standard Next.js App Router mechanism
for per-request memoization of Server Component data fetching. Every
call within one request now reuses the first result instead of
re-deriving it, so there is exactly one `auth.getUser()` call per
request and no second client to race the first.

### What local reproduction could and could not confirm

Built several local scenarios against a real `GoTrueClient` (not a
hand-mocked one) and a mock Supabase Auth server implementing password
grant, refresh-token grant with single-use rotation, and `/user`:

1. **Long-lived token, single call** — succeeds, no refresh needed.
   Sanity check, not informative on its own.
2. **Token inside the 90s margin, middleware runs first** — the
   middleware's own `getUser()` call refreshes and correctly propagates
   the new cookie into the same request via `request.cookies.set()`, so
   the Server Component's later, independent call sees an
   already-fresh token and never attempts a second refresh. **No bug
   under this ordering** — which is the ordering Next.js should always
   use, since the middleware matcher includes `/home`.
3. **Simulated middleware not running at all** (bypassing `updateSession`
   entirely) with a near-margin token — still resolved correctly, via the
   SDK's still-valid-access-token fallback described above.
4. **Two concurrent, un-memoized calls sharing a token engineered to
   already be past real expiry** — did not reproduce a losing call either;
   the seeding step's own client transparently self-healed the session
   before the race began, which is itself informative (this SDK version
   is more defensive against exactly this class of bug than the naive
   theory assumes) but meant this specific construction couldn't force
   the failure state to observe it directly.

Reported honestly: **no local construction reproduced "browser has a
valid cookie, server sees none."** Every scenario the code review
suggested as plausible either worked correctly or was defended against
by the SDK's own fallback behavior. This is a genuine negative result,
not a gap — it means the bug, if it is exactly this refresh-race
mechanism, requires either real Vercel-infrastructure timing (concurrent
requests from a browser's parallel data-fetching, not achievable in a
single-process local repro) or a Supabase project configuration (e.g. a
non-default JWT expiry) that this sandbox cannot inspect and was
instructed not to investigate further.

### What the new instrumentation will show on the next real attempt

`packages/lib/src/supabase/proxy.ts` and `packages/lib/src/supabase/
server.ts` now log, at every checkpoint, the cookie **names and value
lengths** visible to that checkpoint (never raw values — a logged token
is a hijackable session; a logged name/length is not), and whether
`setAll` fires (meaning a refresh/rotation happened) at each of them,
including the exact error if persisting it throws. On the next real
sign-in attempt, Vercel's function logs will show, in order:

1. What cookies the middleware saw on the incoming `/home` request —
   compare the names directly against the browser's DevTools cookie
   panel for the same request.
2. Whether the middleware's own `getUser()` triggered a refresh, and
   what it rotated.
3. What cookies `(app)/layout.tsx`'s single (now memoized)
   `getCurrentSession()` call saw.
4. Whether *that* call also needed to refresh, and if its `setAll`
   threw — which, per the fix above, no longer discards the error
   silently.

If the logs show the middleware and the Server Component call disagree
on cookie names/count for the same request, that points at something
outside this codebase (a proxy/CDN header-size limit, a Vercel
Edge/Node runtime environment-variable mismatch between the two
execution contexts) rather than at this application's cookie-handling
code, which was read in full and found to follow the documented pattern
correctly at every call site.

### Files changed this turn

- `packages/lib/src/supabase/proxy.ts` — logs incoming cookie
  names/lengths, logs `setAll`/refresh firing, logs `auth.getUser()`'s
  result (user id or error code/status/message)
- `packages/lib/src/supabase/server.ts` — logs cookies visible to each
  `createClient()` call, logs `setAll`/refresh firing, and — the one
  behavior change beyond logging — surfaces the error when persisting a
  refresh throws instead of silently swallowing it
- `apps/web/lib/session.ts` — `getCurrentSession()` wrapped in React's
  `cache()` for per-request memoization, removing the duplicate-call
  race described above

### What remains outstanding

1. **A real sign-in attempt against the current Vercel deployment**,
   with the function logs read afterward — this is what will show
   definitively whether the cookies the middleware and the Server
   Component see actually match, and whether a refresh is firing where
   it shouldn't need to. Nothing short of the real deployment can settle
   this; every local construction this turn either worked or was
   defended against by the SDK, which is useful signal but not proof.
2. If the logs show a refresh firing on nearly every request (not just
   near-expiry), the Supabase project's configured **JWT expiry**
   setting is worth checking on the dashboard — a value close to or
   below the 90-second proactive-refresh margin would make every request
   hit this path, not just an edge case. This is Supabase project
   configuration, not application code, so it's named here rather than
   changed.

---

## Addendum — 2026-07-19 (third): the failure reproduced end-to-end, and two real defects fixed

Every prior local reproduction attempt on this branch failed to make the
real `@supabase/ssr` stack run inside Next.js in this sandbox — the dev
server's outbound fetches were intercepted by the sandbox's HTTP proxy
("Host not in allowlist"). This session cleared that blocker (`NO_PROXY`
for loopback + a production `next build && next start` instead of the dev
server) and, for the first time, drove the complete real flow — the
actual `signInAction`, middleware, cookie, and RSC code paths, unmodified
— through a real Chromium browser against a GoTrue-faithful mock Supabase
(password grant, single-use refresh-token rotation with the 10-second
reuse interval, family revocation on late reuse, PostgREST `profiles`).

### The reproduction

With the access-token TTL forced inside `@supabase/auth-js`'s 90-second
proactive-refresh margin and a session large enough to chunk the auth
cookie (both true of real deployments at the expiry boundary), the exact
reported symptom appeared: **login succeeds, `/home` bounces to
`/sign-in`, and the browser's session cookies are destroyed** — plus a
500 on `/home` nobody had reported yet. Sequence, from the server logs:

1. Landing on `/home` fires ~10 parallel requests (the page plus Next.js
   prefetching every visible nav link). Each runs the middleware, each
   holding the same cookie with the same **single-use** refresh token.
2. One request wins the refresh race. Losers get
   `refresh_token_not_found`. On that error the SDK wipes the session —
   and the middleware's `setAll` faithfully forwarded that wipe as cookie
   deletions to the browser, destroying the *winner's* freshly rotated
   session mid-navigation. Next request: no cookies at all → `/sign-in`.
3. Independently, the cookie diagnostic added on 2026-07-17 read
   `c.value.length` off `cookies().getAll()` entries; a cookie deleted by
   the middleware earlier in the same request surfaces there with
   `value === undefined`, crashing every page render that followed a
   session wipe with a 500 (`TypeError: Cannot read properties of
   undefined (reading 'length')` — this exact error was recovered from
   the built chunk and matches the deployed instrumentation).

### Fixes

- `packages/lib/src/supabase/proxy.ts` — `setAll` now suppresses a
  **pure session wipe** (every cookie an empty-value deletion), which in
  middleware only ever means "this request's refresh failed". A lost
  refresh race no longer signs the user out; the winner's cookies stand.
  Mixed writes — including stale-chunk cleanup on a successful rotation —
  are still applied in full, and real sign-out (a Server Action, not
  middleware) still clears cookies, verified end-to-end.
- `packages/lib/src/supabase/server.ts` + `proxy.ts` — cookie
  diagnostics are null-safe (`c.value?.length ?? 0`); they can no longer
  500 a render.
- `packages/lib/src/supabase/proxy.test.ts` — new regression tests: a
  successful rotation applies sets and stale-chunk removals to both the
  response and the mutated request; an all-deletions `setAll` is fully
  suppressed on both; unconfigured Supabase no-ops.

### Verification

Full browser matrix against the production build, at 8-second token TTL
with chunked cookies (worst case): sign-in → `/home`; refresh stays;
navigation past full token expiry refreshes and stays (previously: 500 +
session wipe + `/sign-in`); new tab stays; client-side navigation across
protected pages; browser back; deep links; a second full-expiry idle
period; `/` → `/home`; sign-out → `/welcome` with cookies cleared;
`/home` signed out → `/sign-in`; re-login → `/home`. Also the same
matrix at the default 1-hour TTL. `pnpm typecheck` clean; `pnpm lint` 0
errors (1 pre-existing unrelated warning); `pnpm test` 185/185;
`pnpm test:e2e` 58/58; `pnpm build` clean.

### Relation to the production symptom

This is the first mechanism found on this branch that actually produces
"signed-in browser bounced to `/sign-in` with the server seeing no
session" in the real code, rather than being ruled out. It fires
whenever a session-gated navigation races a token refresh — guaranteed
at every token-expiry boundary, and on *every* navigation if the
project's JWT expiry is at or below the SDK's 90-second refresh margin.
That dashboard setting (Authentication → Sessions → JWT expiry) is still
worth checking, and remains the one thing this environment cannot see.

---

## Addendum — 2026-07-19 (fourth): real-production failure traced to missing API-role grants

Real verification against the live Supabase project, after merging the
redirect-race fix (`e1afbf1`), still failed: sign-in succeeds, the app
attempts profile initialization, the terminal shows
`permission denied for table profiles` with hint
`GRANT SELECT, INSERT ON public.profiles TO authenticated;`, and the
browser ends back at the sign-in flow.

### What the production log actually proves

The quoted error comes from the instrumented self-heal path in
`apps/web/lib/session.ts` (`insertErrorHint` is a field only that log
line emits). For that line to fire at all, everything before it must
have succeeded: middleware saw the cookies, `auth.getUser()` returned a
real user server-side, the profile `select` ran and failed, and the
self-heal `insert` ran and failed. **The entire session pipeline —
cookies, middleware, token handling, Server Components — is working in
production.** The failure is one layer down: PostgreSQL error 42501,
table-privilege denial, which happens before RLS is even evaluated.
`getCurrentSession()` then correctly reports `null` (both its reads
failed), and `(app)/layout.tsx` redirects to `/sign-in` — the redirect
is a downstream symptom, not a defect.

### Root cause (this is (A), not (B))

The live database's tables have RLS enabled and policies defined, but
**no table-level grants for the Supabase API roles** (`anon`,
`authenticated`, `service_role`). No migration in this repository ever
issues a `GRANT` — a standard Supabase project doesn't need one, because
the platform configures `ALTER DEFAULT PRIVILEGES` for the role its
tooling creates tables as. This project's live schema was assembled at
least partly outside that path (already established when
`handle_new_user()` was found missing in production), by a role whose
default privileges don't cover the API roles — leaving tables with
policies but no underlying privileges.

Reproduced exactly against local PostgreSQL 16 running this repo's
migrations with no platform grants: as `authenticated` with a valid
`auth.uid()`, SELECT/INSERT/UPDATE on `public.profiles` all fail with
`permission denied for table profiles`, and `public.notifications` (read
by the app layout immediately after login) fails identically. The blast
radius is all sixteen app tables — which is also why the hinted minimal
`GRANT SELECT, INSERT ON public.profiles` is the wrong fix: it would
un-bounce login while leaving onboarding completion (UPDATE on
`profiles`) and every other feature broken.

This also retro-explains the entire campaign's central mystery: "the
server doesn't see the session the browser has" was never true. The
server always saw the session; before instrumentation existed, the
42501 on the profile read was silently swallowed and collapsed into the
same `null` as "not signed in".

### Fix

`supabase/migrations/20260201080000_restore_api_role_grants.sql` — new.
Restores the standard Supabase model (grants gate verbs, RLS gates
rows): `GRANT ALL` on all tables/sequences/routines in `public` to the
three API roles, plus matching `ALTER DEFAULT PRIVILEGES` so the next
migration can't silently recreate this incident. A safety gate makes the
migration refuse to run if any `public` table has RLS disabled, so it
can never expose an unprotected table. RLS policies are untouched.

### Verification (local PostgreSQL 16, real migration files)

- Before the migration: authenticated SELECT/INSERT/UPDATE on
  `profiles` and SELECT on `notifications` all denied (42501) — exact
  production reproduction, while the SECURITY DEFINER trigger still
  creates rows (matching production's "rows exist but app can't read
  them").
- After: own-profile SELECT/UPDATE succeed (onboarding completion),
  self-heal INSERT succeeds for an orphaned user, notifications read
  succeeds.
- Security boundaries unchanged: another user's profile SELECT returns
  0 rows, cross-user INSERT fails with an RLS violation, cross-user
  UPDATE affects 0 rows, `anon` sees 0 rows, all sixteen tables have
  RLS enabled.
- Safety gate verified: with RLS deliberately disabled on one table,
  the migration aborts before issuing any grant.
- Full migration sequence applies cleanly from scratch and the new
  migration is idempotent on re-run.

### What must happen in the live project

Apply `20260201080000_restore_api_role_grants.sql` via the Supabase
Dashboard SQL editor (or `supabase db push --linked`). No data repair
and no re-signup is needed; the next sign-in should proceed to
onboarding/home immediately. This environment has no network path to
the live project (unchanged constraint), so this application step
remains the owner's — see MIGRATION_APPLICATION_GUIDE.md, updated with
this migration marked urgent.

---

## Addendum — 2026-07-19 (fifth): PGRST116 + 42501 after the grants migration — investigation scoped to `profiles`/RLS/self-heal only, per explicit instruction

New live evidence, gathered after `20260201080000_restore_api_role_grants.sql`
was applied to the live project: sign-in succeeds, but the browser console
now shows `PGRST116` ("Cannot coerce the result to a single JSON object")
followed by `42501` (`new row violates row-level security policy for table
"profiles"`), and the browser still ends up back at sign-in. Per explicit
instruction, this investigation stayed entirely within `public.profiles`,
its RLS policies, and the self-heal logic in `apps/web/lib/session.ts` —
cookies, middleware, and token refresh were not reopened.

### Answering the required questions, with evidence

**1–2. The exact query and why it produces PGRST116.** Two `.single()`
calls exist in `session.ts`: the profile lookup
(`.from("profiles").select("*").eq("id", user.id).single()`) and the
self-heal insert's return (`.insert(...).select().single()`). PGRST116 is
PostgREST's error for `.single()`/`.maybeSingle()` receiving 0 or 2+ rows.
Since `id` is the table's primary key, the `id`-filtered lookup can
structurally never return 2+ rows — so PGRST116 there always means exactly
0 rows.

**3–4. Does a profile already exist, and why doesn't the SELECT return
one row if so?** This is the one place an initial hypothesis had to be
corrected. I first assumed 0-rows-then-RLS-denied-insert proved the row
didn't exist yet. I built a second local reproduction to test that
directly — the *converse* case, where the row provably exists (created by
the `SECURITY DEFINER` trigger, which bypasses RLS/grants entirely) but
the querying role's `auth.uid()` fails to resolve — and it reproduces the
exact same 0-rows-then-42501 sequence. **PGRST116 on this query does not
distinguish "no row exists" from "a row exists but this request can't see
it."** Whether a profile already exists for the affected live user cannot
be determined from the browser console evidence alone; it requires a
direct query against the live table (question 8, below).

**5–6. Why does the self-heal INSERT violate the RLS policy, and what are
the exact policies?** Pulled directly from a real PostgreSQL 16 instance
running this repository's actual migration files (not inferred, not typed
from memory):

```
policyname                          | cmd    | using              | with_check
profiles are insertable by owner    | INSERT |                    | (auth.uid() = id)
profiles are viewable by owner      | SELECT | (auth.uid() = id)  |
profiles are updatable by owner     | UPDATE | (auth.uid() = id)  | (auth.uid() = id)
```

Exactly three policies, matching the migrations, no duplicates, no
`RESTRICTIVE` policies, nothing dashboard-authored layered on top (in this
local reconstruction — the live project's policy set can only be confirmed
by running the same query there, see below). Two controlled reproductions,
run against this exact policy set:

- Insert as `authenticated` with `auth.uid()` correctly resolving to the
  target id → succeeds.
- The *only* change: `auth.uid()` resolves to `NULL` (session variable
  `request.jwt.claim.sub` unset, simulating a request PostgREST does not
  recognize as this user) → fails with **the identical, verbatim error
  text reported live**: `new row violates row-level security policy for
  table "profiles"`.

The insert statement and the policy are both correct in isolation. The
failure is fully explained by, and only by, `auth.uid()` not resolving to
the caller's id for that specific query.

**7. Does `handle_new_user()` already insert a profile?** Yes — confirmed
by re-running the trigger migration locally: a fresh `auth.users` insert
produces a matching `profiles` row automatically, via `SECURITY DEFINER`,
unaffected by grants or RLS.

**8. Duplicate profile rows?** Structurally impossible for the `id`-filtered
lookup specifically (primary key). Whether the live `profiles` table has
any duplicate/orphaned data by some other criterion cannot be checked from
this sandbox (no network path to the live project) — see the verification
queries below.

**9. Is `.single()` used appropriately?** No — found and fixed as part of
this investigation, independent of the auth-context question. Every other
`profiles` query in the codebase
(`features/jobs/actions.ts`, `features/coach/actions.ts`) correctly uses
`.maybeSingle()` for a lookup that may legitimately find nothing.
`session.ts`'s initial lookup used `.single()`, which turns the ordinary
"no profile yet, about to self-heal" case into a PostgREST error object
identical in shape to a real failure — which is very likely why this was
visible in the browser console at all as something alarming. Fixed to
`.maybeSingle()`. This is a real fix, but it changes *presentation*, not
outcome — the code already correctly treated any falsy `profileRow` as
"attempt self-heal" either way, so it does not by itself explain the
subsequent 42501.

### Verify the live database — what I can and cannot do from here

I have no network path to the live Supabase project (unchanged constraint
from every prior report on this branch), so I cannot run these myself.
Exact queries to answer questions 3/8/9 conclusively, run as a superuser
via the Supabase SQL editor (which bypasses RLS, so it shows ground truth):

```sql
-- Does the row already exist? Duplicates by any key?
select * from public.profiles where id = '<the affected user's auth.users.id>';

-- Exact live policy set (compare against the table above)
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'profiles';
```

The one question those can't answer — what the *application's own
requests* resolve `auth.uid()` to — needed a different approach, since I
cannot attach to a live request from this sandbox either.

### What was added: a diagnostic the next real login will answer directly

`supabase/migrations/20260201090000_add_whoami_diagnostic.sql` adds
`public.debug_whoami()`, a minimal `SECURITY INVOKER` SQL function
returning the calling request's own `current_user` (`anon` vs
`authenticated`) and `auth.uid()`. It discloses nothing a caller couldn't
already read out of their own JWT. `session.ts` now calls it via
`supabase.rpc("debug_whoami")` immediately after a failed profile lookup,
logging `effectiveRole` / `resolvedAuthUid` / whether it matches
`user.id`, right before attempting the self-heal insert. Verified locally
(real Postgres, three role/claim combinations) that it correctly
distinguishes all three cases that matter here: properly authenticated,
`authenticated` role but no resolvable `sub` claim, and `anon`.

This directly closes the one gap local reproduction cannot close by
itself: the **next real login attempt** will show, in Vercel's function
logs, exactly what the database believes this request's identity is at
the moment the self-heal insert is attempted — proving or disproving,
with a single log line, whether the request context reaching PostgREST
matches the one that `auth.getUser()` (a separate service, GoTrue)
already validated. If `effectiveRole` is `anon` or `resolvedAuthUid`
doesn't match the logged `userId`, the fault is in how the live project's
API layer authenticates PostgREST requests for this specific user/token —
a project-configuration fact (e.g., GoTrue's and PostgREST's JWT
verification going out of sync after a secret rotation, or a gateway
stripping the Authorization header for REST calls) outside anything this
repository's code or migrations control, and outside the scope of this
investigation's instructions. If it matches, the fault is something else
this diagnostic will help find on the next attempt, without another round
of blind inference.

### Verification performed

- All 10 migrations (including the new diagnostic one) apply cleanly from
  a fresh database, in order, against real PostgreSQL 16.
- `debug_whoami()` verified locally to return the correct
  role/`auth.uid()` for all three scenarios above.
- `pnpm typecheck` clean (the new RPC call is fully typed against
  `database.types.ts`, not cast through `any`).
- `pnpm lint` — 0 errors (1 pre-existing, unrelated warning).
- `pnpm test` — 185/185 (the `.single()` → `.maybeSingle()` change and the
  new `rpc()` call required updating `session.test.ts`'s hand-built mock;
  updated and re-verified, still exercises the same reproduction/regression
  cases as before).
- Full browser matrix against a production build (`next build && next
  start`) driven through real Chromium, using a mock Supabase forced to
  simulate an orphaned first-login user (no profile row) on every request:
  login → self-heal → `/home` succeeds; the new diagnostic log line fires
  on every self-heal attempt with the correct role/uid; zero server
  errors. Re-run against a healthy (non-orphaned) mock: self-heal and the
  diagnostic call are correctly skipped entirely, zero server errors — no
  regression to the common path.
- Full repo `pnpm test:e2e` — 58/58 (demo mode, unaffected by this
  change, confirming no regression).

### Files changed this turn

- `apps/web/lib/session.ts` — `.single()` → `.maybeSingle()` on the
  profile lookup; new `debug_whoami()` diagnostic call + logging on the
  self-heal path.
- `apps/web/lib/session.test.ts` — updated mock to match
  (`maybeSingle`/`rpc`).
- `packages/lib/src/supabase/database.types.ts` — typed the new RPC.
- `supabase/migrations/20260201090000_add_whoami_diagnostic.sql` — new.

### What remains outstanding

1. Apply `20260201090000_add_whoami_diagnostic.sql` to the live database
   (same mechanism as every prior migration in this campaign).
2. One real sign-in attempt against the live deployment, with the
   `[getCurrentSession] database's view of this request's auth context`
   log line read from Vercel's function logs — this is the one piece of
   evidence this sandbox cannot produce, and it will show definitively
   whether the fault is a request-identity mismatch at the API layer (in
   which case the fix is a Supabase project setting, not code in this
   repo) or something else, without further guessing.
3. If it does show a mismatch, check the Supabase Dashboard's Project
   Settings → API → JWT Settings for a secret/signing-key state that's
   inconsistent between GoTrue and PostgREST (e.g. a rotated legacy JWT
   secret not fully propagated) — named here as the leading hypothesis
   given the evidence, not confirmed, since nothing in this sandbox can
   reach that dashboard.

---

## Addendum — 2026-07-19 (sixth): proving/disproving the `auth.getUser()` vs `auth.uid()` identity divergence

Scope for this addendum, per explicit instruction: `profiles`, RLS, and
policies are proven correct (fifth addendum) and **out of scope here**.
This addendum investigates only whether GoTrue (`auth.getUser()`) and
PostgREST (`auth.uid()`) can disagree about the same request's identity,
tracing PostgREST request authentication, JWT propagation, the Supabase
SSR client, `createServerClient()`, cookie propagation, and the
`Authorization` header — using this repository's actual vendored library
code, not assumption.

### Capturing one complete failing login — what this sandbox can and cannot do

I do not have network access to the live Supabase project or Vercel
deployment (unchanged, stated in every report on this branch). I cannot
capture a real failing production login. What follows instead is the most
rigorous substitute available: tracing the *actual* `@supabase/ssr`
(0.12.3) and `@supabase/supabase-js` (2.110.7) source as vendored in this
repo's `node_modules`, then running this repository's *actual*
`session.ts` self-heal code (including `debug_whoami()`, on this branch)
through a real Next.js production build and real Chromium browser against
a mock server enhanced to genuinely decode every JWT it receives — not
just check it's *a* valid token, but report exactly what `sub`/`role` each
individual request carried, at each of `/auth/v1/user`, `/rest/v1/profiles`,
and `/rest/v1/rpc/debug_whoami`.

### Source-code trace: how the Authorization header is chosen for each call

- `supabase.auth.getUser()` and the `_getSessionToken()` used internally
  by every `.from()`/`.rpc()` call (`SupabaseClient.ts`) **both** resolve
  through the identical `GoTrueClient.__loadSession()` (`auth-js`
  `GoTrueClient.ts`), which reads the session via
  `getItemAsync(this.storage, this.storageKey)`.
- `this.storage`, for a server client, is the cookie-backed adapter built
  by `@supabase/ssr`'s `createStorageFromOptions` — its `getItem` checks
  an in-memory `setItems` overlay *before* falling back to reading
  cookies. Any refresh triggered by `getUser()` writes into that same
  overlay via `setItem`, so a later `getSession()` call on the **same
  client instance** (same closure) sees the update immediately.
- `session.ts` constructs exactly **one** `supabase` client
  (`const supabase = await createClient()`) and reuses it for
  `auth.getUser()`, `.from("profiles")`, and `.rpc("debug_whoami")` —
  confirmed by reading the file directly, not recalled.
- `.rpc()` and `.from()` both route through the same `this.rest`
  (`PostgrestClient`) using the same `this.fetch` (`fetchWithAuth`),
  which resolves the bearer via `realToken ?? (allowKeyAsBearer ?
  supabaseKey : null)` — i.e., the plain anon key is used as a fallback
  **only if `_getSessionToken()` returns null**, and never otherwise.
- Neither `packages/lib/src/supabase/server.ts` nor `proxy.ts` sets any
  static/custom `Authorization` header at client construction (confirmed
  by grep) that could pre-empt this per-request resolution.

**Conclusion from source alone: within a single `createClient()` instance
in a single request, there is no code path by which `getUser()` and a
later `.rpc()`/`.from()` call can resolve to different sessions.** They
share the same storage, the same overlay, the same closure.

### Empirical confirmation: real app code, JWT-decoding mock, two conditions

Ran the actual self-heal path (this branch's `session.ts`, real
`createServerClient()`, real Next.js RSC execution, real cookies) through
a mock that decodes and logs the `sub`/`role` actually carried by every
request to `/auth/v1/user`, `/rest/v1/profiles`, and
`/rest/v1/rpc/debug_whoami`:

1. **Healthy conditions** (1-hour token TTL): 113 identity-log samples
   across the full login/navigate/self-heal/sign-out matrix. Every
   authenticated request carried the identical `sub` and
   `role: authenticated`. Zero anon-key fallbacks, zero invalid
   signatures.
2. **Adversarial conditions** (8-second TTL forcing a mid-session refresh,
   chunked cookies): 59 identity-log samples spanning the token-expiry
   boundary. Same result — identical `sub` on every request, zero
   divergence, before and after the refresh.

**This repository's own code, running for real, could not be made to
produce the divergence — under any condition constructed.**

### Correcting a hypothesis from the fifth addendum

The fifth addendum named a GoTrue/PostgREST JWT-secret mismatch as the
"leading hypothesis." Re-examining it against real PostgREST semantics:
a signature-verification failure at PostgREST produces an HTTP **401**
with a JWT-specific error (e.g. `PGRST301`), not a `42501` RLS violation
— PostgREST only reaches RLS evaluation *after* successfully
authenticating the request as some role. The live evidence was `42501`,
not `401`. **A secret mismatch is therefore inconsistent with the
reported symptom and is retracted as the leading hypothesis.**

For `42501` to occur, PostgREST must have accepted *some* credential for
the request and resolved it to a role/`auth.uid()` that fails the
`WITH CHECK`. Given the client-side "send the anon key when there's no
session token" fallback exists in the library (confirmed above) but is
proven not to fire in this repo's own code under any local condition,
the only evidence-consistent remaining explanation is that the
`Authorization` header PostgREST actually received on the live failing
request differed from what this repository's client code sent — which
places the cause **outside this repository's code**, in the request path
between the deployed application and the live Supabase project (a
proxy/edge layer altering headers, or a live-project-specific condition
this sandbox cannot observe or construct, since it would require the
real network path).

### What "prove or disprove" resolves to

- **Disproven**: the divergence is caused by anything in
  `apps/web/lib/session.ts`, `packages/lib/src/supabase/{server,client,
  proxy}.ts`, or a defect in `@supabase/ssr`/`@supabase/supabase-js` as
  used here. Both a full source trace and empirical black-box testing of
  the real code, under healthy and adversarial conditions, are
  consistent and negative.
- **Not provable or disprovable from this sandbox**: whether the live
  request path (Vercel ↔ Supabase project) itself alters or drops the
  `Authorization` header, or any other live-project-specific condition
  outside this repository's code. This requires the one artifact this
  sandbox cannot produce: `debug_whoami()`'s output from a real failing
  login, already built and waiting on this branch.

### Minimal fix

**No code fix is proposed.** Proposing one would mean changing code to
"fix" a divergence this investigation could not locate anywhere in that
code — which would fix nothing and misrepresent the finding. The correct
minimal next action is exactly what was already prepared and pushed on
this branch: apply `20260201090000_add_whoami_diagnostic.sql` to the
live database, attempt one real login, and read the
`[getCurrentSession] database's view of this request's auth context` log
line from Vercel's function output. That single log line —
`effectiveRole` and `resolvedAuthUid` compared against the `userId`
logged alongside it — is the one piece of evidence that resolves this
definitively, and nothing this sandbox can construct substitutes for it.

### Files changed this turn

None in the repository. Scratch-only test tooling (a JWT-decoding mock
server) was used for local reproduction and is not part of this
repository; the diagnostic branch's existing changes
(`debug_whoami()`, `session.ts`'s logging) are unchanged from the prior
commit.
