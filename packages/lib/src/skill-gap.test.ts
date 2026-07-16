import { describe, expect, it } from "vitest";
import { computeSkillGap } from "./skill-gap";

describe("computeSkillGap", () => {
  it("computes full coverage when all job skills are present", () => {
    const result = computeSkillGap(["React", "TypeScript", "Testing"], ["React", "TypeScript"]);
    expect(result.matchedSkills).toEqual(["React", "TypeScript"]);
    expect(result.missingSkills).toEqual([]);
    expect(result.coveragePercent).toBe(100);
  });

  it("identifies missing skills", () => {
    const result = computeSkillGap(["React"], ["React", "GraphQL", "Docker"]);
    expect(result.matchedSkills).toEqual(["React"]);
    expect(result.missingSkills).toEqual(["GraphQL", "Docker"]);
    expect(result.coveragePercent).toBe(33);
  });

  it("is case-insensitive when matching skills", () => {
    const result = computeSkillGap(["react", "typescript"], ["React", "TypeScript"]);
    expect(result.matchedSkills).toEqual(["React", "TypeScript"]);
  });

  it("treats a job with no listed skills as full coverage", () => {
    const result = computeSkillGap([], []);
    expect(result.coveragePercent).toBe(100);
  });

  it("returns 0 coverage when the candidate has none of the required skills", () => {
    const result = computeSkillGap([], ["Kubernetes"]);
    expect(result.coveragePercent).toBe(0);
    expect(result.missingSkills).toEqual(["Kubernetes"]);
  });
});
