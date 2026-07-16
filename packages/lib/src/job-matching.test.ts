import { describe, expect, it } from "vitest";
import { rankJobsForProfile, scoreJobForProfile } from "./job-matching";
import type { LearnedPreferences } from "./learning";
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
    currentJobTitle: "Frontend Engineer",
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

const FACTOR_BUDGET_BEHAVIORAL = 15;

describe("scoreJobForProfile", () => {
  it("scores highly when skills, work type, location, and role all align", () => {
    const job = makeJob();
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, ["React", "TypeScript", "Next.js"]);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.confidenceLabel).toBe("Strong match");
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

  it("returns a transparent factor breakdown that sums to the total score", () => {
    const job = makeJob();
    const profile = makeProfile();
    const result = scoreJobForProfile(job, profile, ["React"]);

    const total = result.factors.reduce((sum, factor) => sum + factor.points, 0);
    expect(total).toBe(result.score);
    expect(result.factors.map((factor) => factor.key)).toEqual([
      "skills",
      "workType",
      "location",
      "role",
      "behavioral",
    ]);
  });

  it("reports a neutral behavioral factor with no history", () => {
    const result = scoreJobForProfile(makeJob(), makeProfile(), ["React"]);
    const behavioral = result.factors.find((factor) => factor.key === "behavioral");
    expect(behavioral?.points).toBe(0);
    expect(behavioral?.detail).toMatch(/not enough application history/i);
  });

  it("boosts the behavioral factor when learned preferences favor the job's skills", () => {
    const learned: LearnedPreferences = {
      skillAffinity: { react: 1, typescript: 1, "next.js": 1 },
      workTypeAffinity: { full_time: 1 },
      remoteAffinity: 1,
      salarySweetSpot: null,
      sampleSize: 5,
    };
    const withHistory = scoreJobForProfile(makeJob(), makeProfile(), ["React"], learned);
    const withoutHistory = scoreJobForProfile(makeJob(), makeProfile(), ["React"]);

    const behavioralWith = withHistory.factors.find((factor) => factor.key === "behavioral");
    const behavioralWithout = withoutHistory.factors.find((factor) => factor.key === "behavioral");
    expect(behavioralWith!.points).toBeGreaterThan(behavioralWithout!.points);
  });

  it("lowers the behavioral factor when learned preferences disfavor the job's skills", () => {
    const learned: LearnedPreferences = {
      skillAffinity: { react: -1, typescript: -1, "next.js": -1 },
      workTypeAffinity: {},
      remoteAffinity: 0,
      salarySweetSpot: null,
      sampleSize: 3,
    };
    const result = scoreJobForProfile(makeJob(), makeProfile(), ["React"], learned);
    const behavioral = result.factors.find((factor) => factor.key === "behavioral");
    expect(behavioral!.points).toBeLessThan(FACTOR_BUDGET_BEHAVIORAL / 2);
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
