import "server-only";

import { getMyApplications } from "@/features/applications/data";
import { getMyJourneys } from "@/features/journey/data";
import { computeAnalyticsSummary, type AnalyticsSummary } from "@ez/lib";

export type { AnalyticsSummary };

export async function getAnalyticsSummary(userId: string, isDemo: boolean): Promise<AnalyticsSummary> {
  const [applications, journeys] = await Promise.all([
    getMyApplications(userId, isDemo),
    getMyJourneys(userId, isDemo),
  ]);

  return computeAnalyticsSummary(applications, journeys);
}
