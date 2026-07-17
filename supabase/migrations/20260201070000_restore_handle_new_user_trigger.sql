-- Verified against the live database: public.handle_new_user() and the
-- on_auth_user_created trigger, both originally defined in
-- 20260101000000_init_schema.sql, do not exist in production even though
-- public.profiles and its RLS policies do. The most likely explanation is
-- that the schema was assembled partially/manually (e.g. via the
-- dashboard Table Editor + Policies UI) rather than by that migration
-- file actually running end to end — those tools create tables and
-- policies but not custom functions/triggers.
--
-- This is written as a standalone, idempotent migration rather than an
-- edit to the original file, so it's safe to apply regardless of what
-- partial state the target database is in: `create or replace function`
-- is inherently idempotent, and the trigger is dropped-if-exists before
-- being recreated.
--
-- This trigger is the PRIMARY mechanism for profile creation, not
-- optional. It runs inside the same transaction as the auth.users insert
-- with SECURITY DEFINER privileges, so it can never be blocked by RLS and
-- never leaves a user with an auth.users row and no profiles row. The
-- application-level self-heal in apps/web/lib/session.ts is a fallback
-- for whenever this trigger is somehow still missing or didn't fire — it
-- depends on the caller's own RLS-scoped session and an extra round trip,
-- neither of which is guaranteed the way this trigger is.
--
-- on conflict (id) do nothing added defensively: without it, if a
-- profiles row already exists for this id for any reason (e.g. created
-- by the application-level self-heal racing this trigger), the insert
-- raises a unique-violation that aborts the entire signup transaction —
-- the original definition had no such guard.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The trigger above only fires for auth.users rows inserted from this point
-- forward. It does nothing for the accounts that were already created while
-- the trigger was missing — verified production evidence shows those
-- accounts exist in auth.users with no corresponding public.profiles row.
-- Those users cannot be repaired by the trigger or by a client-side
-- self-heal (self-heal only runs on a successful sign-in, and these users
-- are exactly the ones who cannot sign in). Backfill them directly, once,
-- here.
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
