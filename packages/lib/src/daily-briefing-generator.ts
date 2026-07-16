import type { NotificationType } from "@ez/types";

/**
 * Proactive Software Brain (Product Experience Directive): the platform
 * should feel like it already worked before the user opens it. This
 * module is the single source of truth for that "Good morning, I've
 * already..." summary — reused by the live Home greeting (computed on
 * every request, so it's always accurate even without a deployed cron)
 * and by the daily background job that persists the same story as a
 * notification. Entirely deterministic — no AI involved.
 */

export interface TopOpportunitySummary {
  title: string;
  company: string;
  score: number;
}

export interface DailyBriefingSummaryInput {
  greetingName: string;
  newJobsCount: number;
  topOpportunity: TopOpportunitySummary | null;
  upcomingInterviewCount: number;
  staleApplicationCount: number;
  unreadRecruiterEmailCount: number;
}

export interface DailyBriefingSummary {
  greeting: string;
  highlights: string[];
}

/** Builds the honest, deterministic "what I already did" summary. Never fabricates activity that didn't happen. */
export function buildDailyBriefingSummary(input: DailyBriefingSummaryInput): DailyBriefingSummary {
  const highlights: string[] = [];

  if (input.newJobsCount > 0) {
    highlights.push(
      `I found ${input.newJobsCount} new ${input.newJobsCount === 1 ? "opportunity" : "opportunities"} since yesterday.`,
    );
  }

  if (input.topOpportunity) {
    highlights.push(
      `Your top match today is ${input.topOpportunity.title} at ${input.topOpportunity.company} (${input.topOpportunity.score}% confidence).`,
    );
  }

  if (input.upcomingInterviewCount > 0) {
    highlights.push(
      `You have ${input.upcomingInterviewCount} ${input.upcomingInterviewCount === 1 ? "interview" : "interviews"} coming up.`,
    );
  }

  if (input.staleApplicationCount > 0) {
    highlights.push(
      `${input.staleApplicationCount} ${input.staleApplicationCount === 1 ? "application hasn't" : "applications haven't"} moved in a while — a follow-up could help.`,
    );
  }

  if (input.unreadRecruiterEmailCount > 0) {
    highlights.push(
      `${input.unreadRecruiterEmailCount} recruiter ${input.unreadRecruiterEmailCount === 1 ? "reply is" : "replies are"} waiting in your inbox.`,
    );
  }

  if (highlights.length === 0) {
    highlights.push("Everything is quiet right now — check back soon for new opportunities.");
  }

  return {
    greeting: `Good morning, ${input.greetingName}.`,
    highlights,
  };
}

export interface PlannedNotification {
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
}

export interface NewOpportunityInput {
  jobId: string;
  title: string;
  company: string;
  score: number;
}

export interface ResumePerformanceAlertInput {
  resumeId: string;
  resumeTitle: string;
  interviewRate: number;
  applications: number;
}

export interface DailyNotificationPlanInput extends DailyBriefingSummaryInput {
  newHighConfidenceJobs: NewOpportunityInput[];
  resumePerformanceAlerts: ResumePerformanceAlertInput[];
}

const MAX_NEW_OPPORTUNITY_NOTIFICATIONS = 2;

/**
 * Plans the notifications a day's background run should create for one
 * user. Pure function — the caller is responsible for persistence and
 * for deduping against notifications already sent (e.g. don't renotify
 * the same job twice, don't send more than one daily briefing per day).
 */
export function planDailyBriefingNotifications(input: DailyNotificationPlanInput): PlannedNotification[] {
  const planned: PlannedNotification[] = [];

  for (const job of input.newHighConfidenceJobs.slice(0, MAX_NEW_OPPORTUNITY_NOTIFICATIONS)) {
    planned.push({
      type: "new_opportunity",
      title: "New opportunity found",
      body: `${job.title} at ${job.company} is a ${job.score}% match — just discovered overnight.`,
      metadata: { jobId: job.jobId },
    });
  }

  if (input.staleApplicationCount > 0) {
    planned.push({
      type: "follow_up_recommended",
      title: "Follow-up recommended",
      body: `${input.staleApplicationCount} ${input.staleApplicationCount === 1 ? "application hasn't" : "applications haven't"} moved in 2+ weeks — a quick nudge could help.`,
      metadata: { staleApplicationCount: input.staleApplicationCount },
    });
  }

  for (const alert of input.resumePerformanceAlerts) {
    planned.push({
      type: "resume_performing_well",
      title: "Your resume is performing well",
      body: `"${alert.resumeTitle}" has a ${alert.interviewRate}% interview rate across ${alert.applications} applications — keep using it.`,
      metadata: { resumeId: alert.resumeId },
    });
  }

  const summary = buildDailyBriefingSummary(input);
  planned.push({
    type: "daily_briefing",
    title: "Your daily briefing is ready",
    body: `${summary.greeting} ${summary.highlights.join(" ")}`,
    metadata: {},
  });

  return planned;
}
