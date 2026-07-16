import type { IntegrationProvider } from "@ez/types";

export interface IntegrationInfo {
  provider: IntegrationProvider;
  label: string;
  description: string;
  /** The Supabase Auth OAuth provider identifier used to request access. */
  oauthProvider: "google" | "linkedin_oidc";
  /** Extra OAuth scope requested on top of the provider's default sign-in scopes. */
  oauthScope?: string;
  /**
   * True until a real sync job consumes this provider's granted access.
   * Connecting still runs the actual OAuth flow — this only controls
   * whether the UI is honest about there being no sync behind it yet.
   */
  comingSoon?: boolean;
}

/**
 * IMPORTANT: connecting an integration runs a real OAuth consent flow and
 * requests the scope below, but nothing in this codebase reads from these
 * providers yet — no Gmail/Calendar/Drive/LinkedIn API client exists. The
 * "Connected" status is a stored intent, not an active sync. Recruiter
 * Inbox is a manual paste-in today; see apps/web/features/inbox/actions.ts.
 * Keep `comingSoon: true` and the honest descriptions below until a real
 * sync job is built — do not restore promises like "automatically" or "in
 * sync" without shipping the sync itself alongside them.
 */
export const INTEGRATION_INFO: Record<IntegrationProvider, IntegrationInfo> = {
  google_gmail: {
    provider: "google_gmail",
    label: "Gmail",
    description: "Connect your inbox now so automatic recruiter-reply tracking can turn on the moment it ships.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/gmail.readonly",
    comingSoon: true,
  },
  google_calendar: {
    provider: "google_calendar",
    label: "Google Calendar",
    description: "Calendar sync for interview schedules is on the roadmap — connecting saves your place for launch.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/calendar.events",
    comingSoon: true,
  },
  google_drive: {
    provider: "google_drive",
    label: "Google Drive",
    description: "Drive storage for resumes and cover letters is on the roadmap — connecting saves your place for launch.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/drive.file",
    comingSoon: true,
  },
  linkedin: {
    provider: "linkedin",
    label: "LinkedIn",
    description: "Profile import and progress sharing are on the roadmap — connecting saves your place for launch.",
    oauthProvider: "linkedin_oidc",
    comingSoon: true,
  },
};

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "google_gmail",
  "google_calendar",
  "google_drive",
  "linkedin",
];
