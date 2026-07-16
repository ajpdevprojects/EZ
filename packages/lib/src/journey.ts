import type { ApplicationStatus, JourneyMilestone, JourneyMilestoneType } from "@ez/types";

/** Canonical order of a career journey, per the Experience Canon's Journey Archive. */
export const JOURNEY_MILESTONE_ORDER: JourneyMilestoneType[] = [
  "journey_started",
  "resume_completed",
  "application_submitted",
  "recruiter_viewed",
  "recruiter_replied",
  "interview_scheduled",
  "interview_completed",
  "offer_received",
  "offer_accepted",
  "journey_completed",
];

export const JOURNEY_MILESTONE_LABEL: Record<JourneyMilestoneType, string> = {
  journey_started: "Journey started",
  resume_completed: "Resume completed",
  application_submitted: "Application submitted",
  recruiter_viewed: "Recruiter viewed",
  recruiter_replied: "Recruiter replied",
  interview_scheduled: "Interview scheduled",
  interview_completed: "Interview completed",
  offer_received: "Offer received",
  offer_accepted: "Offer accepted",
  journey_completed: "Journey completed",
};

export function sortJourneyMilestones(milestones: JourneyMilestone[]): JourneyMilestone[] {
  return [...milestones].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

/**
 * Maps an application status transition to the journey milestones it
 * represents, so every status change automatically extends the Journey
 * Archive timeline (Experience Canon) without callers re-deriving this
 * mapping themselves.
 */
export function getMilestonesForStatusChange(status: ApplicationStatus): JourneyMilestoneType[] {
  switch (status) {
    case "applied":
      return ["application_submitted"];
    case "interviewing":
      return ["interview_scheduled"];
    case "offer":
      return ["offer_received"];
    case "hired":
      return ["offer_accepted", "journey_completed"];
    case "rejected":
    case "withdrawn":
      return ["journey_completed"];
    case "saved":
    default:
      return [];
  }
}

export function formatJourneyDuration(startIso: string, endIso: string): string {
  const days = Math.max(
    0,
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;

  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}
