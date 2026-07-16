import { describe, expect, it } from "vitest";
import { rankJobsForProfile, scoreJobForProfile } from "./job-matching";
import type { Job, Profile } from "@ez/types";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Senior Frontend Engineer",
    company: "Acme",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "senior",
    salaryMin: null,
    salaryMax: null,
    description: "",
    skills: ["React", "TypeScript", "Next.js"],
    applyUrl: null,
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    email: "user@example.com",
    fullName: "Alex Morgan",
    avatarUrl: null,
    careerGoals: ["find_new_job"],
    currentRole: "Frontend Engineer",
    preferredLocations: ["Remote"],
    workTypes: ["full_time"],
    priorities: [],
    journeyTheme: "executive",
    onboardingCompletedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("scoreJobForProfile", () => {
  it("scores highly when skills, work type, location, and role all align", () => {
    const job = makeJob();
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, ["React", "TypeScript", "Next.js"]);

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.matchedSkills).toEqual(["React", "TypeScript", "Next.js"]);
    expect(result.missingSkills).toEqual([]);
  });

  it("reports missing skills the candidate does not have", () => {
    const job = makeJob({ skills: ["React", "GraphQL"] });
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, ["React"]);

    expect(result.matchedSkills).toEqual(["React"]);
    expect(result.missingSkills).toEqual(["GraphQL"]);
  });

  it("scores lower when remote preference does not match an on-site job", () => {
    const job = makeJob({ isRemote: false, location: "Tokyo" });
    const profile = makeProfile({ preferredLocations: ["Remote"] });
    const remoteResult = scoreJobForProfile(makeJob(), profile, ["React"]);
    const onSiteResult = scoreJobForProfile(job, profile, ["React"]);

    expect(onSiteResult.score).toBeLessThan(remoteResult.score);
  });

  it("is skill-agnostic (neutral score) when a job lists no skills", () => {
    const job = makeJob({ skills: [] });
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, []);

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedSkills).toEqual([]);
  });

  it("stays within 0-100 bounds", () => {
    const job = makeJob();
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, ["React", "TypeScript", "Next.js", "Extra"]);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("rankJobsForProfile", () => {
  it("sorts strongest matches first", () => {
    const strongMatch = makeJob({ id: "job-strong", skills: ["React", "TypeScript"] });
    const weakMatch = makeJob({ id: "job-weak", skills: ["Rust", "Kubernetes"] });
    const profile = makeProfile();

    const ranked = rankJobsForProfile([weakMatch, strongMatch], profile, ["React", "TypeScript"]);

    expect(ranked[0].job.id).toBe("job-strong");
    expect(ranked[0].match.score).toBeGreaterThan(ranked[1].match.score);
  });

  it("breaks ties by most recently posted", () => {
    const older = makeJob({ id: "job-older", skills: [], postedAt: new Date(Date.now() - 100000).toISOString() });
    const newer = makeJob({ id: "job-newer", skills: [], postedAt: new Date().toISOString() });
    const profile = makeProfile({ preferredLocations: [], workTypes: [] });

    const ranked = rankJobsForProfile([older, newer], profile, []);
    expect(ranked[0].job.id).toBe("job-newer");
  });
});
