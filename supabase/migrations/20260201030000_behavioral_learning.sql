-- Product Evolution Directive: Software Brain continuous learning.
-- Additive only — no existing table is modified destructively.

-- ---------------------------------------------------------------------
-- dismissed_jobs (negative behavioral signal — "not interested")
-- ---------------------------------------------------------------------
create table public.dismissed_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index dismissed_jobs_user_id_idx on public.dismissed_jobs (user_id);

alter table public.dismissed_jobs enable row level security;

create policy "dismissed jobs are managed by owner"
  on public.dismissed_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- applications: track which resume version was used (resume performance)
-- ---------------------------------------------------------------------
alter table public.applications
  add column resume_id uuid references public.resumes (id) on delete set null;
