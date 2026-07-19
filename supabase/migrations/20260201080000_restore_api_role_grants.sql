-- Restore the Supabase API-role grants that the live database is missing.
--
-- Verified production evidence (2026-07-19): a genuinely authenticated user
-- fails every query against public.profiles with Postgres error 42501
-- ("permission denied for table profiles"). Reproduced exactly against a
-- local PostgreSQL 16 instance running this repository's migrations with no
-- schema-level grants: SELECT, INSERT (the session self-heal), and UPDATE
-- (onboarding completion) are all denied for `authenticated` — and so is
-- every other app table (e.g. notifications, read by the app layout
-- immediately after login).
--
-- Why the grants are missing: none of this repository's migrations ever
-- issues a GRANT. A standard Supabase project doesn't need them because the
-- platform configures ALTER DEFAULT PRIVILEGES for the role its dashboard /
-- CLI runs as, so tables created that way inherit grants for the API roles
-- automatically. This project's live schema was assembled at least partly
-- outside that path (already established: public.handle_new_user() and its
-- trigger were missing in production while the tables and policies existed),
-- by a role whose default privileges do not cover the API roles — so the
-- tables exist with RLS and policies but no underlying table privileges.
--
-- Why GRANT ALL rather than the minimal "GRANT SELECT, INSERT ON
-- public.profiles TO authenticated" from the error hint: PostgreSQL grants
-- and RLS are two layers of the same model. Supabase's intended design
-- grants the API roles full verb-level access to public-schema objects and
-- enforces per-row access exclusively through RLS policies. Granting only
-- select+insert on profiles would "fix" the login bounce while leaving
-- onboarding completion (UPDATE profiles) and all fifteen other app tables
-- still dead. Row-level security is not weakened by this migration in any
-- way: every table in public has RLS enabled (asserted below before any
-- grant is issued) and every policy scopes rows by auth.uid() /
-- service-role checks exactly as before.

-- Safety gate: refuse to run if any table in public somehow has RLS
-- disabled — granting the API roles access to an RLS-less table would
-- expose it wholesale, which this migration must never do.
do $$
declare
  unprotected text;
begin
  select string_agg(c.relname, ', ')
    into unprotected
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'p')
     and not c.relrowsecurity;
  if unprotected is not null then
    raise exception
      'refusing to grant API-role access: RLS is disabled on public table(s): %',
      unprotected;
  end if;
end;
$$;

-- The grants Supabase provisions for a standard project.
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables    in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all routines  in schema public to anon, authenticated, service_role;

-- Make future objects created by the role applying this migration inherit
-- the same grants, so the next migration that adds a table doesn't silently
-- recreate this incident.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
