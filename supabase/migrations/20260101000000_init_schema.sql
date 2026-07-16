-- EZ platform initial schema
-- Tables: profiles, jobs, applications, journey_milestones, interviews,
-- ai_conversations, ai_messages.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  career_goals text[] not null default '{}',
  current_role text,
  preferred_locations text[] not null default '{}',
  work_types text[] not null default '{}',
  priorities text[] not null default '{}',
  journey_theme text not null default 'executive',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- jobs (shared catalog, read-only to clients)
-- ---------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text,
  is_remote boolean not null default false,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'contract', 'internship')),
  seniority_level text
    check (seniority_level in ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_min integer,
  salary_max integer,
  description text not null,
  skills text[] not null default '{}',
  apply_url text,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index jobs_posted_at_idx on public.jobs (posted_at desc);
create index jobs_skills_idx on public.jobs using gin (skills);

alter table public.jobs enable row level security;

create policy "jobs are viewable by authenticated users"
  on public.jobs for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- applications (a user's pipeline entry for a job)
-- ---------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn')),
  match_score integer check (match_score between 0 and 100),
  match_reason text,
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_job_id_idx on public.applications (job_id);
create index applications_status_idx on public.applications (status);

alter table public.applications enable row level security;

create policy "applications are managed by owner"
  on public.applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- journey_milestones (Journey Archive timeline entries)
-- ---------------------------------------------------------------------
create table public.journey_milestones (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  type text not null check (type in (
    'journey_started', 'resume_completed', 'application_submitted',
    'recruiter_viewed', 'recruiter_replied', 'interview_scheduled',
    'interview_completed', 'offer_received', 'offer_accepted', 'journey_completed'
  )),
  occurred_at timestamptz not null default now(),
  metadata jsonb
);

create index journey_milestones_application_id_idx on public.journey_milestones (application_id);

alter table public.journey_milestones enable row level security;

create policy "journey milestones are managed by application owner"
  on public.journey_milestones for all
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  interview_type text not null default 'video'
    check (interview_type in ('phone', 'video', 'onsite', 'technical')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  scheduled_at timestamptz not null,
  location_or_link text,
  notes text,
  created_at timestamptz not null default now()
);

create index interviews_application_id_idx on public.interviews (application_id);
create index interviews_user_id_idx on public.interviews (user_id);
create index interviews_scheduled_at_idx on public.interviews (scheduled_at);

alter table public.interviews enable row level security;

create policy "interviews are managed by owner"
  on public.interviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- ai_conversations / ai_messages
-- ---------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  context text not null default 'general'
    check (context in ('general', 'resume', 'cover_letter', 'interview_prep')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_id_idx on public.ai_conversations (user_id);

alter table public.ai_conversations enable row level security;

create policy "ai conversations are managed by owner"
  on public.ai_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_id_idx on public.ai_messages (conversation_id);

alter table public.ai_messages enable row level security;

create policy "ai messages are managed by conversation owner"
  on public.ai_messages for all
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
