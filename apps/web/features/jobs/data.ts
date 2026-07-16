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
