import type { Application } from "@ez/types";

/**
 * "Is my job search strategy improving?" (Product Intelligence
 * Directive: Hiring Momentum). Deterministic comparison of the current
 * 30-day window against the prior 30-day window — no AI. Every number
 * comes directly from the user's own application history; when there
 * isn't enough history to compare honestly, the module says so rather
 * than manufacturing a trend.
 */
const RESPONSE_STATUSES = new Set(["interviewing", "offer", "hired", "rejected"]);
const INTERVIEW_OR_BETTER_STATUSES = new Set(["interviewing", "offer", "hired"]);
const MIN_SAMPLE_SIZE = 3;
const NOISE_THRESHOLD_POINTS = 5;

export interface HiringMomentumWindow {
  applications: number;
  interviewRate: number;
  responseRate: number;
}

export interface HiringMomentum {
  current: HiringMomentumWindow;
  previous: HiringMomentumWindow;
  interviewRateDelta: number;
  responseRateDelta: number;
  volumeDelta: number;
  hasEnoughData: boolean;
}

function summarizeWindow(applications: Application[]): HiringMomentumWindow {
  const total = applications.length;
  if (total === 0) return { applications: 0, interviewRate: 0, responseRate: 0 };

  const interviews = applications.filter((application) => INTERVIEW_OR_BETTER_STATUSES.has(application.status)).length;
  const responses = applications.filter((application) => RESPONSE_STATUSES.has(application.status)).length;

  return {
    applications: total,
    interviewRate: Math.round((interviews / total) * 100),
    responseRate: Math.round((responses / total) * 100),
  };
}

export function computeHiringMomentum(
  applications: Application[],
  now: Date = new Date(),
  windowDays = 30,
): HiringMomentum {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const currentStart = now.getTime() - windowMs;
  const previousStart = now.getTime() - windowMs * 2;

  const currentWindow = applications.filter((application) => {
    const createdAt = new Date(application.createdAt).getTime();
    return createdAt >= currentStart && createdAt <= now.getTime();
  });
  const previousWindow = applications.filter((application) => {
    const createdAt = new Date(application.createdAt).getTime();
    return createdAt >= previousStart && createdAt < currentStart;
  });

  const current = summarizeWindow(currentWindow);
  const previous = summarizeWindow(previousWindow);

  return {
    current,
    previous,
    interviewRateDelta: current.interviewRate - previous.interviewRate,
    responseRateDelta: current.responseRate - previous.responseRate,
    volumeDelta: current.applications - previous.applications,
    hasEnoughData: previousWindow.length >= MIN_SAMPLE_SIZE && currentWindow.length >= MIN_SAMPLE_SIZE,
  };
}

/** Turns momentum numbers into honest sentences — silent on noise, never manufactures a trend. */
export function describeHiringMomentum(momentum: HiringMomentum): string[] {
  if (!momentum.hasEnoughData) {
    return ["Not enough application history yet to measure momentum — keep applying and check back."];
  }

  const lines: string[] = [];

  if (Math.abs(momentum.interviewRateDelta) >= NOISE_THRESHOLD_POINTS) {
    const direction = momentum.interviewRateDelta > 0 ? "up" : "down";
    lines.push(
      `Your interview rate is ${direction} ${Math.abs(momentum.interviewRateDelta)} percentage points vs. last month.`,
    );
  }

  if (Math.abs(momentum.responseRateDelta) >= NOISE_THRESHOLD_POINTS) {
    const direction = momentum.responseRateDelta > 0 ? "up" : "down";
    lines.push(
      `Recruiter response rate is ${direction} ${Math.abs(momentum.responseRateDelta)} percentage points vs. last month.`,
    );
  }

  if (Math.abs(momentum.volumeDelta) >= MIN_SAMPLE_SIZE) {
    const direction = momentum.volumeDelta > 0 ? "more" : "fewer";
    lines.push(`You submitted ${Math.abs(momentum.volumeDelta)} ${direction} applications than last month.`);
  }

  if (lines.length === 0) {
    lines.push("Your job search metrics are holding steady compared to last month.");
  }

  return lines;
}
