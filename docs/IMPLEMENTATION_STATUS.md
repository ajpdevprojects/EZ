# Implementation Status

Tracks what the EZ platform delivers against the Canon, and what remains
for follow-up work. Update this alongside future milestones (Release
Engineering Canon: release documentation).

## Delivered

### Foundation

- **Monorepo foundation** — Turborepo + pnpm workspaces: `apps/web`
  (Next.js 16 / React 19), `packages/ui` (design system), `packages/lib`
  (Supabase clients, AI provider abstraction, validation, analytics,
  journey logic, ICS generation, utils), `packages/types` (shared domain
  types).
- **Design system** — Tailwind v4 tokens matching the Design Canon
  (Midnight / Slate Blue / Rose Gold / Warm Taupe / Soft Ivory, Playfair
  Display + Inter). Primitives (Button, Input, Select, Card, Badge, Chip,
  Checkbox, Switch, Tabs, Avatar, Divider, Skeleton) and shared components
  (BottomNav, ProgressStepper, EmptyState, SearchBar, StatTile, BarChart,
  PageHeader, Toaster, EzMark/EzWordmark brand marks) built on Radix UI +
  CVA.
- **Data layer** — Supabase schema (`supabase/migrations`) for profiles,
  jobs, applications, journey milestones, interviews, AI conversations,
  resumes, cover letters, learning resources/progress, notifications,
  user integrations, and a private per-user `documents` storage bucket —
  all with RLS policies scoped to the authenticated owner. The app runs in
  a fully functional **local demo mode** with in-memory sample data when
  Supabase env vars are absent, so every screen can be explored without
  credentials.
- **Auth** — Email/password sign in & sign up via Supabase Auth (Server
  Actions), OAuth buttons wired for Google/Apple/LinkedIn (require
  provider configuration in the Supabase project to function).
- **Onboarding** — Adaptive multi-step flow (Goals → Current Role →
  Location → Work Type → Priorities → Complete) with Zustand feature
  state, persisted to the profile on completion.

### Core experience

- **Home (Daily Briefing)** with quick links into the wider platform,
  **Search**, **Job Details** (with AI match analysis and apply flow),
  **Applications Pipeline**, **Ask EZ** (Elizabeth AI chat via Vercel AI
  SDK, provider abstraction across Anthropic/OpenAI/Google), and a
  **Profile** hub linking every feature area — behind a shared
  bottom-navigation shell with a sticky top header (brand mark +
  notification bell).

### Platform Completion Mode + Job Search OS additions

- **Resume System** (`/resume`) — multiple resumes per user, full editor
  (contact, summary, work experience, education, skills) backed by
  `react-hook-form` + `useFieldArray` and a Zod schema, duplicate/delete/
  set-primary actions, and AI-generated feedback on demand.
- **Job Discovery & AI Job Analysis** — `analyzeJobMatchAction` builds a
  prompt from the job posting and the user's primary resume, calls the
  configured AI provider, parses a score + rationale, and persists it to
  the application record; the Job Details page surfaces this as
  "Elizabeth's match analysis" with a re-analyze action.
- **Cover Letters & Documents Center** (`/documents`) — cover letter
  CRUD, one-click "tailor for this application" AI drafting, and an
  uploaded-files section backed by Supabase Storage (the Drive
  substitute) with delete support.
- **Interview Center** (`/interviews`) — schedule/cancel/mark-complete
  actions, upcoming vs. past partitioning, rule-based interview-prep
  question bank (works without AI), AI-drafted follow-up emails, and an
  "Add to Calendar" `.ics` download (`/api/interviews/[id]/ics`) as a
  credential-free Google Calendar substitute.
- **Career Coach** (`/coach`) — editable career goals, a rule-based
  next-steps checklist derived from the user's actual data (resume
  completeness, application activity, interview prep, learning progress),
  and a coaching-flavored Ask EZ chat.
- **Career Journey / Journey Archive** (`/journey`) — automatic milestone
  recording driven by application status transitions
  (`getMilestonesForStatusChange`), active vs. archived journey views,
  per-application timeline, and a reflection editor.
- **Learning Hub** (`/learning`) — a public resource catalog with
  per-user progress tracking (not started / in progress / completed).
- **Notifications** (`/notifications`) — a bell in the app header with
  unread count, a full notifications list, mark-one/mark-all-read
  actions; notifications are created automatically by application and
  interview events.
- **Analytics** (`/analytics`) — pipeline status counts, applications per
  week, response rate, and average days-to-interview, computed by a pure
  `computeAnalyticsSummary` function and rendered as accessible
  table-based bar charts (built per the `dataviz` skill's accessible-chart
  guidance) with a proper empty state.
- **Company Workspace** (`/companies`) — a derived (no new table) view
  that groups applications, interviews, and cover letters by company.
- **Integrations** (`/settings/integrations`) — Gmail, Google Calendar,
  Google Drive, and LinkedIn connection cards using
  `supabase.auth.linkIdentity()` to request the real OAuth scopes needed
  for each integration, with friendly errors when the provider isn't
  configured in the Supabase project. Functional, credential-free
  substitutes ship today regardless of OAuth configuration: `.ics`
  calendar export, AI-drafted (copy/send-yourself) recruiter replies and
  follow-ups, and Supabase Storage as the document vault.
- **Brand assets** — placeholder avatar-circle logos replaced everywhere
  with the real `EzMark`/`EzWordmark` components and a generated favicon.

### Tests

- Vitest unit tests across `packages/lib` (validation, journey logic,
  analytics, ICS generation, AI prompt/response parsing, interview
  question bank), `packages/ui` (primitives, brand marks), and
  `apps/web` (feature state, components).
- Playwright e2e suite (`apps/web/e2e`) covering the original demo-mode
  golden path plus a dedicated `platform-completion.spec.ts` exercising
  every new screen in demo mode: resumes, interviews, coach, journey,
  learning, documents, notifications, analytics, integrations, company
  workspace, job match analysis, and profile hub navigation.
- GitHub Actions CI runs lint, typecheck, unit tests, build, and e2e on
  every push/PR.

## Requires configuration before going further

- **Supabase project** — set `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `apps/web/.env.example`), apply
  `supabase/migrations`, and enable the `documents` storage bucket.
  OAuth providers (Google/Apple/LinkedIn) need to be enabled in the
  Supabase Auth dashboard, including the Gmail/Calendar/Drive scopes in
  `packages/lib/src/constants/integrations.ts`, before the Integrations
  page can connect for real.
- **AI provider** — set at least one of `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` to enable Ask EZ, job
  match analysis, resume feedback, cover letter drafting, and follow-up
  email drafting. Every AI-backed feature degrades gracefully (a friendly
  "not configured" message) when no provider is set.
- **Job ingestion** — the `jobs` table is still a manually seeded catalog
  (`supabase/seed.sql`); no external job-board crawler/API integration
  exists yet (see Deferred below).

## Deferred (not yet built)

- **Automated job discovery** — a background crawler/API integration
  that finds and ingests new job postings from the internet based on a
  user's resume/skills/preferences. Today jobs come from the seeded
  catalog only; discovery is manual (Search).
- **Assisted application submission** — EZ can draft tailored resumes and
  cover letters, but does not yet fill out and submit third-party
  application forms on the user's behalf (with review/approval) — this
  needs either an ATS-specific integration layer or browser automation,
  which is a meaningfully larger architectural addition than anything
  else in this pass and needs explicit approval before starting.
- **Real Gmail inbox sync** — organizing recruiter emails and detecting
  status updates requires the Gmail API (beyond the OAuth scope request
  already wired) plus a background sync job; not built.
- **Real Google Calendar / Drive API sync** — today's ICS export and
  Supabase Storage are functional, credential-free substitutes; two-way
  sync with the actual Google APIs is deferred pending OAuth app
  configuration.
- **"What needs my attention today" unified dashboard** — Home currently
  surfaces recommended jobs and quick links; a single feed merging
  today's interviews, unread recruiter emails, and stale applications
  needing follow-up has not been built as its own view.

These were scoped out of this pass to ship a coherent, tested,
canon-compliant slice end to end rather than a partial version of every
feature. Each should go through the same Canon → Architecture →
Implementation → Verification → Commit workflow before landing.
