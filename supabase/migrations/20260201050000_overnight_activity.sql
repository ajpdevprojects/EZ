-- Product Intelligence Directive: Daily Mission & Proactive Operating
-- System. The Software Brain needs to honestly report overnight activity
-- (jobs discovered, duplicates removed) computed live on Home — not only
-- from the once-daily cron notification — so this needs a read-only
-- policy for authenticated users, matching the existing pattern for the
-- shared `jobs` and `learning_resources` catalogs.

alter table public.job_ingestion_runs
  add column jobs_duplicates_removed integer not null default 0;

create policy "job ingestion runs are viewable by authenticated users"
  on public.job_ingestion_runs for select
  to authenticated
  using (true);
