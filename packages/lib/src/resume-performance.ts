import type { Application } from "@ez/types";

/**
 * "Which resumes perform better?" (Product Evolution Directive). Pure,
 * deterministic aggregation of application outcomes by which resume was
 * used — no AI required. Surfaced on the Resume System so a user can see
 * which version of their resume is actually landing interviews.
 */
export interface ResumePerformance {
  applications: number;
  interviews: number;
  offers: number;
  interviewRate: number;
}

const INTERVIEW_OR_BETTER_STATUSES = new Set(["interviewing", "offer", "hired"]);
const OFFER_OR_BETTER_STATUSES = new Set(["offer", "hired"]);

export function computeResumePerformance(applications: Application[]): Record<string, ResumePerformance> {
  const performance: Record<string, ResumePerformance> = {};

  for (const application of applications) {
    if (!application.resumeId) continue;

    const entry = performance[application.resumeId] ?? { applications: 0, interviews: 0, offers: 0, interviewRate: 0 };
    entry.applications++;
    if (INTERVIEW_OR_BETTER_STATUSES.has(application.status)) entry.interviews++;
    if (OFFER_OR_BETTER_STATUSES.has(application.status)) entry.offers++;
    performance[application.resumeId] = entry;
  }

  for (const entry of Object.values(performance)) {
    entry.interviewRate = entry.applications > 0 ? Math.round((entry.interviews / entry.applications) * 100) : 0;
  }

  return performance;
}
