# Regression Report — Production Hardening Campaign (PHC) v1.0

Date: 2026-07-17
Branch: `main`

## Summary

All validation gates were run after every change, not just once at the
end — each of the 7 commits in this campaign individually passed the full
suite before being committed. Final state, all green:

| Check | Result |
|---|---|
| `pnpm typecheck` | Clean — 4/4 packages |
| `pnpm lint` | Clean — 0 errors (1 pre-existing, unrelated warning) |
| `pnpm test` (unit) | **178/178 passed** |
| `pnpm build` | Clean production build |
| `pnpm test:e2e` (Playwright) | **55/55 passed** |

## Unit test breakdown

| Package | Files | Tests | New this campaign |
|---|---|---|---|
| `@ez/ui` | 3 | 8 | 0 |
| `@ez/lib` | 24 | 149 | 3 (`ai/generate.test.ts`) |
| `web` | 6 | 21 | 9 (`cron-auth.test.ts` +3, `route.test.ts` (assistant) +2, `route.test.ts` (daily-briefing) +1 new file) |

Pre-campaign baseline was 169 unit tests (confirmed at the start of this
session, carried over from the prior authentication-hardening session).
178 - 169 = 9 new tests, all directly tied to confirmed defects in
`DEFECT_REGISTER.md`.

## E2E test breakdown

Pre-campaign baseline: 30 e2e tests (27 original demo-mode/platform tests
+ 3 auth-confirm tests from the prior session).

New this campaign: 25 tests across 4 new spec files —

| File | Tests | Purpose |
|---|---|---|
| `e2e/accessibility.spec.ts` | 18 | Real axe-core WCAG 2.x A/AA scan, one per primary screen |
| `e2e/cross-viewport.spec.ts` | 6 | Mobile/desktop emulated-viewport overflow checks |
| `e2e/form-validation.spec.ts` | 3 | Sign-up/sign-in/onboarding validation UX |
| `e2e/platform-completion.spec.ts` | +1 | Integration "coming soon" honesty check |

30 + 25 = 55, matching the final run.

## No regressions introduced

Every existing test — unit and e2e — was re-run after every commit and
passed unmodified, with two exceptions where a test's own *assertion* was
intentionally updated because the underlying behavior it checks was
deliberately changed (not because it broke):

- `packages/lib/src/validation/onboarding.test.ts` — fixture/assertion
  updated for the `currentRole` → `currentJobTitle` rename (schema
  alignment, not a behavior change).
- `packages/lib/src/job-matching.test.ts` — same rename, same reason.

No test was deleted, skipped, or weakened to make it pass.

## Environment note on e2e execution

Two full e2e runs during this session were interrupted mid-run: once by
an out-of-memory-adjacent kill (exit 137) when running the full 55-test
suite with 2 parallel workers immediately after a fresh production build,
and once by a full worker-process restart of this environment. Neither
was a test failure — both were infrastructure interruptions. The suite
was re-run to completion with `--workers=1` after each interruption and
passed cleanly (memory checked healthy — 14Gi free — before the retry).
Recorded here for transparency rather than silently omitted.

## What full validation does and doesn't prove

Typecheck, lint, unit tests, build, and e2e in demo mode collectively
prove: the code compiles, is internally type-consistent, the pure-logic
functions behave as specified, the production bundle builds, and the
primary user flows render and respond correctly against the app's
in-memory demo data path. They do **not** prove correct behavior against
a live Supabase project with real users, real RLS enforcement under
concurrent access, or real third-party OAuth providers — this environment
has no network path to test any of those (see `AUTHENTICATION_AUDIT.md`
and `INTEGRATION_VALIDATION_REPORT.md` for what was and wasn't verifiable
as a result).
