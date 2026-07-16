import "server-only";

import {
  DEMO_APPLICATIONS,
  DEMO_JOURNEY_MILESTONES,
  mapApplication,
  mapJob,
  mapJourneyMilestone,
} from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Application, JourneyMilestone } from "@ez/types";

const TERMINAL_STATUSES = new Set(["hired", "rejected", "withdrawn"]);

export interface JourneyEntry {
  application: Application;
  milestones: JourneyMilestone[];
}

export async function getMyJourneys(userId: string, isDemo: boolean): Promise<JourneyEntry[]> {
  if (isDemo) {
    return DEMO_APPLICATIONS.map((application) => ({
      application,
      milestones: DEMO_JOURNEY_MILESTONES.filter((milestone) => milestone.applicationId === application.id),
    }));
  }

  const supabase = await createClient();
  if (!supabase) {
    return DEMO_APPLICATIONS.map((application) => ({
      application,
      milestones: DEMO_JOURNEY_MILESTONES.filter((milestone) => milestone.applicationId === application.id),
    }));
  }

  const { data: applicationRows } = await supabase
    .from("applications")
    .select("*, jobs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const applications = (applicationRows ?? []).map((row) => {
    const { jobs: jobRow, ...applicationRow } = row as typeof row & {
      jobs: Parameters<typeof mapJob>[0] | null;
    };
    return mapApplication(applicationRow, jobRow ?? undefined);
  });

  if (applications.length === 0) return [];

  const { data: milestoneRows } = await supabase
    .from("journey_milestones")
    .select("*")
    .in(
      "application_id",
      applications.map((application) => application.id),
    );

  const milestonesByApplication = new Map<string, JourneyMilestone[]>();
  for (const row of milestoneRows ?? []) {
    const milestone = mapJourneyMilestone(row);
    const existing = milestonesByApplication.get(milestone.applicationId) ?? [];
    existing.push(milestone);
    milestonesByApplication.set(milestone.applicationId, existing);
  }

  return applications.map((application) => ({
    application,
    milestones: milestonesByApplication.get(application.id) ?? [],
  }));
}

export function isJourneyComplete(application: Application): boolean {
  return TERMINAL_STATUSES.has(application.status);
}

export async function getJourneyByApplicationId(
  userId: string,
  applicationId: string,
  isDemo: boolean,
): Promise<JourneyEntry | null> {
  const journeys = await getMyJourneys(userId, isDemo);
  return journeys.find((journey) => journey.application.id === applicationId) ?? null;
}
