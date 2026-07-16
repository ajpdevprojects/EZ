import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./onboarding";

const validPayload = {
  careerGoals: ["find_new_job"],
  currentRole: "Product Designer",
  details: "",
  preferredLocations: ["Remote"],
  workTypes: ["full_time"],
  priorities: ["career_growth"],
};

describe("onboardingSchema", () => {
  it("accepts a fully completed onboarding payload", () => {
    expect(onboardingSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a payload missing career goals", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, careerGoals: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a payload with a blank current role", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, currentRole: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing preferred locations", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, preferredLocations: [] });
    expect(result.success).toBe(false);
  });
});
