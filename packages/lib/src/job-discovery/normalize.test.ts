import { describe, expect, it } from "vitest";
import {
  inferEmploymentType,
  inferSeniorityLevel,
  normalizeSkillTags,
  parseSalaryRange,
  stripHtml,
} from "./normalize";

describe("stripHtml", () => {
  it("removes tags and decodes common entities", () => {
    expect(stripHtml("<p>Hello &amp; welcome</p>")).toBe("Hello & welcome");
  });

  it("converts block-level closing tags into line breaks", () => {
    const result = stripHtml("<p>First</p><p>Second</p>");
    expect(result).toBe("First\nSecond");
  });

  it("strips script and style contents entirely", () => {
    const result = stripHtml("<style>.a{color:red}</style><p>Body</p><script>alert(1)</script>");
    expect(result).toBe("Body");
  });
});

describe("inferSeniorityLevel", () => {
  it("detects senior titles", () => {
    expect(inferSeniorityLevel("Senior Backend Engineer")).toBe("senior");
  });

  it("detects lead/principal titles", () => {
    expect(inferSeniorityLevel("Principal Engineer")).toBe("lead");
  });

  it("detects executive titles", () => {
    expect(inferSeniorityLevel("VP of Engineering")).toBe("executive");
  });

  it("detects entry-level titles", () => {
    expect(inferSeniorityLevel("Junior Developer")).toBe("entry");
  });

  it("defaults to mid when no keyword matches", () => {
    expect(inferSeniorityLevel("Backend Engineer")).toBe("mid");
  });
});

describe("inferEmploymentType", () => {
  it("maps known variants to the fixed enum", () => {
    expect(inferEmploymentType("full-time")).toBe("full_time");
    expect(inferEmploymentType("Contractor")).toBe("contract");
    expect(inferEmploymentType("internship")).toBe("internship");
  });

  it("defaults to full_time for unknown or missing values", () => {
    expect(inferEmploymentType(null)).toBe("full_time");
    expect(inferEmploymentType("something-else")).toBe("full_time");
  });
});

describe("parseSalaryRange", () => {
  it("parses a min-max range", () => {
    expect(parseSalaryRange("$70,000 - $90,000")).toEqual({ min: 70000, max: 90000 });
  });

  it("parses shorthand k values", () => {
    expect(parseSalaryRange("$70k - $90k")).toEqual({ min: 70000, max: 90000 });
  });

  it("returns nulls when no salary is present", () => {
    expect(parseSalaryRange(null)).toEqual({ min: null, max: null });
    expect(parseSalaryRange("Competitive")).toEqual({ min: null, max: null });
  });
});

describe("normalizeSkillTags", () => {
  it("de-duplicates case-insensitively and trims", () => {
    expect(normalizeSkillTags([" React ", "react", "TypeScript"])).toEqual(["React", "TypeScript"]);
  });

  it("caps the list at 12 entries", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `skill-${i}`);
    expect(normalizeSkillTags(tags)).toHaveLength(12);
  });
});
