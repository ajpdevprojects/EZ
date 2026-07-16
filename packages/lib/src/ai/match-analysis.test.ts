import { describe, expect, it } from "vitest";
import { parseMatchAnalysis } from "./match-analysis";

describe("parseMatchAnalysis", () => {
  it("parses a well-formed score and reason", () => {
    const result = parseMatchAnalysis("SCORE: 82\nREASON: Strong overlap in design systems experience.");
    expect(result.score).toBe(82);
    expect(result.reason).toBe("Strong overlap in design systems experience.");
  });

  it("clamps scores outside 0-100", () => {
    expect(parseMatchAnalysis("SCORE: 150\nREASON: x").score).toBe(100);
  });

  it("falls back to the raw text as the reason when unformatted", () => {
    const result = parseMatchAnalysis("This candidate looks like a strong fit overall.");
    expect(result.score).toBeNull();
    expect(result.reason).toBe("This candidate looks like a strong fit overall.");
  });

  it("captures multi-sentence reasoning after REASON:", () => {
    const result = parseMatchAnalysis("SCORE: 60\nREASON: Good skills match. However, seniority level is a stretch.");
    expect(result.reason).toBe("Good skills match. However, seniority level is a stretch.");
  });
});
