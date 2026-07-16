# Production Hardening Report — PHC v1.0

Date: 2026-07-17
Branch: `main`

This report supersedes the 2026-07-16 version of this file (a Supabase
migration-verification pass that predates this campaign — its "141 unit
tests"/"27 e2e tests" baseline is now 178/55, and its "migrations not yet
applied" finding is carried forward below, not repeated in full; its
"current_role" schema is the exact defect this campaign's Scope 1 fixed).

## Scope and honest framing

This campaign asked for ten PHC phases (Functional Attack, Security
Attack, UX Failure Testing, Data Integrity, AI Reliability, Integration
Reliability, Performance & Scalability, Accessibility Validation,
Cross-Platform Validation, Exploratory Testing) plus complete resolution
of every authentication issue. Before reporting results, it's worth
stating plainly what this environment can and can't actually do, so
nothing below is overstated:

- **No network access to any live Supabase project** — verified via the
  outbound proxy's own connection log showing rejected connections. No
  real user data, no real concurrent sessions, no real production traffic
  was ever touched.
- **No real mobile or desktop hardware** — "Cross-Platform Validation"
  below means Playwright device emulation (viewport + user-agent), not a
  physical phone or a second OS. Labeled as such throughout, not
  represented as more than it is.
- **No live third-party OAuth providers** — Gmail/Calendar/Drive/LinkedIn
  connection flows were verified by code inspection, not by actually
  completing a consent flow with real Google/LinkedIn credentials.
- **"Security Attack" phase** means static code review, RLS policy
  reading, dependency auditing, and targeted code-level checks (secret
  comparison timing, authorization scoping, XSS surface) — not live
  penetration testing against a running deployment, which this
  environment has no target for.

Every phase below reports what was *actually executed* and what it
*actually found*, including phases that found nothing wrong.

## Phase-by-phase results

### 1. Functional Attack / 10. Exploratory Testing
Combined into one pass: full server-action-by-server-action code review
(14 `actions.ts` files read in full) plus targeted Playwright coverage of
form validation and onboarding step-gating. Found: PHC-03, PHC-04, PHC-06
(see `DEFECT_REGISTER.md`). Sign-up/sign-in/onboarding validation UX
confirmed working correctly via new `e2e/form-validation.spec.ts`.

### 2. Security Attack
RLS policy audit across all 7 migrations (comprehensive, no gaps found —
every user-owned table correctly owner-scoped). Server-action
authorization audit found and fixed PHC-03 (5 actions with no
application-layer authorization backstop) and PHC-04 (spoofable
cross-user reference). Cron secret comparison audit found and fixed
PHC-02 (non-constant-time comparison). `dangerouslySetInnerHTML`/`eval`/
`new Function` grep: zero matches — no XSS injection surface via those
vectors. `pnpm audit`: one moderate advisory, transitive to Next.js's own
exact-pinned internal PostCSS dependency, not user-reachable in this app
— documented rather than force-overridden (see `DEFECT_REGISTER.md` for
the reasoning).

### 3. UX Failure Testing
Custom `error.tsx` and `not-found.tsx` confirmed present and well-designed
(actionable retry/back-home actions, not bare stack traces). One gap
noted: no `global-error.tsx` for root-layout-level failures — low
priority given the root layout does nothing failure-prone today; recorded
in `DEFECT_REGISTER.md` rather than fixed, to avoid the risk of an
incorrect HTML-shell duplicate under time pressure for a near-zero-
likelihood scenario.

### 4. Data Integrity
Zod-schema-to-DB-CHECK-constraint alignment spot-checked across every
enum-like field; all match. `categorizeEmail`'s return type is a
TypeScript union that structurally can't drift from the DB constraint.
Schema alignment (the `current_role`/`current_job_title` rename) is the
headline data-integrity fix of this campaign — see
`SCHEMA_ALIGNMENT_REPORT.md`.

### 5. AI Reliability
Found and fixed PHC-05: `generateElizabethText` crashed its caller on any
provider failure despite its own documented "fail gracefully" contract.
Fixed at the single shared call site (try/catch + 30s timeout), covering
5 features. Assistant streaming route's request parsing hardened
(PHC-06).

### 6. Integration Reliability
Found and fixed PHC-07: Gmail/Calendar/Drive/LinkedIn "integrations"
request real OAuth scopes but have zero actual sync behind them; UI
copy overpromised. Made honest rather than silently misleading (out-of-
scope to actually build 4 third-party syncs in a hardening pass). Every
other integration (Supabase, AI providers, job discovery sources, Vercel
Cron) validated as real and working. Full detail in
`INTEGRATION_VALIDATION_REPORT.md`.

### 7. Performance & Scalability
Found and fixed PHC-08: the daily-briefing cron processed every user
fully sequentially — a genuine N+1 pattern that will silently stop
completing once the user base grows past a few hundred people, given the
120s function timeout. Fixed with bounded-concurrency batching, business
logic untouched to avoid correctness risk. Reviewed every other
`features/*/data.ts` file for the same pattern — none found; all
correctly batch queries via `Promise.all`/`.in()`. One low-impact
over-fetch noted (`getJourneyByApplicationId`) and documented rather than
fixed, given negligible impact at this app's expected data volume.

### 8. Accessibility Validation
Real axe-core (`@axe-core/playwright`) WCAG 2.x A/AA automated scan across
18 primary screens. **Result: zero violations on all 18 pages.** This is a
genuinely positive finding, not a gap — the `@ez/ui` design system appears
to have been built with accessibility as a first-class concern. Not a
substitute for a manual screen-reader/keyboard walkthrough with an actual
assistive-technology user, which this environment cannot perform — stated
explicitly in the test file itself.

### 9. Cross-Platform Validation
Playwright device emulation (iPhone 14 preset + 1440×900 desktop) across
`/home`, `/onboarding`, `/resume`: no horizontal overflow, bottom nav
reachable at both sizes. All 6 checks pass. Explicitly emulated viewports,
not real hardware — stated in the test file.

## Authentication

Fully covered in `AUTHENTICATION_AUDIT.md`. Summary: the substantial
authentication work was completed in the session immediately preceding
this campaign; today's work re-verified none of it regressed (zero file
overlap between today's changes and the auth core, full auth e2e suite
re-run and passing) and found one adjacent hardening item (cron secret
timing safety, not user authentication).

## Final validation state

See `REGRESSION_REPORT.md` for full detail:

- `pnpm typecheck` — clean, 4/4 packages
- `pnpm lint` — clean, 0 errors
- `pnpm test` — **178/178** unit tests
- `pnpm build` — clean
- `pnpm test:e2e` — **55/55** Playwright tests

## Defects found and resolved this campaign

8 confirmed defects (`PHC-01` through `PHC-08`), full detail with repro
steps, root cause, fix, and regression test in `DEFECT_REGISTER.md`.
Severity ranged from Low (theoretical timing side-channel) to Critical (a
migration that could never apply to a real database) to High-at-scale
(the cron N+1, not yet triggered but real).

## What remains outstanding

1. **Apply the corrected migration to the live database** — this
   environment cannot reach the production Supabase project (confirmed:
   direct PostgreSQL connections time out, REST API requests time out,
   Supabase CLI requires interactive authentication this environment
   can't provide). This was true in the 2026-07-16 pass this report
   supersedes and remains true today — carried forward, not re-litigated.
2. **One manual auth verification** — a real sign-up → email → click-
   through in the live Vercel deployment, after adding the `/auth/confirm`
   redirect URL to Supabase's allowlist. Carried forward from the prior
   session; nothing in this campaign changes or resolves this requirement.
3. **Daily-briefing cron's deeper scalability fix** — today's fix
   (batching) buys significant runway; the query-count-reducing rewrite
   is the correct long-term architecture once user count grows further,
   and deserves its own properly-scoped pass with dedicated test coverage
   for the notification dedup logic (see `DEFECT_REGISTER.md` PHC-08).
4. **Third-party integration sync** — Gmail/Calendar/Drive/LinkedIn are
   honestly labeled as not-yet-implemented; building the actual sync is a
   new-feature project, not a hardening task.
5. **`global-error.tsx`** — low-priority gap noted in `DEFECT_REGISTER.md`,
   not fixed.
6. **PostCSS advisory** — tracked, will resolve via a routine `next`
   version bump upstream; not force-patched (see `DEFECT_REGISTER.md` for
   why).

## Repository Truth Audit

The user's suggested addition to the release pipeline — a gate verifying
code, schema, docs, tests, and production config all agree — is exactly
what this campaign's Scope 1 (schema alignment) *was*: the
`current_role`/`current_job_title` mismatch is precisely the class of
defect that gate is meant to catch. This campaign closed that specific
instance and re-verified agreement across all five surfaces it names for
this one field. It was not run as a standing, repeatable gate — that
would need to be built as an actual CI check (e.g., a script diffing
`database.types.ts` field names against the migration files, or generating
`database.types.ts` from the live schema instead of hand-maintaining it)
rather than a one-time manual pass, which is a reasonable next
engineering investment but is itself a new-feature/tooling project, not
something this hardening campaign implemented.
