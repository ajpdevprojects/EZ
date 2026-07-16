import { describe, expect, it } from "vitest";
import { computeResumePerformance } from "./resume-performance";
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
    updatedAt: "",
    ...overrides,
  };
}

describe("computeResumePerformance", () => {
  it("ignores applications with no resume attached", () => {
    const result = computeResumePerformance([makeApplication({ resumeId: null })]);
    expect(result).toEqual({});
  });

  it("counts applications, interviews, and offers per resume", () => {
    const applications = [
      makeApplication({ id: "a", resumeId: "resume-1", status: "applied" }),
      makeApplication({ id: "b", resumeId: "resume-1", status: "interviewing" }),
      makeApplication({ id: "c", resumeId: "resume-1", status: "offer" }),
    ];
    const result = computeResumePerformance(applications);
    expect(result["resume-1"]).toEqual({ applications: 3, interviews: 2, offers: 1, interviewRate: 67 });
  });

  it("treats hired as both an interview and an offer outcome", () => {
    const result = computeResumePerformance([makeApplication({ resumeId: "resume-1", status: "hired" })]);
    expect(result["resume-1"]).toMatchObject({ interviews: 1, offers: 1 });
  });

  it("tracks multiple resumes independently", () => {
    const applications = [
      makeApplication({ id: "a", resumeId: "resume-1", status: "rejected" }),
      makeApplication({ id: "b", resumeId: "resume-2", status: "interviewing" }),
    ];
    const result = computeResumePerformance(applications);
    expect(result["resume-1"].interviewRate).toBe(0);
    expect(result["resume-2"].interviewRate).toBe(100);
  });
});
