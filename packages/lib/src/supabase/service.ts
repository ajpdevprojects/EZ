import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Service-role Supabase client for trusted background jobs (job ingestion,
 * scheduled reminders) that run without a signed-in user and must bypass
 * Row Level Security to write system-managed tables like `jobs` and
 * `job_ingestion_runs`.
 *
 * Requires `SUPABASE_SERVICE_ROLE_KEY`, which must never be exposed to the
 * browser — this module is guarded by the `server-only` import and should
 * only ever be reached from Route Handlers invoked by a scheduler (Vercel
 * Cron) behind a shared secret, never from a Server Action reachable by a
 * signed-in user's request.
 */
export function createServiceClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRoleKey) return null;

  return createSupabaseClient<Database>(env.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
