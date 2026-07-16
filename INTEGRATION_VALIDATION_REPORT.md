# Integration Validation Report — Production Hardening Campaign (PHC) v1.0

Date: 2026-07-17
Branch: `main`

Every integration in the codebase, validated individually. "Real" means:
actual network/API code exists, is exercised by tests, and does what its
UI/docs claim. "Placeholder" means UI or infrastructure exists but the
underlying behavior doesn't — every instance of that below is now
explicitly labeled in-product, not silently passed off as working.

---

## Supabase (auth, database, storage) — REAL, working

Core backend for auth, all data tables, and file storage. Fully audited in
the prior session (`PRODUCTION_AUTH_REPORT.md`) and re-verified today
(`AUTHENTICATION_AUDIT.md`). RLS policies checked across all 7 migrations
during this campaign's security pass — correctly owner-scoped throughout.

## AI providers (Anthropic / OpenAI / Google via Vercel AI SDK) — REAL, now hardened

`packages/lib/src/ai/provider.ts` tries providers in order based on which
API key is configured; `generate.ts` and `agent.ts` do real
`generateText`/`ToolLoopAgent` calls. This is genuine, working
infrastructure — five user-facing features (cover letter drafting,
follow-up email drafting, recruiter reply drafting, resume feedback, job
match analysis) plus the streaming Ask EZ assistant all depend on it.

**Found and fixed this campaign (PHC-05, PHC-06):** the one-shot
generation path had no error handling, so any provider failure (rate
limit, timeout, outage) crashed the calling Server Action instead of
degrading gracefully as the code's own docstring promised. Fixed with a
try/catch + 30s timeout at the single shared call site, covering all five
features at once. The streaming assistant route's request-body parsing
had the same gap for malformed input; also fixed. See `DEFECT_REGISTER.md`
for full detail.

## Job discovery sources (RemoteOK, Remotive) — REAL, working

`packages/lib/src/job-discovery/sources/{remoteok,remotive}.ts` fetch from
real, public, unauthenticated job-listing APIs. `ingest.ts` wraps each
source's fetch in its own try/catch, recording success/failure per source
in `job_ingestion_runs` independently — one source being down doesn't
break ingestion from the other. Both sources have dedicated unit test
coverage (`remoteok.test.ts`, `remotive.test.ts`, both passing).

## Vercel Cron (3 scheduled jobs) — REAL, working, one hardened

`ingest-jobs`, `interview-reminders`, and `daily-briefing` are all real,
functioning scheduled routes, each gated by `CRON_SECRET` via
`verifyCronRequest`. Found and fixed this campaign:

- **PHC-02:** the secret comparison was non-constant-time. Fixed.
- **PHC-08:** the `daily-briefing` job processed users fully sequentially,
  an N+1 pattern that will silently stop finishing all users once the
  base grows large enough to exceed the 120s function timeout. Fixed with
  bounded-concurrency batching; see `DEFECT_REGISTER.md`.

## Gmail, Google Calendar, Google Drive, LinkedIn — PLACEHOLDER, now honestly labeled

**This is the integration reliability finding of this campaign (PHC-07).**

What's real: `apps/web/features/integrations/components/integration-card.tsx`
runs an actual `supabase.auth.linkIdentity()` OAuth consent flow on
"Connect," requesting real scopes:

| Provider | Scope requested |
|---|---|
| Gmail | `gmail.readonly` |
| Google Calendar | `calendar.events` |
| Google Drive | `drive.file` |
| LinkedIn | (default LinkedIn OIDC sign-in scopes) |

What's not real: nothing in this codebase ever reads from any of these
providers after connecting. Verified by:

- No `googleapis` (or equivalent Google API client) dependency in any
  `package.json` in the repo.
- No LinkedIn API client dependency either.
- Repo-wide search for any code path that would consume the granted
  access token beyond storing the connection status — none found.
- Recruiter Inbox, which the Gmail integration's old copy claimed to
  power ("Track recruiter replies automatically"), is confirmed to be
  entirely manual paste-in (`apps/web/features/inbox/actions.ts`,
  `addRecruiterEmailAction` — the function's own docstring calls it "the
  credential-free Gmail substitute").

**Before this campaign:** the UI described each integration as if it were
already syncing data, with no indication otherwise. A user could grant a
real Google account read access to their Gmail and see "Connected" with
no way to know nothing would ever happen with that access.

**Fix applied:** `packages/lib/src/constants/integrations.ts` descriptions
rewritten to stop claiming live behavior ("roadmap," "connecting saves
your place for launch" instead of "automatically," "in sync"); a
`comingSoon` flag added to `IntegrationInfo`; the integration card now
renders a "Sync coming soon" badge next to the connection status for all
four providers. The OAuth connection flow itself was left untouched — it
is real, functioning infrastructure worth keeping for when the sync
feature is built.

**What was explicitly not done, and why:** building actual Gmail/
Calendar/Drive/LinkedIn API integration is a multi-provider new feature —
OAuth token refresh handling, per-provider API clients, sync scheduling,
data mapping into `recruiter_emails`/`interviews`/`resumes` — categorically
out of scope for a "no new features, only production readiness" hardening
pass. Documenting the gap honestly, per this campaign's own stated
requirement ("completed or explicitly documented — no silent failures"),
was the correct-scoped resolution.

## Summary table

| Integration | Status | Action taken |
|---|---|---|
| Supabase | Real | Re-verified, no change |
| AI providers | Real | Hardened (error handling + timeout) |
| RemoteOK / Remotive | Real | Re-verified, no change |
| Vercel Cron | Real | Hardened (timing-safe auth + batching) |
| Gmail / Calendar / Drive / LinkedIn | Placeholder (connection real, sync not built) | Made honest in UI; documented here |
