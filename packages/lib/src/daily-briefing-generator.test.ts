import { describe, expect, it } from "vitest";
import { buildDailyBriefingSummary, planDailyBriefingNotifications } from "./daily-briefing-generator";
import type { DailyBriefingSummaryInput, DailyNotificationPlanInput } from "./daily-briefing-generator";

function makeSummaryInput(overrides: Partial<DailyBriefingSummaryInput> = {}): DailyBriefingSummaryInput {
  return {
    greetingName: "Alex",
    newJobsCount: 0,
    topOpportunity: null,
    upcomingInterviewCount: 0,
    staleApplicationCount: 0,
    unreadRecruiterEmailCount: 0,
    ...overrides,
  };
}

describe("buildDailyBriefingSummary", () => {
  it("falls back to a calm message when nothing needs attention", () => {
    const summary = buildDailyBriefingSummary(makeSummaryInput());
    expect(summary.greeting).toBe("Good morning, Alex.");
    expect(summary.highlights).toEqual(["Everything is quiet right now — check back soon for new opportunities."]);
  });

  it("never fabricates a new-jobs highlight when the count is zero", () => {
    const summary = buildDailyBriefingSummary(makeSummaryInput({ newJobsCount: 0, unreadRecruiterEmailCount: 1 }));
    expect(summary.highlights.some((h) => h.includes("new"))).toBe(false);
  });

  it("reports new opportunities discovered", () => {
    const summary = buildDailyBriefingSummary(makeSummaryInput({ newJobsCount: 3 }));
    expect(summary.highlights[0]).toBe("I found 3 new opportunities since yesterday.");
  });

  it("uses singular phrasing for a single new job", () => {
    const summary = buildDailyBriefingSummary(makeSummaryInput({ newJobsCount: 1 }));
    expect(summary.highlights[0]).toBe("I found 1 new opportunity since yesterday.");
  });

  it("reports the top opportunity with its confidence score", () => {
    const summary = buildDailyBriefingSummary(
      makeSummaryInput({ topOpportunity: { title: "Product Designer", company: "Acme", score: 91 } }),
    );
    expect(summary.highlights).toContain("Your top match today is Product Designer at Acme (91% confidence).");
  });

  it("reports upcoming interviews, stale applications, and unread recruiter emails together", () => {
    const summary = buildDailyBriefingSummary(
      makeSummaryInput({ upcomingInterviewCount: 2, staleApplicationCount: 1, unreadRecruiterEmailCount: 3 }),
    );
    expect(summary.highlights).toEqual([
      "You have 2 interviews coming up.",
      "1 application hasn't moved in a while — a follow-up could help.",
      "3 recruiter replies are waiting in your inbox.",
    ]);
  });
});

function makePlanInput(overrides: Partial<DailyNotificationPlanInput> = {}): DailyNotificationPlanInput {
  return {
    ...makeSummaryInput(),
    newHighConfidenceJobs: [],
    resumePerformanceAlerts: [],
    ...overrides,
  };
}

describe("planDailyBriefingNotifications", () => {
  it("always includes exactly one daily_briefing notification", () => {
    const planned = planDailyBriefingNotifications(makePlanInput());
    expect(planned.filter((p) => p.type === "daily_briefing")).toHaveLength(1);
  });

  it("plans a new_opportunity notification per discovered high-confidence job", () => {
    const planned = planDailyBriefingNotifications(
      makePlanInput({
        newHighConfidenceJobs: [{ jobId: "job-1", title: "Frontend Engineer", company: "Acme", score: 88 }],
      }),
    );
    const jobNotification = planned.find((p) => p.type === "new_opportunity");
    expect(jobNotification?.metadata).toEqual({ jobId: "job-1" });
    expect(jobNotification?.body).toContain("88% match");
  });

  it("caps new_opportunity notifications to avoid becoming noise", () => {
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      jobId: `job-${i}`,
      title: `Role ${i}`,
      company: "Acme",
      score: 80,
    }));
    const planned = planDailyBriefingNotifications(makePlanInput({ newHighConfidenceJobs: jobs }));
    expect(planned.filter((p) => p.type === "new_opportunity")).toHaveLength(2);
  });

  it("plans a follow_up_recommended notification only when there are stale applications", () => {
    expect(planDailyBriefingNotifications(makePlanInput()).some((p) => p.type === "follow_up_recommended")).toBe(
      false,
    );
    const planned = planDailyBriefingNotifications(makePlanInput({ staleApplicationCount: 2 }));
    expect(planned.some((p) => p.type === "follow_up_recommended")).toBe(true);
  });

  it("plans a resume_performing_well notification per alert", () => {
    const planned = planDailyBriefingNotifications(
      makePlanInput({
        resumePerformanceAlerts: [
          { resumeId: "resume-1", resumeTitle: "Product Designer Resume", interviewRate: 60, applications: 5 },
        ],
      }),
    );
    const resumeNotification = planned.find((p) => p.type === "resume_performing_well");
    expect(resumeNotification?.metadata).toEqual({ resumeId: "resume-1" });
    expect(resumeNotification?.body).toContain("60%");
  });
});
