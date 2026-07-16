import "server-only";

import { getMilestonesForStatusChange, type Database } from "@ez/lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStatus, NotificationType } from "@ez/types";

type Client = SupabaseClient<Database>;

/**
 * Records the journey milestones implied by an application status
 * change, extending the Journey Archive timeline automatically whenever
 * an application, interview, or offer action changes state.
 */
export async function recordApplicationStatusMilestones(
  supabase: Client,
  applicationId: string,
  status: ApplicationStatus,
) {
  const milestoneTypes = getMilestonesForStatusChange(status);
  if (milestoneTypes.length === 0) return;

  await supabase
    .from("journey_milestones")
    .insert(milestoneTypes.map((type) => ({ application_id: applicationId, type })));
}

export async function recordMilestone(supabase: Client, applicationId: string, type: string) {
  await supabase.from("journey_milestones").insert({ application_id: applicationId, type });
}

export async function createNotification(
  supabase: Client,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata?: Record<string, unknown>,
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    metadata: metadata ?? null,
  });
}
