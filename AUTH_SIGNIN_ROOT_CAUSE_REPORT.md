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
