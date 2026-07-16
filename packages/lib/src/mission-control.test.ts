import { describe, expect, it } from "vitest";
import { buildDailyPriorities, getStaleApplications } from "./mission-control";
import type { Application } from "@ez/types";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    userId: "user-1",
    jobId: "job-1",
    status: "applied",
    matchScore: null,
    matchReason: null,
    appliedAt: null,
    notes: null,
    resumeId: null,
    createdAt: "",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("getStaleApplications", () => {
  const now = new Date("2026-07-16T00:00:00.000Z");

  it("flags active applications untouched for 14+ days", () => {
    const stale = makeApplication({ updatedAt: new Date(now.getTime() - 15 * 86400000).toISOString() });
    expect(getStaleApplications([stale], now)).toHaveLength(1);
  });

  it("does not flag recently updated applications", () => {
    const fresh = makeApplication({ updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString() });
    expect(getStaleApplications([fresh], now)).toHaveLength(0);
  });

  it("ignores applications in terminal or saved states", () => {
    const rejected = makeApplication({
      status: "rejected",
      updatedAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    });
    const saved = makeApplication({
      status: "saved",
      updatedAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    });
    expect(getStaleApplications([rejected, saved], now)).toHaveLength(0);
  });
});

describe("buildDailyPriorities", () => {
  it("prioritizes building a resume above everything else", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: false,
      unreadRecruiterEmailCount: 2,
      upcomingInterviews: [],
      staleApplicationCount: 1,
      topOpportunityCount: 5,
    });
    expect(priorities[0].id).toBe("build-resume");
  });

  it("surfaces upcoming interview prep ahead of routine tasks", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: true,
      unreadRecruiterEmailCount: 0,
      upcomingInterviews: [{ id: "interview-1", jobTitle: "Product Designer", company: "Acme" }],
      staleApplicationCount: 0,
      topOpportunityCount: 0,
    });
    expect(priorities[0].id).toBe("prep-interview-interview-1");
    expect(priorities[0].urgent).toBe(true);
  });

  it("includes a recruiter-reply priority when there are unread emails", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: true,
      unreadRecruiterEmailCount: 3,
      upcomingInterviews: [],
      staleApplicationCount: 0,
      topOpportunityCount: 0,
    });
    expect(priorities.some((priority) => priority.id === "review-inbox")).toBe(true);
    expect(priorities[0].label).toContain("3");
  });

  it("includes a follow-up priority for stale applications", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: true,
      unreadRecruiterEmailCount: 0,
      upcomingInterviews: [],
      staleApplicationCount: 2,
      topOpportunityCount: 0,
    });
    expect(priorities.some((priority) => priority.id === "follow-up")).toBe(true);
  });

  it("falls back to a calm all-caught-up message when nothing needs attention", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: true,
      unreadRecruiterEmailCount: 0,
      upcomingInterviews: [],
      staleApplicationCount: 0,
      topOpportunityCount: 0,
    });
    expect(priorities).toEqual([
      {
        id: "all-caught-up",
        label: "You're all caught up",
        description: "Check back later for new opportunities, or explore the Learning Hub.",
        href: "/learning",
        urgent: false,
      },
    ]);
  });

  it("caps interview prep priorities at two even with more upcoming", () => {
    const priorities = buildDailyPriorities({
      hasPrimaryResume: true,
      unreadRecruiterEmailCount: 0,
      upcomingInterviews: [
        { id: "a", jobTitle: "A", company: "A" },
        { id: "b", jobTitle: "B", company: "B" },
        { id: "c", jobTitle: "C", company: "C" },
      ],
      staleApplicationCount: 0,
      topOpportunityCount: 0,
    });
    expect(priorities.filter((priority) => priority.id.startsWith("prep-interview"))).toHaveLength(2);
  });
});
