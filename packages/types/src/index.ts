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
}

export type AiConversationContext =
  | "general"
  | "resume"
  | "cover_letter"
  | "interview_prep";

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

export interface DailyBriefing {
  greetingName: string;
  applicationsInProgress: number;
  interviewsUpcoming: number;
  recommendedJobs: Job[];
  nextAction: string | null;
}
