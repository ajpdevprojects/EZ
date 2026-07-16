# CLAUDE.md

# EZ Project Instructions for Claude Code

## Mission

EZ is an AI-first career platform. Implement features according to the
project's canonical documentation. Do not introduce new architecture or
technologies without explicit approval.

## Source of Truth

Read these first, in order:

1.  docs/canon/00_EZ_PRODUCT_PHILOSOPHY.md
2.  docs/canon/02_EXPERIENCE_CANON.md
3.  docs/canon/03_EZ_DESIGN_CANON_v1.0.md
4.  docs/canon/04_ENGINEERING_CANON.md
5.  All supporting Engineering Canon documents (04.1--04.14)

## Approved Technology Stack

-   Next.js 16
-   React 19
-   TypeScript
-   Tailwind CSS v4
-   shadcn/ui
-   pnpm
-   Turborepo
-   Supabase
-   PostgreSQL
-   Zustand
-   TanStack Query
-   React Hook Form
-   Zod
-   Vercel AI SDK
-   OpenAI
-   Anthropic
-   Google Gemini
-   Vitest
-   Playwright
-   GitHub Actions
-   Vercel

## Engineering Rules

-   Follow the Engineering Canon before writing code.
-   Reuse shared packages instead of duplicating logic.
-   Keep components modular.
-   Keep the design consistent with the Design Canon.
-   Preserve type safety.
-   Prefer server components where appropriate.
-   Keep commits focused and atomic.
-   Never remove or overwrite canonical documents without approval.

## Workflow

Canon → Architecture → Implementation → Verification → Commit
