-- Job Search Operating System: Software Engine job discovery + Recruiter
-- Inbox (Gmail substitute). Additive only — no existing table is modified
-- destructively.

-- ---------------------------------------------------------------------
-- jobs: extend for automated discovery/ingestion
-- ---------------------------------------------------------------------
alter table public.jobs
  add column source text not null default 'internal',
  add column source_id text,
  add column is_active boolean not null default true,
  add column expires_at timestamptz,
  add column last_seen_at timestamptz not null default now();

create unique index jobs_source_source_id_key
  on public.jobs (source, source_id)
  where source_id is not null;

create index jobs_is_active_idx on public.jobs (is_active);

-- ---------------------------------------------------------------------
-- job_ingestion_runs (Software Engine observability/audit log)
-- ---------------------------------------------------------------------
create table public.job_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  jobs_found integer not null default 0,
  jobs_created integer not null default 0,
  jobs_updated integer not null default 0,
  jobs_archived integer not null default 0,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index job_ingestion_runs_started_at_idx on public.job_ingestion_runs (started_at desc);

alter table public.job_ingestion_runs enable row level security;

-- System-managed table: no client-facing policy is created, so it is only
-- reachable through the service-role key used by the background ingestion
-- job (see packages/lib/src/supabase/service.ts). RLS stays enabled with
-- zero policies, which denies all anon/authenticated access by default.

-- ---------------------------------------------------------------------
-- recruiter_emails (Recruiter Inbox — Gmail substitute)
-- ---------------------------------------------------------------------
create table public.recruiter_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'gmail')),
  gmail_message_id text,
  from_name text,
  from_email text not null,
  subject text not null,
  body text not null,
  category text not null default 'other'
    check (category in ('recruiter_outreach', 'interview', 'rejection', 'offer', 'other')),
  received_at timestamptz not null default now(),
  read_at timestamptz,
  draft_reply text,
  created_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create index recruiter_emails_user_id_idx on public.recruiter_emails (user_id);
create index recruiter_emails_application_id_idx on public.recruiter_emails (application_id);
create index recruiter_emails_received_at_idx on public.recruiter_emails (received_at desc);

alter table public.recruiter_emails enable row level security;

create policy "recruiter emails are managed by owner"
  on public.recruiter_emails for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
