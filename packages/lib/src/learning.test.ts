import { describe, expect, it } from "vitest";
import { computeLearnedPreferences } from "./learning";
import type { Application, Job } from "@ez/types";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Frontend Engineer",
    company: "Acme",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "mid",
    salaryMin: 100000,
    salaryMax: 130000,
    description: "",
    skills: ["React"],
    applyUrl: null,
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
    ...overrides,
  };
}

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
    updatedAt: "",
    job: makeJob(),
    ...overrides,
  };
}

describe("computeLearnedPreferences", () => {
  it("returns a neutral, empty-sample result with no history", () => {
    const result = computeLearnedPreferences([]);
    expect(result.sampleSize).toBe(0);
    expect(result.skillAffinity).toEqual({});
    expect(result.remoteAffinity).toBe(0);
    expect(result.salarySweetSpot).toBeNull();
  });

  it("gives positive skill affinity to skills present in interviews/offers/hires", () => {
    const applications = [
      makeApplication({ status: "hired", job: makeJob({ skills: ["React", "TypeScript"] }) }),
      makeApplication({ status: "interviewing", job: makeJob({ skills: ["React"] }) }),
    ];
    const result = computeLearnedPreferences(applications);
    expect(result.skillAffinity.react).toBeGreaterThan(0);
    expect(result.sampleSize).toBe(2);
  });

  it("gives negative skill affinity to skills present in rejections", () => {
    const applications = [makeApplication({ status: "rejected", job: makeJob({ skills: ["Java"] }) })];
    const result = computeLearnedPreferences(applications);
    expect(result.skillAffinity.java).toBeLessThan(0);
  });

  it("ignores applications with no outcome signal yet (saved/applied/withdrawn)", () => {
    const applications = [
      makeApplication({ status: "saved" }),
      makeApplication({ status: "applied" }),
      makeApplication({ status: "withdrawn" }),
    ];
    const result = computeLearnedPreferences(applications);
    expect(result.sampleSize).toBe(0);
  });

  it("applies a smaller negative signal for dismissed jobs' skills", () => {
    const result = computeLearnedPreferences([], [makeJob({ skills: ["Sales"] })]);
    expect(result.skillAffinity.sales).toBeLessThan(0);
  });

  it("derives remote affinity from whether positive outcomes were remote", () => {
    const applications = [
      makeApplication({ status: "hired", job: makeJob({ isRemote: true }) }),
      makeApplication({ status: "hired", job: makeJob({ isRemote: true }) }),
    ];
    const result = computeLearnedPreferences(applications);
    expect(result.remoteAffinity).toBeGreaterThan(0);
  });

  it("derives a salary sweet spot from positive-outcome jobs only", () => {
    const applications = [
      makeApplication({ status: "hired", job: makeJob({ salaryMin: 120000, salaryMax: 150000 }) }),
      makeApplication({ status: "rejected", job: makeJob({ salaryMin: 40000, salaryMax: 50000 }) }),
    ];
    const result = computeLearnedPreferences(applications);
    expect(result.salarySweetSpot).toEqual({ min: 120000, max: 150000 });
  });

  it("normalizes skill affinity values within [-1, 1]", () => {
    const applications = Array.from({ length: 5 }, () =>
      makeApplication({ status: "hired", job: makeJob({ skills: ["React"] }) }),
    );
    const result = computeLearnedPreferences(applications);
    expect(result.skillAffinity.react).toBeLessThanOrEqual(1);
    expect(result.skillAffinity.react).toBeGreaterThanOrEqual(-1);
  });
});
