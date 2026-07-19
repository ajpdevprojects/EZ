-- Diagnostic only: exposes what the database resolves the CALLER's own
-- role and auth.uid() to be, for the exact request that calls it.
--
-- Why this is needed: local reproduction against this repo's real
-- migrations (RLS policies included) proves the `profiles` table, its
-- policies, and the self-heal insert statement in apps/web/lib/session.ts
-- are all correct — a request authenticated as `authenticated` with
-- auth.uid() = the target id succeeds on every query; the exact production
-- errors (0-row SELECT, then INSERT denied with "new row violates row-level
-- security policy for table \"profiles\"") reproduce ONLY when auth.uid()
-- fails to resolve to the caller's id, regardless of whether a profiles row
-- already exists for that id. That means the fault is in how the specific
-- request's JWT is being authenticated at the PostgREST layer — not in
-- anything this migration set controls — and this sandbox has no network
-- path to the live project to observe that directly. This function lets
-- the running application ask the database that exact question and log
-- the answer on the next real request, closing the one gap local
-- reproduction cannot close by itself.
--
-- Safe to call from any role: it only ever returns the caller's own
-- identity, the same information already decodable from their own JWT
-- client-side. security invoker (the default) so it reflects the calling
-- role, not this migration's.
create or replace function public.debug_whoami()
returns table (effective_role text, resolved_auth_uid uuid)
language sql
stable
as $$
  select current_user::text, auth.uid();
$$;

-- Explicit grant, not relied on default privileges alone, so this works
-- immediately regardless of when default-privilege inheritance was set up.
grant execute on function public.debug_whoami() to anon, authenticated, service_role;
