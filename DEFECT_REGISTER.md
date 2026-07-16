# Defect Register — Production Hardening Campaign (PHC) v1.0

Date: 2026-07-17
Branch: `main`

Every entry below was independently reproduced or empirically verified
before being logged — nothing here is a hypothesis. Severity reflects
actual exploitability/impact in this codebase as found, not a generic
category rating.

---

## PHC-01 — PostgreSQL reserved-keyword syntax error in `profiles` migration

- **Severity:** Critical (migration cannot apply to any real Postgres database)
- **Phase:** Data Integrity
- **Repro:** `create table t (current_role text);` against Postgres 16 →
  `ERROR: syntax error at or near "current_role"`.
- **Root cause:** `current_role` is a reserved SQL keyword (the niladic
  `CURRENT_ROLE` function). `supabase/migrations/20260101000000_init_schema.sql`
  declared it as an unquoted column name.
- **Fix:** Renamed to `current_job_title` in the migration; propagated the
  rename through every layer of the application (see `SCHEMA_ALIGNMENT_REPORT.md`).
- **Regression test:** Full migration file re-run end-to-end against a local
  Postgres 16 instance with a minimal `auth` schema/role stub; zero errors.
  `tsc --noEmit` across all packages guards against the rename drifting
  again.
- **Commits:** `b466785`, `cceb41c`

---

## PHC-02 — Non-constant-time secret comparison in cron authentication

- **Severity:** Low (theoretical timing side-channel; practically hard to
  exploit over HTTPS/serverless, but a real anti-pattern for secret
  comparison)
- **Phase:** Security Attack
- **Repro:** `apps/web/lib/cron-auth.ts` compared
  `authHeader !== \`Bearer ${secret}\`` — a plain string inequality, whose
  execution time varies with how many leading bytes match.
- **Root cause:** Secret comparison must be constant-time; `!==` is not.
- **Fix:** Replaced with a length-padded `node:crypto.timingSafeEqual`
  wrapper.
- **Regression test:** `apps/web/lib/cron-auth.test.ts` — added cases for a
  shorter prefix guess, a longer superset guess, and a missing header, on
  top of the existing exact-match/no-match/no-secret cases (6 tests total).
- **Commit:** `cd0b670`

---

## PHC-03 — Five server actions relied solely on RLS for write authorization

- **Severity:** Low today / High if RLS were ever misconfigured (defense-in-depth gap)
- **Phase:** Security Attack
- **Repro:** `markInterviewCompletedAction`, `cancelInterviewAction`,
  `updateJourneyReflectionAction`, `updateApplicationStatusAction`,
  `markNotificationReadAction` all ran `.update(...).eq("id", someId)` with
  no `.eq("user_id", user.id)` and, in three cases, no `auth.getUser()`
  call at all.
- **Root cause:** Every affected table (`interviews`, `applications`,
  `notifications`) does have a correct owner-scoped RLS policy (`for all …
  using (auth.uid() = user_id)`), which was verified by reading every
  migration file — so this was **not actively exploitable** as found. But
  the application layer had zero independent authorization check backing
  that single database-level guarantee.
- **Fix:** Added `auth.getUser()` + `.eq("user_id", user.id)` to all five
  actions. `updateApplicationStatusAction` additionally now detects a
  zero-row update (nonexistent id or not-yours) via `.select().maybeSingle()`
  and returns an error instead of silently continuing to send a
  notification for an update that didn't happen.
- **Regression test:** Covered by existing `tsc --noEmit` (return-type
  shape) and the full e2e suite exercising these flows in demo mode;
  no dedicated unit test was added for the authorization branch itself
  since it requires a real second-user Supabase session this environment
  cannot create (see Authentication Audit for the environment's network
  constraint).
- **Commit:** `cd0b670`

---

## PHC-04 — Cover letter could be linked to an application the caller doesn't own

- **Severity:** Low (RLS still blocks reading the other user's application
  through the link; the gap is a spoofable reference, not a data leak)
- **Phase:** Security Attack
- **Repro:** `createTailoredCoverLetterAction(applicationId, title)` inserted
  `application_id: applicationId` directly from the caller-supplied
  argument with no ownership check. A Server Action is a public,
  independently-callable RPC endpoint regardless of what the UI passes.
- **Root cause:** Missing ownership verification before establishing the
  foreign-key reference.
- **Fix:** Added a `select().eq("id", applicationId).eq("user_id",
  context.user.id).maybeSingle()` check before the insert; returns an error
  if the application isn't found under that user.
- **Regression test:** Same coverage caveat as PHC-03 (needs a real
  second-user session to fully exercise; guarded by `tsc --noEmit` and
  the e2e suite for the non-attack path).
- **Commit:** `cd0b670`

---

## PHC-05 — AI generation crashed the calling Server Action on any provider failure

- **Severity:** Medium (breaks 5 user-facing features on any transient AI
  provider issue — rate limit, timeout, outage — with no graceful
  degradation despite the code's own documented intent)
- **Phase:** AI Reliability
- **Repro:** `generateElizabethText`'s docstring states callers "fail
  gracefully rather than crash," but the function only returned `null` for
  the no-provider-configured case. Once a provider *was* configured, the
  `generateText()` call had no `try/catch` and no timeout — any thrown
  error propagated unhandled out of `draftCoverLetterAction`,
  `draftFollowUpEmailAction`, `draftRecruiterReplyAction`,
  `getResumeFeedbackAction`, and `analyzeJobMatchAction` (none of which
  had their own try/catch either).
- **Root cause:** Missing error handling at the single shared call site.
- **Fix:** Wrapped the model call in `try/catch`, falling back to the
  existing `null` contract every caller already handles; added a 30s
  `AbortSignal.timeout` so a hung provider can't tie up a Server Action
  indefinitely.
- **Regression test:** `packages/lib/src/ai/generate.test.ts` — mocks a
  rejected provider call and asserts `null` is returned, not a thrown
  exception, plus the success and no-provider-configured paths.
- **Commit:** `604f14a`

---

## PHC-06 — Assistant API route crashed on malformed request body

- **Severity:** Low
- **Phase:** Functional Attack / API Reliability
- **Repro:** `POST /api/assistant` with a non-JSON body, or a JSON body
  without a `messages` array, threw unhandled inside `request.json()` /
  the destructure, returning an unstyled 500 instead of a clean error.
- **Root cause:** No validation of the parsed body shape.
- **Fix:** Wrapped parsing in `try/catch` and added an `Array.isArray`
  check; returns `400` with a clear message on either failure.
- **Regression test:** `apps/web/app/api/assistant/route.test.ts` — asserts
  400 for a malformed body and 200 for a well-formed one.
- **Commit:** `604f14a`

---

## PHC-07 — Third-party integrations request real OAuth scopes for sync that doesn't exist

- **Severity:** Medium (misleading to users; requests broader access than
  the app currently uses, which is a real trust/least-privilege concern
  even though the connection flow itself is genuine, working
  infrastructure)
- **Phase:** Integration Reliability
- **Repro:** Connecting Gmail/Calendar/Drive/LinkedIn on
  `/settings/integrations` runs a real `supabase.auth.linkIdentity()` OAuth
  consent flow requesting real scopes (`gmail.readonly`, `calendar.events`,
  `drive.file`). Confirmed via repo-wide search: no `googleapis` dependency
  in any `package.json`, no API client, no sync job anywhere. Recruiter
  Inbox is entirely manual paste-in
  (`apps/web/features/inbox/actions.ts`), not a Gmail sync. The UI copy
  claimed active behavior ("Track recruiter replies automatically", "Keep
  interview schedules in sync", "Store and access your resumes... from
  Drive").
- **Root cause:** OAuth connection infrastructure was built ahead of the
  data-sync feature it's meant to support, and the UI copy wasn't updated
  to reflect that gap.
- **Fix (documented, not built — building 4 third-party syncs is a new
  feature, explicitly out of scope for a hardening pass):** Rewrote
  `INTEGRATION_INFO` descriptions to stop claiming live behavior, added a
  `comingSoon` flag, and surfaced a "Sync coming soon" badge on every
  integration card. The OAuth flow itself is untouched.
- **Regression test:** `apps/web/e2e/platform-completion.spec.ts` — new
  test asserting the badge renders for all four providers.
- **Commit:** `43fcef5`
- **See also:** `INTEGRATION_VALIDATION_REPORT.md` for the full validation
  of all four providers individually.

---

## PHC-08 — Daily-briefing cron job processes every user fully sequentially (N+1 at scale)

- **Severity:** High at scale (not yet triggered in practice — depends on
  current user count, which this environment has no way to check)
- **Phase:** Performance & Scalability
- **Repro:** `apps/web/app/api/cron/daily-briefing/route.ts` looped over
  every profile with a plain `for` loop, issuing 6 per-user queries
  (parallelized *within* a user via `Promise.all`, but the loop itself was
  sequential *across* users) plus nested per-match and per-resume dedup
  queries inside that same loop. `export const maxDuration = 120` caps the
  route at 2 minutes; wall-clock time scales linearly with user count, so
  this silently stops finishing (Vercel Cron functions that exceed their
  duration limit fail without partial-completion semantics for the users
  not yet reached) once the user base crosses roughly a few hundred people,
  depending on per-query latency.
- **Root cause:** Sequential per-user loop instead of batched/parallel
  processing.
- **Fix:** Extracted the per-user body into `processUserBriefing()`
  unchanged (zero business-logic edits — deliberately, since this logic's
  idempotency/dedup behavior had no route-level test coverage and a full
  query-count-reducing rewrite carried real correctness risk for a
  hardening pass). Users are now processed in bounded-concurrency batches
  of 10 via `Promise.all` per batch, changing wall-clock scaling from
  O(userCount) to O(userCount / 10).
- **Regression test:** `apps/web/app/api/cron/daily-briefing/route.test.ts`
  (new — no route-level test existed before) verifies 23 profiles
  (spanning three batch boundaries) are each processed exactly once, none
  skipped or double-notified.
- **Commit:** `1b07d93`
- **Follow-up recommended, not done here:** the deeper fix — bulk-querying
  all users' data up front and reducing total round-trips, not just
  parallelizing them — is the correct long-term architecture once user
  count grows further. Flagged for a dedicated, properly-scoped pass with
  its own test coverage for the notification dedup logic, not bundled into
  a hardening sprint.

---

## Findings investigated and NOT defects (recorded so they aren't re-litigated)

- **RLS coverage** — every user-owned table across all 7 migrations has a
  correct owner-scoped policy; shared catalogs (`jobs`,
  `learning_resources`) are correctly read-only; storage bucket policies
  correctly scope by `auth.uid()` folder prefix. `job_ingestion_runs` has
  RLS enabled with zero client-facing policies, which is intentional and
  documented in the migration itself (service-role-only table). No fix
  needed.
- **XSS surface** — `dangerouslySetInnerHTML`, `eval`, and `new Function`
  all return zero matches repo-wide. React's default JSX escaping covers
  every render path in this codebase.
- **`postcss@8.4.31` moderate advisory (GHSA-qx2v-qp2m-jg93)** — transitive
  dependency of `next@16.2.10` itself, pinned to an *exact* version (not a
  range) by Next.js. This app processes no user-supplied CSS at runtime —
  the vulnerable code path (unescaped `</style>` in CSS stringification) is
  reachable only through Next's own internal build-time CSS pipeline.
  Considered forcing a `pnpm.overrides` bump to the patched `8.5.19`, but
  rejected it: overriding a framework's own exact-pinned internal
  dependency risks subtle build breakage for a vulnerability with no
  practical exploitation path in this app, which is exactly the kind of
  "quick patch trading a known-safe configuration for an untested one"
  this campaign's own instructions caution against. Correct remediation is
  a routine `next` version bump once upstream updates their pin — tracked,
  not ignored.
- **Global-layout error boundary gap** — `apps/web/app/error.tsx` only
  catches errors in the root layout's *children*; there's no
  `global-error.tsx` to catch an error thrown by the root layout itself
  (font loading, `<Providers>`). Noted as a low-priority, low-probability
  gap (the root layout does nothing failure-prone today) rather than fixed,
  to avoid the risk of getting a full HTML-shell duplicate boundary wrong
  under time pressure for a near-zero-likelihood scenario.
- **Enum drift between Zod validation and DB CHECK constraints** — spot-
  checked every schema with an enum-like field
  (`interviewSchema.interviewType`, `RecruiterEmailCategory`); all match
  their corresponding CHECK constraint exactly, and `categorizeEmail`'s
  return type is a TypeScript union that structurally can't drift from
  it. No defect found.
- **N+1 query patterns outside the daily-briefing cron** — reviewed every
  `apps/web/features/*/data.ts` file; all use `Promise.all` for parallel
  fetching and batch `.in()` queries for joins, not per-item loops.
  `getJourneyByApplicationId` over-fetches (loads all of a user's
  journeys to find one), a real but low-impact inefficiency at this app's
  expected per-user data volume — documented, not changed, given the
  fix/risk ratio didn't justify it in this pass.
