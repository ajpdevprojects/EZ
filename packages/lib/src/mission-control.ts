import type { Application } from "@ez/types";

/**
 * Mission Control (Product Evolution Directive): the Home dashboard
 * should answer "what should I work on today?" instead of showing
 * disconnected widgets. Everything here is deterministic Software Brain
 * logic — no AI involved.
 */

const STALE_APPLICATION_THRESHOLD_DAYS = 14;
const ACTIVE_STATUSES = new Set(["applied", "interviewing"]);

/** Applications that have gone quiet — no status change in a while — and likely need a follow-up. */
export function getStaleApplications(
  applications: Application[],
  now: Date = new Date(),
  thresholdDays: number = STALE_APPLICATION_THRESHOLD_DAYS,
): Application[] {
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  return applications.filter((application) => {
    if (!ACTIVE_STATUSES.has(application.status)) return false;
    const updatedAt = new Date(application.updatedAt).getTime();
    return now.getTime() - updatedAt >= thresholdMs;
  });
}

export interface UpcomingInterviewSummary {
  id: string;
  jobTitle: string;
  company: string;
}

export interface DailyPriority {
  id: string;
  label: string;
  description: string;
  href: string;
  urgent: boolean;
}

export interface DailyPriorityInput {
  hasPrimaryResume: boolean;
  unreadRecruiterEmailCount: number;
  upcomingInterviews: UpcomingInterviewSummary[];
  staleApplicationCount: number;
  topOpportunityCount: number;
}

/** Builds today's goal-driven objectives toward the one goal that matters: landing a job. */
export function buildDailyPriorities(input: DailyPriorityInput): DailyPriority[] {
  const priorities: DailyPriority[] = [];

  if (!input.hasPrimaryResume) {
    priorities.push({
      id: "build-resume",
      label: "Build your resume",
      description: "You'll need this before applying anywhere — it only takes a few minutes.",
      href: "/resume",
      urgent: true,
    });
  }

  for (const interview of input.upcomingInterviews.slice(0, 2)) {
    priorities.push({
      id: `prep-interview-${interview.id}`,
      label: `Prepare for your interview at ${interview.company}`,
      description: `${interview.jobTitle} — coming up within 48 hours.`,
      href: `/interviews/${interview.id}`,
      urgent: true,
    });
  }

  if (input.unreadRecruiterEmailCount > 0) {
    priorities.push({
      id: "review-inbox",
      label: `Review ${input.unreadRecruiterEmailCount} recruiter ${input.unreadRecruiterEmailCount === 1 ? "reply" : "replies"}`,
      description: "A recruiter reached out — see what they said and what to do next.",
      href: "/inbox",
      urgent: false,
    });
  }

  if (input.staleApplicationCount > 0) {
    priorities.push({
      id: "follow-up",
      label: `Follow up on ${input.staleApplicationCount} ${input.staleApplicationCount === 1 ? "application" : "applications"}`,
      description: "These haven't moved in over two weeks — a nudge can help.",
      href: "/applications",
      urgent: false,
    });
  }

  if (input.topOpportunityCount > 0) {
    priorities.push({
      id: "apply-today",
      label: "Apply to today's top opportunities",
      description: `${input.topOpportunityCount} strong ${input.topOpportunityCount === 1 ? "match is" : "matches are"} waiting below.`,
      href: "/search",
      urgent: false,
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      id: "all-caught-up",
      label: "You're all caught up",
      description: "Check back later for new opportunities, or explore the Learning Hub.",
      href: "/learning",
      urgent: false,
    });
  }

  return priorities;
}
