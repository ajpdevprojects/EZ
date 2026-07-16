import "server-only";

import { DEMO_APPLICATIONS, mapApplication, mapJob } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Application } from "@ez/types";

export async function getMyApplications(userId: string, isDemo: boolean): Promise<Application[]> {
  if (isDemo) return DEMO_APPLICATIONS;

  const supabase = await createClient();
  if (!supabase) return DEMO_APPLICATIONS;

  const { data } = await supabase
    .from("applications")
    .select("*, jobs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const { jobs: jobRow, ...applicationRow } = row as typeof row & {
      jobs: Parameters<typeof mapJob>[0] | null;
    };
    return mapApplication(applicationRow, jobRow ?? undefined);
  });
}

export async function getApplicationForJob(
  userId: string,
  jobId: string,
  isDemo: boolean,
): Promise<Application | null> {
  const applications = await getMyApplications(userId, isDemo);
  return applications.find((application) => application.jobId === jobId) ?? null;
}
