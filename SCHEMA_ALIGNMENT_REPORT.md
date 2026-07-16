# Schema Alignment Report

Date: 2026-07-17
Branch: `main`
Related commits: `b466785` (migration fix), `cceb41c` (repo-wide alignment)

## What triggered this

`supabase/migrations/20260101000000_init_schema.sql` originally declared
a `current_role text` column on `profiles`. `current_role` is a reserved
PostgreSQL keyword (the niladic `CURRENT_ROLE` function, same class as
`CURRENT_USER`/`CURRENT_TIMESTAMP`) — an unquoted column of that name is a
syntax error, not a style issue. This was verified empirically against a
local PostgreSQL 16 instance before any change was made:

```
create table t (current_role text);
ERROR:  syntax error at or near "current_role"
```

This meant the migration could never actually apply to a real Postgres/
Supabase database as originally written. It was fixed to `current_job_title`
in commit `b466785`, and the *entire* fix was re-run end-to-end against a
local Postgres instance (with a minimal `auth` schema/role stub standing in
for Supabase's platform-provisioned objects) to confirm the whole migration
file — not just that one line — now applies cleanly with zero errors.

That commit intentionally scoped the change to the single SQL identifier.
This report covers the follow-up: bringing the rest of the repository —
types, mappers, validation, UI, tests — into agreement with the corrected
schema, since the database column and the application code had diverged.

## Method

1. `grep -rln "current_role\|currentRole"` across the repo (excluding
   `node_modules`) to enumerate every reference before touching anything.
2. Renamed every occurrence to `current_job_title` (snake_case, database
   layer) or `currentJobTitle` (camelCase, application layer) — including
   derived identifiers that weren't literally `current_role`/`currentRole`
   but were named after the old field (`currentRoleStepSchema` →
   `currentJobTitleStepSchema`, local state variables, Zustand store
   fields/setters).
3. Re-ran the same grep after every batch of edits; the final state has
   **zero** matches for `current_role`/`currentRole` anywhere in the repo.
4. Used `tsc --noEmit` across all 4 packages as the primary correctness
   check — TypeScript's structural typing means a missed reference at any
   layer (a `Profile.currentRole` access, a `database.types.ts` field, a
   destructured Zod-schema key) fails the build. This is a stronger
   guarantee than grep alone for a rename spanning type boundaries.
5. Full `lint` / `test` / `build` / e2e suite after the rename, and again
   after every subsequent change in the same session, to catch any
   regression the rename might have introduced elsewhere.

## Files changed (17)

| Layer | File | What changed |
|---|---|---|
| Types | `packages/types/src/index.ts` | `Profile.currentRole` → `currentJobTitle` |
| Supabase types | `packages/lib/src/supabase/database.types.ts` | `profiles.current_role` → `current_job_title` |
| Mapper | `packages/lib/src/mappers.ts` | `mapProfile` reads `row.current_job_title` |
| Validation | `packages/lib/src/validation/onboarding.ts` | `currentRoleStepSchema`/`currentRole` → `currentJobTitleStepSchema`/`currentJobTitle` |
| Validation test | `packages/lib/src/validation/onboarding.test.ts` | fixture + assertion updated |
| Job matching | `packages/lib/src/job-matching.ts` | `computeRoleFactor` reads `profile.currentJobTitle` |
| Job matching test | `packages/lib/src/job-matching.test.ts` | fixture updated |
| AI prompt builder | `packages/lib/src/ai/match-analysis.ts` | `buildJobMatchPrompt` input field renamed |
| Demo data | `packages/lib/src/demo-data.ts` | `DEMO_PROFILE.currentJobTitle` |
| Jobs actions | `apps/web/features/jobs/actions.ts` | AI match-analysis query selects `current_job_title` |
| Profile page | `apps/web/app/(app)/profile/page.tsx` | reads `profile.currentJobTitle` |
| Coach actions | `apps/web/features/coach/actions.ts` | writes `current_job_title` |
| Coach UI | `apps/web/features/coach/components/goals-editor.tsx` | local state renamed |
| Onboarding actions | `apps/web/features/onboarding/actions.ts` | writes `current_job_title` |
| Onboarding store | `apps/web/features/onboarding/store/onboarding-store.ts` | field + setter renamed |
| Onboarding steps UI | `apps/web/features/onboarding/components/onboarding-steps.tsx` | store field access renamed |
| Onboarding wizard | `apps/web/features/onboarding/components/onboarding-wizard.tsx` | store field access renamed |

No file was found in `supabase/seed.sql`, `docs/`, or any other markdown
report referencing the field — the blast radius was fully contained to
code.

## No compatibility shims

The old identifier was removed everywhere, not aliased or re-exported. No
`current_role` fallback, no dual-write, no deprecated-but-supported field.
The repository and the database schema each have exactly one name for this
concept now.

## Verification

- `tsc --noEmit`: clean across all 4 packages (would fail on any missed
  reference — this is the strongest check performed).
- `pnpm lint`: clean (0 errors).
- `pnpm test`: 178/178 unit tests pass.
- `pnpm build`: clean production build.
- `pnpm test:e2e`: 55/55 e2e tests pass, including the onboarding wizard
  flow and profile page that directly exercise this field.
- Final grep for `current_role|currentRole` across the repo: 0 matches.

## What's still open

The production database itself must have the corrected migration applied
(via `supabase db push` or the dashboard SQL editor) before this code can
run against it — this report covers the repository side only. This
environment has no network path to the live Supabase project (see
`PRODUCTION_AUTH_REPORT.md` from the prior session for that constraint),
so applying the migration is a manual step for the project owner.
