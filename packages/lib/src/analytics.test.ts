import type { Application, JourneyMilestone } from "@ez/types";
import { describe, expect, it } from "vitest";
import { computeAnalyticsSummary, type JourneyEntryLike } from "./analytics";

function makeApplication(overrides: Partial<Application>): Application {
  return {
    id: "app-1",
    userId: "user-1",
    jobId: "job-1",
    status: "applied",
    matchScore: null,
    matchReason: null,
    appliedAt: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeAnalyticsSummary", () => {
  it("counts applications per pipeline stage", () => {
    const applications = [
      makeApplication({ id: "1", status: "applied" }),
      makeApplication({ id: "2", status: "applied" }),
      makeApplication({ id: "3", status: "interviewing" }),
      makeApplication({ id: "4", status: "hired" }),
    ];
    const summary = computeAnalyticsSummary(applications, []);
    const byLabel = Object.fromEntries(summary.statusCounts.map((d) => [d.label, d.value]));
    expect(byLabel.Applied).toBe(2);
    expect(byLabel.Interviewing).toBe(1);
    expect(byLabel.Hired).toBe(1);
    expect(summary.totalApplications).toBe(4);
  });

  it("computes response rate from recruiter_replied milestones, excluding saved jobs", () => {
    const applications = [
      makeApplication({ id: "1", status: "applied" }),
      makeApplication({ id: "2", status: "applied" }),
      makeApplication({ id: "3", status: "saved" }),
    ];
    const journeys: JourneyEntryLike[] = [
      {
        application: applications[0],
        milestones: [
          { id: "m1", applicationId: "1", type: "recruiter_replied", occurredAt: new Date().toISOString(), metadata: null },
        ],
      },
      { application: applications[1], milestones: [] },
      { application: applications[2], milestones: [] },
    ];
    const summary = computeAnalyticsSummary(applications, journeys);
    // 1 of 2 non-saved applications got a reply
    expect(summary.responseRatePercent).toBe(50);
  });

  it("computes average days to interview from interview_scheduled milestones", () => {
    const created = new Date("2024-01-01T00:00:00Z");
    const scheduled = new Date("2024-01-06T00:00:00Z");
    const application = makeApplication({ id: "1", createdAt: created.toISOString() });
    const milestones: JourneyMilestone[] = [
      { id: "m1", applicationId: "1", type: "interview_scheduled", occurredAt: scheduled.toISOString(), metadata: null },
    ];
    const summary = computeAnalyticsSummary([application], [{ application, milestones }]);
    expect(summary.averageDaysToInterview).toBe(5);
  });

  it("returns null average days to interview when no interviews were scheduled", () => {
    const application = makeApplication({ id: "1" });
    const summary = computeAnalyticsSummary([application], [{ application, milestones: [] }]);
    expect(summary.averageDaysToInterview).toBeNull();
  });
});
