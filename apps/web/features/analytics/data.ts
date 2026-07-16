import "server-only";

import { getMyApplications } from "@/features/applications/data";
import { getMyJourneys } from "@/features/journey/data";
import { computeAnalyticsSummary, computeHiringMomentum, describeHiringMomentum, type AnalyticsSummary, type HiringMomentum } from "@ez/lib";

export type { AnalyticsSummary, HiringMomentum };

export interface AnalyticsPageData {
  summary: AnalyticsSummary;
  momentum: HiringMomentum;
  momentumHighlights: string[];
}

export async function getAnalyticsSummary(userId: string, isDemo: boolean): Promise<AnalyticsPageData> {
  const [applications, journeys] = await Promise.all([
    getMyApplications(userId, isDemo),
    getMyJourneys(userId, isDemo),
  ]);

  const summary = computeAnalyticsSummary(applications, journeys);
  const momentum = computeHiringMomentum(applications);
  const momentumHighlights = describeHiringMomentum(momentum);

  return { summary, momentum, momentumHighlights };
}
