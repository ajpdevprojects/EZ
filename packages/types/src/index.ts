export type JourneyTheme = "executive" | "minimal" | "ambient" | "nature" | "silent";

export type CareerGoal =
  | "find_new_job"
  | "grow_career"
  | "switch_industries"
  | "get_career_guidance"
  | "other";

export type WorkType = "full_time" | "part_time" | "contract" | "internship";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  careerGoals: CareerGoal[];
  currentRole: string | null;
  preferredLocations: string[];
  workTypes: WorkType[];
  priorities: string[];
  journeyTheme: JourneyTheme;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type SeniorityLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export type JobSource = "internal" | "remoteok" | "remotive";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  skills: string[];
  applyUrl: string | null;
  postedAt: string;
  createdAt: string;
  source: JobSource;
  isActive: boolean;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  matchReason: string | null;
  appliedAt: string | null;
  notes: string | null;
  resumeId: string | null;
  createdAt: string;
  updatedAt: string;
  job?: Job;
}

export type JourneyMilestoneType =
  | "journey_started"
  | "resume_completed"
  | "application_submitted"
  | "recruiter_viewed"
  | "recruiter_replied"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_received"
  | "offer_accepted"
  | "journey_completed";

export interface JourneyMilestone {
  id: string;
  applicationId: string;
  type: JourneyMilestoneType;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export type InterviewType = "phone" | "video" | "onsite" | "technical";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export interface Interview {
  id: string;
  applicationId: string;
  userId: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  locationOrLink: string | null;
  notes: string | null;
  createdAt: string;
  application?: Application;
}

export type AiConversationContext =
  | "general"
  | "resume"
  | "cover_letter"
  | "interview_prep"
  | "career_coaching";

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  context: AiConversationContext;
  createdAt: string;
  updatedAt: string;
}

export type AiMessageRole = "user" | "assistant" | "system";

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface JobMatchSummary {
  score: number;
  reasons: string[];
}

export interface DailyPriorityItem {
  id: string;
  label: string;
  description: string;
  href: string;
  urgent: boolean;
}

export interface UpcomingInterviewSummary {
  id: string;
  jobTitle: string;
  company: string;
  scheduledAt: string;
}

export interface DailyBriefing {
  greetingName: string;
  applicationsInProgress: number;
  interviewsUpcoming: number;
  recommendedJobs: Job[];
  recommendedMatches: Record<string, JobMatchSummary>;
  dailyPriorities: DailyPriorityItem[];
  unreadRecruiterEmailCount: number;
  upcomingInterviews: UpcomingInterviewSummary[];
  newOpportunitiesCount: number;
  staleApplicationCount: number;
}

// ---------------------------------------------------------------------
// Resume System
// ---------------------------------------------------------------------

export interface ResumeExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  highlights: string[];
}

export interface ResumeEducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
}

export interface ResumeContact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export interface ResumeContent {
  contact: ResumeContact;
  summary: string;
  experience: ResumeExperienceEntry[];
  education: ResumeEducationEntry[];
  skills: string[];
}

export type ResumeTemplate = "classic" | "modern" | "minimal";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  isPrimary: boolean;
  template: ResumeTemplate;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

export function createEmptyResumeContent(): ResumeContent {
  return {
    contact: { fullName: "", email: "", phone: "", location: "", linkedinUrl: "", portfolioUrl: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
  };
}

// ---------------------------------------------------------------------
// Documents Center
// ---------------------------------------------------------------------

export interface CoverLetter {
  id: string;
  userId: string;
  applicationId: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  application?: Application;
}

// ---------------------------------------------------------------------
// Learning Hub
// ---------------------------------------------------------------------

export type LearningResourceType = "article" | "video" | "course";
export type LearningProgressStatus = "not_started" | "in_progress" | "completed";

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  resourceType: LearningResourceType;
  skillTags: string[];
  url: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  resourceId: string;
  status: LearningProgressStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------

export type NotificationType =
  | "daily_briefing"
  | "new_opportunity"
  | "recruiter_replied"
  | "interview_scheduled"
  | "interview_reminder"
  | "offer_received"
  | "journey_completed"
  | "follow_up_recommended"
  | "resume_performing_well";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------

export type IntegrationProvider = "google_gmail" | "google_calendar" | "google_drive" | "linkedin";
export type IntegrationStatus = "connected" | "disconnected";

export interface UserIntegration {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  connectedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Recruiter Inbox (Gmail substitute)
// ---------------------------------------------------------------------

export type RecruiterEmailSource = "manual" | "gmail";
export type RecruiterEmailCategory = "recruiter_outreach" | "interview" | "rejection" | "offer" | "other";

export interface RecruiterEmail {
  id: string;
  userId: string;
  applicationId: string | null;
  source: RecruiterEmailSource;
  gmailMessageId: string | null;
  fromName: string | null;
  fromEmail: string;
  subject: string;
  body: string;
  category: RecruiterEmailCategory;
  receivedAt: string;
  readAt: string | null;
  draftReply: string | null;
  createdAt: string;
  application?: Application;
}
