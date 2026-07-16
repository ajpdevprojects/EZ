import { describe, expect, it } from "vitest";
import { dedupeNormalizedJobs } from "./dedupe";
import type { NormalizedJob } from "./types";

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    title: "Frontend Engineer",
    company: "Acme",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "mid",
    salaryMin: null,
    salaryMax: null,
    description: "",
    skills: [],
    applyUrl: null,
    postedAt: new Date().toISOString(),
    source: "remoteok",
    sourceId: "1",
    ...overrides,
  };
}

describe("dedupeNormalizedJobs", () => {
  it("removes exact source/sourceId duplicates", () => {
    const jobs = [makeJob(), makeJob()];
    expect(dedupeNormalizedJobs(jobs)).toHaveLength(1);
  });

  it("removes the same job posted under different source ids on the same source", () => {
    const jobs = [makeJob({ sourceId: "1" }), makeJob({ sourceId: "2" })];
    expect(dedupeNormalizedJobs(jobs)).toHaveLength(1);
  });

  it("removes the same job cross-posted on a different source", () => {
    const jobs = [
      makeJob({ source: "remoteok", sourceId: "1" }),
      makeJob({ source: "remotive", sourceId: "99" }),
    ];
    expect(dedupeNormalizedJobs(jobs)).toHaveLength(1);
  });

  it("keeps distinct jobs", () => {
    const jobs = [makeJob({ sourceId: "1" }), makeJob({ sourceId: "2", title: "Backend Engineer" })];
    expect(dedupeNormalizedJobs(jobs)).toHaveLength(2);
  });
});
