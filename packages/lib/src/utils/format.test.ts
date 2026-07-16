import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatSalaryRange } from "./format";

describe("formatSalaryRange", () => {
  it("returns null when no salary is provided", () => {
    expect(formatSalaryRange(null, null)).toBeNull();
  });

  it("formats a full range", () => {
    expect(formatSalaryRange(95000, 125000)).toBe("$95,000 – $125,000");
  });

  it("formats a single bound when only one side is known", () => {
    expect(formatSalaryRange(95000, null)).toBe("$95,000");
    expect(formatSalaryRange(null, 125000)).toBe("$125,000");
  });
});

describe("formatRelativeTime", () => {
  it("describes very recent timestamps as 'just now'", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("just now");
  });

  it("describes timestamps from a few hours ago in hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("describes timestamps from a few days ago in days", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });
});
