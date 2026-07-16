# START_HERE.md

# Welcome to EZ

Welcome to the EZ repository.

This repository follows a **Canon-First** development approach. Every
feature is designed before it is implemented.

------------------------------------------------------------------------

# What is EZ?

EZ is an AI-first career platform focused on helping users discover
opportunities, prepare applications, and grow their careers through a
premium, AI-powered experience.

------------------------------------------------------------------------

# Repository Structure

``` text
apps/          # Applications
packages/      # Shared libraries
assets/        # Design assets
docs/          # Documentation and Canon
supabase/      # Database, migrations, policies
scripts/       # Utility scripts
```

------------------------------------------------------------------------

# Read These First

Before writing code, read the canon documents in this order:

1.  Product Philosophy
2.  Experience Canon
3.  Design Canon
4.  Engineering Canon

These documents are the source of truth for the project.

------------------------------------------------------------------------

# Approved Tech Stack

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
-   Zod
-   React Hook Form
-   Vercel AI SDK
-   Vitest
-   Playwright
-   GitHub Actions
-   Vercel

------------------------------------------------------------------------

# Development Workflow

    Plan
        ↓
    Canon
        ↓
    Implementation
        ↓
    Testing
        ↓
    Review
        ↓
    Commit

------------------------------------------------------------------------

# Common Commands

Install dependencies

``` bash
pnpm install
```

Start development

``` bash
pnpm dev
```

Build

``` bash
pnpm build
```

Run tests

``` bash
pnpm test
```

------------------------------------------------------------------------

# AI Assistants

-   `CLAUDE.md` contains instructions for Claude Code.
-   `AGENTS.md` contains shared instructions for AI coding assistants.

------------------------------------------------------------------------

# Guiding Principle

> The Canon defines the product.
>
> The repository implements the Canon.

If there is ever a conflict between code and documentation, update the
implementation to match the approved Canon unless a new product decision
has been made.
