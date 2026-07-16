import { describe, expect, it } from "vitest";
import { buildInterviewPrepQuestions } from "./interview-questions";

describe("buildInterviewPrepQuestions", () => {
  it("always includes behavioral and closing questions", () => {
    const sets = buildInterviewPrepQuestions([]);
    const categories = sets.map((set) => set.category);
    expect(categories).toContain("Behavioral");
    expect(categories).toContain("Questions to ask them");
  });

  it("adds a role-specific set when skills match the question bank", () => {
    const sets = buildInterviewPrepQuestions(["React", "TypeScript"]);
    const roleSpecific = sets.find((set) => set.category === "Role-specific");
    expect(roleSpecific).toBeDefined();
    expect(roleSpecific?.questions.length).toBeGreaterThan(0);
  });

  it("skips the role-specific set when no skills match", () => {
    const sets = buildInterviewPrepQuestions(["Underwater Basket Weaving"]);
    expect(sets.some((set) => set.category === "Role-specific")).toBe(false);
  });
});
