# Implementation Status

Tracks what the EZ platform's initial build delivers against the Canon,
and what remains for follow-up work. Update this alongside future
milestones (Release Engineering Canon: release documentation).

## Delivered

- **Monorepo foundation** — Turborepo + pnpm workspaces: `apps/web`
  (Next.js 16 / React 19), `packages/ui` (design system), `packages/lib`
  (Supabase clients, AI provider abstraction, validation, utils),
  `packages/types` (shared domain types).
- **Design system** — Tailwind v4 tokens matching the Design Canon
  (Midnight / Slate Blue / Rose Gold / Warm Taupe / Soft Ivory, Playfair
  Display + Inter, dark theme only for this release). Primitives (Button,
  Input, Card, Badge, Chip, Checkbox, Switch, Tabs, Avatar, Divider,
  Skeleton) and shared components (BottomNav, ProgressStepper, EmptyState,
  SearchBar, StatTile, Toaster) built on Radix UI + CVA.
- **Data layer** — Supabase schema (`supabase/migrations`) for profiles,
  jobs, applications, journey milestones, interviews, AI conversations,
  with RLS policies scoped to the authenticated owner. The app runs in a
  fully functional **local demo mode** with in-memory sample data when
  Supabase env vars are absent, so it can be explored without credentials.
- **Auth** — Email/password sign in & sign up via Supabase Auth (Server
  Actions), OAuth buttons wired for Google/Apple/LinkedIn (require
  provider configuration in the Supabase project to function).
- **Onboarding** — Adaptive multi-step flow (Goals → Current Role →
  Location → Work Type → Priorities → Complete) with Zustand feature
  state, persisted to the profile on completion.
- **Home (Daily Briefing)**, **Search**, **Job Details**, **Applications
  Pipeline**, **Ask EZ** (Elizabeth AI chat via Vercel AI SDK, provider
  abstraction across Anthropic/OpenAI/Google), and a **Profile** screen,
  behind a shared bottom-navigation shell.
- **Tests** — Vitest unit tests (validation, formatting, UI primitives,
  feature state), Playwright e2e smoke suite covering the demo-mode
  golden path. GitHub Actions CI runs lint, typecheck, unit tests, build,
  and e2e on every push/PR.

## Requires configuration before going further

- **Supabase project** — set `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `apps/web/.env.example`) and apply
  `supabase/migrations`. OAuth providers (Google/Apple/LinkedIn) need to
  be enabled in the Supabase Auth dashboard.
- **AI provider** — set at least one of `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` to enable Ask EZ.
- **Job ingestion** — the `jobs` table is a manually seeded catalog
  (`supabase/seed.sql`); no external job-board integration exists yet.

## Deferred (not yet built)

- Interview scheduling UI, Journey Archive/timeline, Gmail/Calendar/Drive
  sync, notification system (Journey Themes), resume builder/uploader,
  AI tool-calling (resume tailoring, cover letter drafts) beyond
  conversational chat, and a real onboarding "adaptive decision engine"
  (the current flow is a fixed sequence, not yet personalized by prior
  answers).

These were scoped out of this initial pass to ship a coherent, tested,
canon-compliant slice end to end rather than a partial version of every
feature. Each should go through the same Canon → Architecture →
Implementation → Verification → Commit workflow before landing.
