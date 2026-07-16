import { describe, expect, it } from "vitest";
import { categorizeEmail, findLikelyApplication } from "./email-categorization";
import type { Application } from "@ez/types";

describe("categorizeEmail", () => {
  it("detects offers", () => {
    expect(categorizeEmail("Offer letter attached", "We are pleased to offer you the role")).toBe("offer");
  });

  it("detects rejections", () => {
    expect(categorizeEmail("Update on your application", "Unfortunately we have decided to proceed with other candidates")).toBe(
      "rejection",
    );
  });

  it("detects interview scheduling", () => {
    expect(categorizeEmail("Interview confirmation", "Let's schedule a call for your technical screen")).toBe(
      "interview",
    );
  });

  it("detects general recruiter outreach", () => {
    expect(categorizeEmail("Thanks for applying", "Thank you for applying, our talent acquisition team is reviewing your application")).toBe(
      "recruiter_outreach",
    );
  });

  it("falls back to other when nothing matches", () => {
    expect(categorizeEmail("Newsletter", "Here's our monthly update")).toBe("other");
  });

  it("prioritizes offer over interview when both keywords appear", () => {
    expect(categorizeEmail("Interview went great — offer letter attached", "We are pleased to offer you the role")).toBe(
      "offer",
    );
  });
});

describe("findLikelyApplication", () => {
  const applications: Application[] = [
    {
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
      job: {
        id: "job-1",
        title: "Product Designer",
        company: "Acme Inc.",
        location: null,
        isRemote: true,
        employmentType: "full_time",
        seniorityLevel: null,
        salaryMin: null,
        salaryMax: null,
        description: "",
        skills: [],
        applyUrl: null,
        postedAt: "",
        createdAt: "",
        source: "internal",
        isActive: true,
      },
    },
  ];

  it("matches by sender domain", () => {
    const result = findLikelyApplication("jordan@acmeinc.example.com", "Update", "Body text", applications);
    expect(result?.id).toBe("app-1");
  });

  it("matches by company name mentioned in the body", () => {
    const result = findLikelyApplication("someone@genericmail.com", "Update", "Thanks for applying to Acme Inc.", applications);
    expect(result?.id).toBe("app-1");
  });

  it("returns null when nothing matches", () => {
    const result = findLikelyApplication("someone@other.com", "Subject", "No company mentioned", applications);
    expect(result).toBeNull();
  });
});
