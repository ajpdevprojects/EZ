# Implementation Status

Tracks what the EZ Job Search Operating System delivers against the
Canon and the Product Directive, and what remains external to the
codebase. Update this alongside future milestones (Release Engineering
Canon: release documentation).

## Architecture: Software Brain + AI Brain

Per the Product Directive, EZ is built around two cooperating systems:

- **Software Brain.** The primary intelligence of the platform —
  deterministic, no AI: job discovery and ingestion, dedupe, confidence
  scoring and skill-gap analysis, continuous behavioral learning from the
  user's own outcomes, the application pipeline, company workspaces, the
  recruiter inbox categorizer, notifications, analytics, and scheduling.
  Lives mostly in `packages/lib` (pure functions, unit tested) with thin
  persistence in `apps/web/features/*/data.ts`. AI never replaces this —
  it only reasons on top of what the Software Brain already decided.
- **AI Brain.** Enhancement only, never a dependency: job-fit
  reasoning/explanation, resume feedback, cover letter drafting, recruiter
  reply drafting, interview prep. Every AI-backed action has a
  `generateElizabethText`/`generateText` call that returns `null` when no
  provider is configured, and every caller falls back to a friendly
  message rather than breaking. **The product is fully usable with zero
  AI providers configured** — this is verified by the demo-mode e2e suite,
  which runs with no `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
  `GOOGLE_GENERATIVE_AI_API_KEY` set.

### Continuous learning (Software Brain, no AI)

The system gets more valuable the longer it's used, entirely through
deterministic signal processing:

- **`packages/lib/src/learning.ts`** — `computeLearnedPreferences` derives
  skill / work-type / remote / salary-range affinities from the outcomes
  a user has already produced: interviews, offers, and hires push a
  skill's weight up; rejections and dismissed recommendations push it
  down. No two users converge on the same weights because the input is
  entirely their own history.
- **Confidence scoring** (`packages/lib/src/job-matching.ts`) — every
  recommendation carries a transparent, itemized breakdown
  (`ConfidenceFactor[]`: skill match, work type, location, role alignment,
  and a "your history" factor fed by the learned preferences above) so
  the user always understands *why* a job was recommended, exactly as the
  directive requires. The "your history" factor is neutral until there's
  at least one outcome to learn from — it never fabricates a signal.
- **Dismissing a recommendation** (`dismissJobRecommendationAction`,
  `dismissed_jobs` table) is a deliberate negative signal: dismissed jobs'
  skills feed back into `computeLearnedPreferences` immediately, so
  similar roles are deprioritized on the next visit — no AI, no delay.
- **Resume performance** (`packages/lib/src/resume-performance.ts`) —
  every application records which resume (`applications.resume_id`) was
  used; the Resume System page shows each resume's application count and
  interview rate so a user can see which version is actually working.

### Proactive Software Brain ("already working" before you open the app)

Per the Product Experience Directive, EZ should feel like it already did
meaningful work before the user opens it — never an empty dashboard the
user has to fill by acting first:

- **`packages/lib/src/daily-briefing-generator.ts`** — the single source
  of truth for the "Good morning, I've already..." story, used in two
  places so it's never out of sync:
  1. **Live on Home** (`MorningGreeting`) — computed fresh on every page
     load from real current state (new opportunities since yesterday,
     today's top match, upcoming interviews, stale follow-ups, unread
     recruiter replies), so the proactive feeling is present immediately
     even before any background job has ever run.
  2. **`apps/web/app/api/cron/daily-briefing`** — a once-daily background
     job (service-role client, `CRON_SECRET`-guarded, scheduled 6am via
     `apps/web/vercel.json`) that persists the same story as a
     `daily_briefing` notification for every user, plus proactive
     `new_opportunity` (newly-discovered high-confidence jobs),
     `follow_up_recommended` (stale applications), and
     `resume_performing_well` (a resume crossing a real interview-rate
     threshold) notifications. Every notification is idempotent — dedup
     keyed by job id, by day, or by a cooldown window — so the job is
     safe to run on every scheduled tick without ever repeating itself or
     becoming noise.
- **Honesty by construction** — the generator never fabricates a
  highlight: an empty state ("Everything is quiet right now") is used
  whenever there's genuinely nothing to report, never a manufactured
  sense of urgency. This mirrors the Product Philosophy's "recommendations
  should be earned... never manipulated."
- **Not built**: "company viewed your application" — EZ does not fabricate
  this signal. No integration in this build actually observes ATS/recruiter
  view activity, and inventing that notification would violate the
  Product Philosophy's honesty principle. The `recruiter_viewed` journey
  milestone type already exists in the schema, ready for a real signal
  source if one is ever integrated.

### Mission Control (Home)

Home answers "what should I work on today?" instead of showing
disconnected widgets, per the directive:

- **Today's priorities** (`packages/lib/src/mission-control.ts`,
  `buildDailyPriorities`) — a goal-driven, ordered list: build a resume if
  missing, prepare for interviews within 48 hours, review unread recruiter
  replies, follow up on applications stalled 14+ days, then apply to
  today's top matches. Falls back to a calm "you're all caught up"
  message when nothing needs attention — the dashboard never manufactures
  urgency.
- **Today's opportunities** — up to 15 confidence-scored, ranked jobs
  (quality over quantity, per the directive's "recommend the best 10–20"
  guidance), already excluding jobs the user applied to or dismissed. The
  first 5 show by default with a "show more" expansion so Home stays calm
  on first load, per the Experience Canon's "never overwhelmed"; every
  card carries its match score, top reason, and a one-click dismiss.

## Delivered

### Foundation

- **Monorepo** — Turborepo + pnpm workspaces: `apps/web` (Next.js 16 /
  React 19), `packages/ui` (design system), `packages/lib` (Supabase
  clients, AI provider abstraction, job discovery, confidence-scored
  matching, behavioral learning, mission control priorities, resume
  performance, validation, analytics, journey logic, ICS generation,
  utils), `packages/types` (shared domain types).
- **Design system** — Tailwind v4 tokens matching the Design Canon.
  Primitives (Button, Input, Select, Card, Badge, Chip, Checkbox, Switch,
  Tabs, Avatar, Divider, Skeleton) and shared components (BottomNav,
  ProgressStepper, EmptyState, SearchBar, StatTile, BarChart, PageHeader,
  Toaster, EzMark/EzWordmark) built on Radix UI + CVA.
- **Data layer** — Supabase schema (`supabase/migrations`) for profiles,
  jobs (with source/dedupe/lifecycle columns), applications, journey
  milestones, interviews, AI conversations, resumes, cover letters,
  learning resources/progress, notifications, user integrations,
  recruiter emails, job ingestion runs, and a private per-user
  `documents` storage bucket — all RLS-scoped to the authenticated owner
  (system-managed tables like `job_ingestion_runs` have RLS enabled with
  zero policies, reachable only via the service-role key). The app runs
  in a fully functional **local demo mode** with in-memory sample data
  when Supabase env vars are absent, so every screen can be explored
  without credentials.
- **Auth** — Email/password sign in & sign up via Supabase Auth (Server
  Actions), OAuth buttons wired for Google/Apple/LinkedIn.
- **Onboarding** — Adaptive multi-step flow persisted to the profile.

### The complete job search workflow

| Stage | Status | Where |
|---|---|---|
| Find & collect jobs | **Built** | Software Engine ingestion from RemoteOK + Remotive public APIs |
| Filter jobs | **Built** | Deterministic `rankJobsForProfile`/`scoreJobForProfile`, learning-adjusted |
| Analyze jobs | **Built** | AI job-fit reasoning on top of the deterministic shortlist |
| Recommend jobs | **Built** | Mission Control Home — confidence-scored, capped at 15, dismissible |
| Generate resume | **Built** | Resume System + AI feedback |
| Generate cover letter | **Built** | Documents Center, one-click tailored drafting |
| User review & approval | **Built** | Every AI draft is copy/edit-before-send; Apply requires an explicit click |
| Submit application | **Built** (internal catalog) / **externally blocked** (third-party ATS auto-fill — see below) |
| Track pipeline | **Built** | Applications Pipeline + Company Workspace |
| Monitor recruiter email | **Built** (manual add + deterministic categorization) / **externally blocked** (live Gmail sync — see below) | Recruiter Inbox |
| Manage documents | **Built** | Documents Center + Supabase Storage |
| Schedule interviews | **Built** | Interview Center + `.ics` export |
| Prepare interviews | **Built** | Rule-based question bank + AI prep |
| Receive offer / archive journey | **Built** | Journey Archive, automatic milestones |

Every stage above that does **not** require a third party's credentials,
legal review, or account approval is fully implemented, tested, and
demo-able end to end.

### Job Discovery (Software Engine)

- **Ingestion pipeline** (`packages/lib/src/job-discovery/`) — pluggable
  `JobSourceAdapter`s for RemoteOK and Remotive (both public,
  unauthenticated JSON APIs), deterministic normalization (seniority,
  employment type, salary parsing, HTML stripping), two-layer dedupe
  (exact source+id, then cross-source content signature), and an
  orchestrator (`ingestJobsFromAllSources`) that upserts into the shared
  `jobs` catalog and archives listings no longer seen after 3 days.
  Every run is logged to `job_ingestion_runs` for observability. 30 unit
  tests cover normalization, dedupe, each source adapter (mocked fetch),
  and the orchestrator (mocked Supabase client).
- **Scheduling** — `apps/web/app/api/cron/ingest-jobs` runs the pipeline
  behind `CRON_SECRET`, wired to run every 6 hours via `apps/web/vercel.json`.
- **Deterministic filtering before AI** — `scoreJobForProfile` /
  `rankJobsForProfile` score every job in the catalog against a user's
  preferences and resume skills (skills overlap, work type, location,
  role alignment) with zero AI calls. Home's "Recommended for you" and
  the Job Details page's "Skill match" card both use this — AI job
  analysis is only ever invoked on a job the user is already looking at,
  never across the whole catalog.

### Recruiter Inbox (Gmail substitute)

- Deterministic email categorization (`packages/lib/src/email-categorization.ts`)
  sorts emails into recruiter outreach / interview / rejection / offer /
  other by keyword rules, and links an email to the right application by
  matching sender domain or company name — no AI involved.
- `/inbox` lets a user paste in a recruiter email (manual entry — works
  today, no OAuth needed); it's categorized, linked to an application,
  and creates a `recruiter_replied` journey milestone + notification
  automatically. AI drafts a reply on request; the user always copies and
  sends it themselves.
- Real Gmail message sync is wired for when Google OAuth is configured
  (see "Externally blocked" below) but the manual path is fully
  functional independent of it.

### Core experience & Platform Completion features

- **Home (Mission Control)**, **Search**, **Job Details** (AI match
  analysis + deterministic skill-gap + apply flow + external-posting
  link for sourced jobs), **Applications Pipeline**, **Ask EZ**, and a
  **Profile** hub linking every feature area.
- **Resume System** (`/resume`) — multiple resumes, full editor, AI
  feedback, per-resume performance stats (applications / interview rate).
- **Documents Center** (`/documents`) — cover letter CRUD, tailored AI
  drafting, Supabase Storage uploads (Drive substitute).
- **Interview Center** (`/interviews`) — schedule/cancel/complete, prep
  question bank, AI follow-up drafts, `.ics` calendar export (Calendar
  substitute).
- **Career Coach** (`/coach`) — goals, rule-based checklist, coaching chat.
- **Career Journey / Journey Archive** (`/journey`) — automatic milestone
  recording, timeline, reflections.
- **Learning Hub** (`/learning`) — resource catalog + progress tracking.
- **Notifications** (`/notifications`) — bell + unread count, created
  automatically by application, interview, and recruiter-email events,
  plus three scheduled background jobs: interview reminders (hourly),
  and the daily briefing job's new-opportunity / follow-up / resume-
  performance / daily-summary notifications (once daily).
- **Analytics** (`/analytics`) — pipeline counts, response rate, accessible
  bar charts.
- **Company Workspace** (`/companies`) — derived view grouping
  applications, interviews, and cover letters by company.
- **Integrations** (`/settings/integrations`) — Gmail/Calendar/Drive/
  LinkedIn connect cards via `supabase.auth.linkIdentity()`.
- **Brand assets** — `EzMark`/`EzWordmark` everywhere, generated favicon.

### Tests

- **154 unit tests** across `packages/lib`, `packages/ui`, and `apps/web`
  (Vitest) covering validation, journey logic, analytics, ICS generation,
  AI prompt/response parsing, job discovery (sources, normalize, dedupe,
  ingest orchestration), confidence scoring, behavioral learning, mission
  control priorities, the daily briefing generator (summary + notification
  planning), resume performance, skill-gap analysis, email categorization,
  cron auth, and UI primitives/components.
- **25 Playwright e2e tests** (`apps/web/e2e`) against a production build
  in demo mode — the full golden path plus every feature screen: resumes
  (with performance stats), interviews, coach, journey, learning,
  documents, inbox, notifications, analytics, integrations, company
  workspace, the proactive morning greeting, Mission Control priorities,
  confidence-scored recommendations + dismissal, job match analysis +
  skill-gap, and profile navigation.
- GitHub Actions CI runs lint, typecheck, unit tests, build, and e2e on
  every push/PR.

## Requires configuration (infrastructure you own — not a code gap)

These are settings an operator sets when deploying; the code path is
complete and degrades gracefully without them.

- **Supabase project** — `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  apply `supabase/migrations`, enable the `documents` storage bucket.
- **AI provider** — one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` /
  `GOOGLE_GENERATIVE_AI_API_KEY`. Every AI feature degrades to a friendly
  "not configured" message without it — nothing breaks.
- **Background jobs** — `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` to
  enable job ingestion, interview reminders, and the daily briefing job;
  deploying to Vercel picks up `apps/web/vercel.json`'s three schedules
  automatically once those are set.

## Externally blocked (cannot be completed inside this repository)

- **Live Gmail sync** — reading a user's actual inbox requires a Google
  Cloud OAuth consent screen with the `gmail.readonly` **sensitive
  scope**, which Google requires to pass an app verification / CASA
  security assessment before it can be used outside test mode. That's a
  third-party account + review process, not an engineering task. The
  OAuth connect button (`linkIdentity`) and the categorization/linking
  engine are both built and ready to consume real messages the moment
  that verification exists; manual email add is the fully-functional
  substitute today.
- **Live Google Calendar / Drive two-way sync** — same blocker: the
  `calendar.events` and `drive.file` scopes need a verified Google Cloud
  OAuth app. `.ics` export and Supabase Storage are the functional,
  credential-free substitutes shipped today.
- **Third-party ATS application auto-submission** — actually filling out
  and submitting an application on LinkedIn/Greenhouse/Lever/etc. on the
  user's behalf requires either a partner API agreement with each ATS
  (most require a signed agreement, not just an API key) or browser
  automation against sites whose Terms of Service typically prohibit
  automated submission — a legal/policy decision, not a coding gap. EZ's
  "Submit Application" is fully built and real for jobs discovered
  through EZ's own catalog (recorded, tracked, milestoned); for jobs
  sourced externally, EZ links out to the original posting so the human
  makes the final submission, consistent with the Product Philosophy's
  "the professional always owns the final decision."
- **Additional job-board sources beyond RemoteOK/Remotive** — most major
  boards (LinkedIn Jobs, Indeed Publisher, ZipRecruiter) require a signed
  partner agreement or paid API contract to access listings
  programmatically; they cannot be added without that business
  relationship. The ingestion architecture (`JobSourceAdapter`) is
  designed so adding a new source, once such an agreement exists, is a
  single new file plus a line in `JOB_SOURCES` — no other code changes.
- **Production cron activation** — `apps/web/vercel.json` defines the
  schedules; they only actually fire once the project is deployed on
  Vercel with `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` set as
  environment variables in that project. This is a deployment step, not
  code.

Nothing else is deferred. Every stage of the canonical job-search
workflow that can be built without a third party's credentials, legal
sign-off, or account approval is implemented, tested, and wired together
as one product.
