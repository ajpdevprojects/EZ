import type {
  Application,
  ApplicationStatus,
  CareerGoal,
  CoverLetter,
  EmploymentType,
  Interview,
  InterviewStatus,
  InterviewType,
  IntegrationProvider,
  IntegrationStatus,
  Job,
  JourneyMilestone,
  JourneyMilestoneType,
  JourneyTheme,
  LearningProgress,
  LearningProgressStatus,
  LearningResource,
  LearningResourceType,
  Notification,
  NotificationType,
  Profile,
  Resume,
  ResumeContent,
  ResumeTemplate,
  SeniorityLevel,
  UserIntegration,
  WorkType,
} from "@ez/types";
import { createEmptyResumeContent } from "@ez/types";
import type { Database } from "./supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type MilestoneRow = Database["public"]["Tables"]["journey_milestones"]["Row"];
type InterviewRow = Database["public"]["Tables"]["interviews"]["Row"];
type ResumeRow = Database["public"]["Tables"]["resumes"]["Row"];
type CoverLetterRow = Database["public"]["Tables"]["cover_letters"]["Row"];
type LearningResourceRow = Database["public"]["Tables"]["learning_resources"]["Row"];
type LearningProgressRow = Database["public"]["Tables"]["learning_progress"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type UserIntegrationRow = Database["public"]["Tables"]["user_integrations"]["Row"];

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    careerGoals: row.career_goals as CareerGoal[],
    currentRole: row.current_role,
    preferredLocations: row.preferred_locations,
    workTypes: row.work_types as WorkType[],
    priorities: row.priorities,
    journeyTheme: row.journey_theme as JourneyTheme,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    isRemote: row.is_remote,
    employmentType: row.employment_type as EmploymentType,
    seniorityLevel: row.seniority_level as SeniorityLevel | null,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    description: row.description,
    skills: row.skills,
    applyUrl: row.apply_url,
    postedAt: row.posted_at,
    createdAt: row.created_at,
  };
}

export function mapApplication(row: ApplicationRow, job?: JobRow): Application {
  return {
    id: row.id,
    userId: row.user_id,
    jobId: row.job_id,
    status: row.status as ApplicationStatus,
    matchScore: row.match_score,
    matchReason: row.match_reason,
    appliedAt: row.applied_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    job: job ? mapJob(job) : undefined,
  };
}

export function mapJourneyMilestone(row: MilestoneRow): JourneyMilestone {
  return {
    id: row.id,
    applicationId: row.application_id,
    type: row.type as JourneyMilestoneType,
    occurredAt: row.occurred_at,
    metadata: row.metadata,
  };
}

export function mapInterview(
  row: InterviewRow,
  application?: ApplicationRow,
  job?: JobRow,
): Interview {
  return {
    id: row.id,
    applicationId: row.application_id,
    userId: row.user_id,
    interviewType: row.interview_type as InterviewType,
    status: row.status as InterviewStatus,
    scheduledAt: row.scheduled_at,
    locationOrLink: row.location_or_link,
    notes: row.notes,
    createdAt: row.created_at,
    application: application ? mapApplication(application, job) : undefined,
  };
}

export function mapResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    isPrimary: row.is_primary,
    template: row.template as ResumeTemplate,
    content: { ...createEmptyResumeContent(), ...(row.content as Partial<ResumeContent>) },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCoverLetter(row: CoverLetterRow, application?: ApplicationRow, job?: JobRow): CoverLetter {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    application: application ? mapApplication(application, job) : undefined,
  };
}

export function mapLearningResource(row: LearningResourceRow): LearningResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    resourceType: row.resource_type as LearningResourceType,
    skillTags: row.skill_tags,
    url: row.url,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
  };
}

export function mapLearningProgress(row: LearningProgressRow): LearningProgress {
  return {
    id: row.id,
    userId: row.user_id,
    resourceId: row.resource_id,
    status: row.status as LearningProgressStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export function mapUserIntegration(row: UserIntegrationRow): UserIntegration {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider as IntegrationProvider,
    status: row.status as IntegrationStatus,
    connectedAt: row.connected_at,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
