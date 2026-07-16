import { describe, expect, it } from "vitest";
import { coverLetterSchema } from "./cover-letter";

describe("coverLetterSchema", () => {
  it("accepts a valid cover letter", () => {
    const result = coverLetterSchema.safeParse({
      title: "Acme Inc. — Product Designer",
      content: "Dear hiring team...",
      applicationId: "app-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = coverLetterSchema.safeParse({ title: "", content: "Dear hiring team...", applicationId: null });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = coverLetterSchema.safeParse({ title: "Draft", content: "   ", applicationId: null });
    expect(result.success).toBe(false);
  });
});
