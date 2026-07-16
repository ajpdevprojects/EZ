-- Platform Completion Mode: Resume System, Documents Center, Learning Hub,
-- Notifications, and Integrations. Additive only — no existing table is
-- modified destructively.

-- ---------------------------------------------------------------------
-- resumes
-- ---------------------------------------------------------------------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled resume',
  is_primary boolean not null default false,
  template text not null default 'classic' check (template in ('classic', 'modern', 'minimal')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes enable row level security;

create policy "resumes are managed by owner"
  on public.resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- cover_letters
-- ---------------------------------------------------------------------
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  title text not null default 'Untitled cover letter',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cover_letters_user_id_idx on public.cover_letters (user_id);
create index cover_letters_application_id_idx on public.cover_letters (application_id);

alter table public.cover_letters enable row level security;

create policy "cover letters are managed by owner"
  on public.cover_letters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger cover_letters_set_updated_at
  before update on public.cover_letters
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- learning_resources (shared catalog, read-only to clients)
-- ---------------------------------------------------------------------
create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  resource_type text not null check (resource_type in ('article', 'video', 'course')),
  skill_tags text[] not null default '{}',
  url text,
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index learning_resources_category_idx on public.learning_resources (category);
create index learning_resources_skill_tags_idx on public.learning_resources using gin (skill_tags);

alter table public.learning_resources enable row level security;

create policy "learning resources are viewable by authenticated users"
  on public.learning_resources for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- learning_progress
-- ---------------------------------------------------------------------
create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.learning_resources (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index learning_progress_user_id_idx on public.learning_progress (user_id);

alter table public.learning_progress enable row level security;

create policy "learning progress is managed by owner"
  on public.learning_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger learning_progress_set_updated_at
  before update on public.learning_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- notifications (Journey Notifications, Experience Canon)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'daily_briefing', 'new_opportunity', 'recruiter_replied',
    'interview_scheduled', 'interview_reminder', 'offer_received',
    'journey_completed'
  )),
  title text not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_user_id_read_at_idx on public.notifications (user_id, read_at);

alter table public.notifications enable row level security;

create policy "notifications are managed by owner"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- user_integrations (Gmail / Calendar / Drive / LinkedIn sync status)
-- ---------------------------------------------------------------------
create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in (
    'google_gmail', 'google_calendar', 'google_drive', 'linkedin'
  )),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected')),
  connected_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index user_integrations_user_id_idx on public.user_integrations (user_id);

alter table public.user_integrations enable row level security;

create policy "integrations are managed by owner"
  on public.user_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_integrations_set_updated_at
  before update on public.user_integrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ai_conversations: extend context enum for Career Coach
-- ---------------------------------------------------------------------
alter table public.ai_conversations drop constraint ai_conversations_context_check;
alter table public.ai_conversations add constraint ai_conversations_context_check
  check (context in ('general', 'resume', 'cover_letter', 'interview_prep', 'career_coaching'));
