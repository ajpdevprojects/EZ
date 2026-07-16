import type { IntegrationProvider } from "@ez/types";

export interface IntegrationInfo {
  provider: IntegrationProvider;
  label: string;
  description: string;
  /** The Supabase Auth OAuth provider identifier used to request access. */
  oauthProvider: "google" | "linkedin_oidc";
  /** Extra OAuth scope requested on top of the provider's default sign-in scopes. */
  oauthScope?: string;
}

export const INTEGRATION_INFO: Record<IntegrationProvider, IntegrationInfo> = {
  google_gmail: {
    provider: "google_gmail",
    label: "Gmail",
    description: "Track recruiter replies automatically as they arrive in your inbox.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/gmail.readonly",
  },
  google_calendar: {
    provider: "google_calendar",
    label: "Google Calendar",
    description: "Keep interview schedules in sync with your calendar.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/calendar.events",
  },
  google_drive: {
    provider: "google_drive",
    label: "Google Drive",
    description: "Store and access your resumes and cover letters from Drive.",
    oauthProvider: "google",
    oauthScope: "https://www.googleapis.com/auth/drive.file",
  },
  linkedin: {
    provider: "linkedin",
    label: "LinkedIn",
    description: "Import your profile details and share your job search progress.",
    oauthProvider: "linkedin_oidc",
  },
};

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "google_gmail",
  "google_calendar",
  "google_drive",
  "linkedin",
];
