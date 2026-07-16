import type { EmploymentType, SeniorityLevel } from "@ez/types";

/** Strips HTML tags and collapses whitespace so descriptions render as plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|li|br|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SENIORITY_RULES: Array<{ level: SeniorityLevel; pattern: RegExp }> = [
  { level: "executive", pattern: /\b(chief|vp|vice president|head of|director)\b/i },
  { level: "lead", pattern: /\b(lead|principal|staff)\b/i },
  { level: "senior", pattern: /\b(senior|sr\.?)\b/i },
  { level: "entry", pattern: /\b(junior|jr\.?|entry[- ]level|intern(ship)?|graduate|new grad)\b/i },
];

/** Infers a seniority level from a job title using deterministic keyword rules — no AI. */
export function inferSeniorityLevel(title: string): SeniorityLevel | null {
  for (const rule of SENIORITY_RULES) {
    if (rule.pattern.test(title)) return rule.level;
  }
  return "mid";
}

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  full_time: "full_time",
  "full-time": "full_time",
  fulltime: "full_time",
  part_time: "part_time",
  "part-time": "part_time",
  parttime: "part_time",
  contract: "contract",
  contractor: "contract",
  freelance: "contract",
  internship: "internship",
  intern: "internship",
};

/** Normalizes a source-specific employment type string into EZ's fixed enum. */
export function inferEmploymentType(raw: string | null | undefined): EmploymentType {
  if (!raw) return "full_time";
  const key = raw.trim().toLowerCase();
  return EMPLOYMENT_TYPE_MAP[key] ?? "full_time";
}

/** Parses a free-text salary string like "$70,000 - $90,000" into a min/max pair. */
export function parseSalaryRange(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };

  const numbers = raw
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?\s*k?/gi)
    ?.map((token) => {
      const isThousands = /k$/i.test(token.trim());
      const value = Number.parseFloat(token.replace(/k$/i, ""));
      return isThousands ? value * 1000 : value;
    })
    .filter((value) => Number.isFinite(value) && value > 1000);

  if (!numbers || numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

/** Extracts a de-duplicated skill list from free-form tags. */
export function normalizeSkillTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result.slice(0, 12);
}
