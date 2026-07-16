# EZ — Your Personal Job Search Assistant

Start with [`START_HERE.md`](./START_HERE.md) and the canon documents
under [`docs/canon/`](./docs/canon/). [`docs/IMPLEMENTATION_STATUS.md`](./docs/IMPLEMENTATION_STATUS.md)
tracks what has been built so far.

## Quick start

```bash
pnpm install
pnpm dev       # apps/web on http://localhost:3000 — runs in local demo mode
               # without Supabase/AI credentials, see apps/web/.env.example
```

## Common commands

```bash
pnpm build       # build all packages/apps
pnpm lint        # lint all packages/apps
pnpm typecheck   # typecheck all packages/apps
pnpm test        # unit tests (Vitest)

cd apps/web
pnpm test:e2e    # Playwright end-to-end tests
```

## Repository layout

```text
apps/web/        Next.js application
packages/ui/     Shared design system (Tailwind v4 + Radix + CVA)
packages/lib/    Supabase clients, AI provider abstraction, validation, utils
packages/types/  Shared TypeScript domain types
supabase/        Database migrations, seed data, local config
docs/            Canon documents and engineering references
```
