import "server-only";

import { DEMO_JOBS, mapJob } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Job } from "@ez/types";

export async function getAllJobs(): Promise<Job[]> {
  const supabase = await createClient();
  if (!supabase) return DEMO_JOBS;

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(500);
  return (data ?? []).map(mapJob);
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const supabase = await createClient();
  if (!supabase) return DEMO_JOBS.find((job) => job.id === jobId) ?? null;

  const { data } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  return data ? mapJob(data) : null;
}

/** Jobs the user actively dismissed from recommendations — a negative signal for the Software Brain. */
export async function getDismissedJobs(userId: string, isDemo: boolean): Promise<Job[]> {
  if (isDemo) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase.from("dismissed_jobs").select("jobs(*)").eq("user_id", userId);
  return (data ?? [])
    .map((row) => (row as { jobs: Parameters<typeof mapJob>[0] | null }).jobs)
    .filter((job): job is Parameters<typeof mapJob>[0] => job !== null)
    .map(mapJob);
}

export async function getDismissedJobIds(userId: string, isDemo: boolean): Promise<Set<string>> {
  if (isDemo) return new Set();

  const supabase = await createClient();
  if (!supabase) return new Set();

  const { data } = await supabase.from("dismissed_jobs").select("job_id").eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.job_id));
}
