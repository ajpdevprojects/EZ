import type { Application, RecruiterEmailCategory } from "@ez/types";

/**
 * Deterministic recruiter-email categorization (Software Engine). Reading
 * keywords out of a subject/body is plain string matching — no AI is
 * needed to sort an inbox into buckets (see docs/canon Product Directive:
 * Brain 1 responsibility "email categorization").
 */
const CATEGORY_RULES: Array<{ category: RecruiterEmailCategory; pattern: RegExp }> = [
  {
    category: "offer",
    pattern: /\b(offer letter|pleased to offer|formal offer|excited to offer|job offer)\b/i,
  },
  {
    category: "rejection",
    pattern: /\b(unfortunately|not moving forward|other candidates|decided to proceed with|not selected|regret to inform)\b/i,
  },
  {
    category: "interview",
    pattern: /\b(interview|panel|technical screen|onsite|schedule a call|phone screen|assessment)\b/i,
  },
  {
    category: "recruiter_outreach",
    pattern: /\b(reviewing your application|thank you for applying|talent acquisition|recruiter|opportunity|role at|hiring team)\b/i,
  },
];

/** Categorizes an email into a Recruiter Inbox bucket using deterministic keyword rules. */
export function categorizeEmail(subject: string, body: string): RecruiterEmailCategory {
  const text = `${subject}\n${body}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "other";
}

/**
 * Links an email to the most likely application by matching the sender's
 * domain or the email content against each application's company name.
 * Deterministic string matching — no AI required.
 */
export function findLikelyApplication(
  fromEmail: string,
  subject: string,
  body: string,
  applications: Application[],
): Application | null {
  const text = `${subject}\n${body}`.toLowerCase();
  const domain = fromEmail.split("@")[1]?.toLowerCase() ?? "";

  for (const application of applications) {
    const company = application.job?.company?.toLowerCase().trim();
    if (!company) continue;

    const companySlug = company.replace(/[^a-z0-9]/g, "");
    if (companySlug && domain.replace(/[^a-z0-9]/g, "").includes(companySlug)) return application;
    if (text.includes(company)) return application;
  }

  return null;
}
