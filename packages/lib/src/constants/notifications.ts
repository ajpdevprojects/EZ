import type { NotificationType } from "@ez/types";

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  daily_briefing: "Daily briefing",
  new_opportunity: "New opportunity",
  recruiter_replied: "Recruiter replied",
  interview_scheduled: "Interview scheduled",
  interview_reminder: "Interview reminder",
  offer_received: "Offer received",
  journey_completed: "Journey completed",
};
