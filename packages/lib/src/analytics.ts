import type { Application, ApplicationStatus, JourneyMilestone } from "@ez/types";

export interface AnalyticsDatum {
  label: string;
  value: number;
}

export interface AnalyticsSummary {
  statusCounts: AnalyticsDatum[];
  applicationsPerWeek: AnalyticsDatum[];
  responseRatePercent: number;
  averageDaysToInterview: number | null;
  totalApplications: number;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const PIPELINE_STATUSES: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "hired"];

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export interface JourneyEntryLike {
  application: Application;
  milestones: JourneyMilestone[];
}

export function computeAnalyticsSummary(
  applications: Application[],
  journeys: JourneyEntryLike[],
  now: Date = new Date(),
): AnalyticsSummary {
  const statusCounts = PIPELINE_STATUSES.map((status) => ({
    label: STATUS_LABEL[status],
    value: applications.filter((application) => application.status === status).length,
  }));

  const weeks: Array<{ label: string; value: number; start: Date }> = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    weeks.push({
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
      start,
    });
  }
  for (const application of applications) {
    const created = new Date(application.createdAt);
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (created >= weeks[i].start) {
        weeks[i].value += 1;
        break;
      }
    }
  }

  const applicationsWithReplies = journeys.filter((journey) =>
    journey.milestones.some((milestone) => milestone.type === "recruiter_replied"),
  ).length;
  const submittedApplications = applications.filter((application) => application.status !== "saved").length;
  const responseRatePercent =
    submittedApplications === 0 ? 0 : Math.round((applicationsWithReplies / submittedApplications) * 100);

  const daysToInterview: number[] = [];
  for (const journey of journeys) {
    const scheduledMilestone = journey.milestones.find((milestone) => milestone.type === "interview_scheduled");
    if (!scheduledMilestone) continue;
    const days =
      (new Date(scheduledMilestone.occurredAt).getTime() - new Date(journey.application.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days >= 0) daysToInterview.push(days);
  }
  const averageDaysToInterview =
    daysToInterview.length === 0
      ? null
      : Math.round(daysToInterview.reduce((sum, days) => sum + days, 0) / daysToInterview.length);

  return {
    statusCounts,
    applicationsPerWeek: weeks.map(({ label, value }) => ({ label, value })),
    responseRatePercent,
    averageDaysToInterview,
    totalApplications: applications.length,
  };
}
