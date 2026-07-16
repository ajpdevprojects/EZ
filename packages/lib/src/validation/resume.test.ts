import { createEmptyResumeContent } from "@ez/types";
import { describe, expect, it } from "vitest";
import { resumeContentSchema } from "./resume";

describe("resumeContentSchema", () => {
  it("rejects a resume with no contact name yet", () => {
    expect(resumeContentSchema.safeParse(createEmptyResumeContent()).success).toBe(false);
  });

  it("accepts a resume with just a contact name and nothing else", () => {
    const content = createEmptyResumeContent();
    content.contact.fullName = "Alex Morgan";
    expect(resumeContentSchema.safeParse(content).success).toBe(true);
  });

  it("rejects an experience entry missing a title", () => {
    const content = createEmptyResumeContent();
    content.experience.push({
      id: "1",
      title: "",
      company: "Acme",
      location: "Remote",
      startDate: "2022-01",
      endDate: null,
      highlights: [],
    });
    expect(resumeContentSchema.safeParse(content).success).toBe(false);
  });

  it("accepts a fully populated resume", () => {
    const content = createEmptyResumeContent();
    content.contact.fullName = "Alex Morgan";
    content.experience.push({
      id: "1",
      title: "Product Designer",
      company: "Acme",
      location: "Remote",
      startDate: "2022-01",
      endDate: null,
      highlights: ["Shipped a new onboarding flow"],
    });
    expect(resumeContentSchema.safeParse(content).success).toBe(true);
  });
});
