import "server-only";

import { DEMO_INTERVIEWS, mapApplication, mapInterview, mapJob } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Interview } from "@ez/types";

function mapInterviewRow(
  row: Record<string, unknown> & {
    applications?: (Record<string, unknown> & { jobs?: Parameters<typeof mapJob>[0] | null }) | null;
  },
): Interview {
  const { applications: applicationRow, ...interviewRow } = row;
  if (!applicationRow) return mapInterview(interviewRow as Parameters<typeof mapInterview>[0]);

  const { jobs: jobRow, ...applicationOnly } = applicationRow;
  return mapInterview(
    interviewRow as Parameters<typeof mapInterview>[0],
    applicationOnly as Parameters<typeof mapApplication>[0],
    jobRow ?? undefined,
  );
}

export async function getMyInterviews(userId: string, isDemo: boolean): Promise<Interview[]> {
  if (isDemo) return DEMO_INTERVIEWS;

  const supabase = await createClient();
  if (!supabase) return DEMO_INTERVIEWS;

  const { data } = await supabase
    .from("interviews")
    .select("*, applications(*, jobs(*))")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  return (data ?? []).map((row) => mapInterviewRow(row as never));
}

export async function getInterviewById(
  userId: string,
  interviewId: string,
  isDemo: boolean,
): Promise<Interview | null> {
  if (isDemo) return DEMO_INTERVIEWS.find((interview) => interview.id === interviewId) ?? null;

  const supabase = await createClient();
  if (!supabase) return DEMO_INTERVIEWS.find((interview) => interview.id === interviewId) ?? null;

  const { data } = await supabase
    .from("interviews")
    .select("*, applications(*, jobs(*))")
    .eq("id", interviewId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapInterviewRow(data as never) : null;
}
