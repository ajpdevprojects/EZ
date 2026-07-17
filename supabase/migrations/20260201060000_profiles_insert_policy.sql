-- Auth hardening: profiles never had an INSERT policy for the owning
-- user. Row creation relied entirely on the SECURITY DEFINER
-- handle_new_user() trigger, which bypasses RLS by running with the
-- function owner's privileges. That's fine when the trigger fires — but
-- whenever it doesn't (schema drift, a migration that failed partway, a
-- user created before the trigger existed), a signed-in user's own
-- session has no way to create its own missing profile row: RLS denies
-- the insert with no policy present, even for auth.uid() = id. This is
-- the write-side counterpart to the existing select/update policies.
-- Additive only — no existing table or policy is modified.

create policy "profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);
