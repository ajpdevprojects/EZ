import { describe, expect, it } from "vitest";
import { computeHiringMomentum, describeHiringMomentum } from "./hiring-momentum";
import type { Application, ApplicationStatus } from "@ez/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeApplication(daysAgo: number, status: ApplicationStatus, id: string): Application {
  return {
    id,
    userId: "user-1",
    jobId: `job-${id}`,
    status,
    matchScore: null,
    matchReason: null,
    appliedAt: null,
    notes: null,
    resumeId: null,
    createdAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
    updatedAt: new Date(Date.now() - daysAgo * DAY_MS).toISOString(),
  };
}

describe("computeHiringMomentum", () => {
  it("reports insufficient data when there's too little history", () => {
    const applications = [makeApplication(5, "applied", "a")];
    const momentum = computeHiringMomentum(applications);
    expect(momentum.hasEnoughData).toBe(false);
  });

  it("detects an improving interview rate", () => {
    const applications = [
      // previous window (31-60 days ago): 4 applications, 0 interviews
      makeApplication(35, "rejected", "a"),
      makeApplication(40, "rejected", "b"),
      makeApplication(45, "applied", "c"),
      makeApplication(50, "applied", "d"),
      // current window (0-30 days ago): 4 applications, 3 interviews
      makeApplication(5, "interviewing", "e"),
      makeApplication(10, "interviewing", "f"),
      makeApplication(15, "offer", "g"),
      makeApplication(20, "applied", "h"),
    ];

    const momentum = computeHiringMomentum(applications);
    expect(momentum.hasEnoughData).toBe(true);
    expect(momentum.current.interviewRate).toBe(75);
    expect(momentum.previous.interviewRate).toBe(0);
    expect(momentum.interviewRateDelta).toBe(75);
  });

  it("computes a zero volume delta when application counts are equal", () => {
    const applications = [
      makeApplication(35, "applied", "a"),
      makeApplication(40, "applied", "b"),
      makeApplication(45, "applied", "c"),
      makeApplication(5, "applied", "d"),
      makeApplication(10, "applied", "e"),
      makeApplication(15, "applied", "f"),
    ];
    const momentum = computeHiringMomentum(applications);
    expect(momentum.volumeDelta).toBe(0);
  });
});

describe("describeHiringMomentum", () => {
  it("is honest about insufficient data rather than fabricating a trend", () => {
    const momentum = computeHiringMomentum([makeApplication(5, "applied", "a")]);
    expect(describeHiringMomentum(momentum)).toEqual([
      "Not enough application history yet to measure momentum — keep applying and check back.",
    ]);
  });

  it("describes an improving interview rate", () => {
    const applications = [
      makeApplication(35, "rejected", "a"),
      makeApplication(40, "rejected", "b"),
      makeApplication(45, "applied", "c"),
      makeApplication(5, "interviewing", "e"),
      makeApplication(10, "interviewing", "f"),
      makeApplication(15, "offer", "g"),
    ];
    const momentum = computeHiringMomentum(applications);
    const lines = describeHiringMomentum(momentum);
    expect(lines.some((line) => line.includes("interview rate is up"))).toBe(true);
  });

  it("stays silent on trivial fluctuations and reports steady metrics instead", () => {
    const applications = [
      makeApplication(35, "interviewing", "a"),
      makeApplication(40, "applied", "b"),
      makeApplication(45, "applied", "c"),
      makeApplication(5, "interviewing", "d"),
      makeApplication(10, "applied", "e"),
      makeApplication(15, "applied", "f"),
    ];
    const momentum = computeHiringMomentum(applications);
    expect(describeHiringMomentum(momentum)).toEqual(["Your job search metrics are holding steady compared to last month."]);
  });
});
