import type {
  Application,
  CoverLetter,
  DailyBriefing,
  Interview,
  Job,
  JourneyMilestone,
  LearningProgress,
  LearningResource,
  Notification,
  Profile,
  RecruiterEmail,
  Resume,
  UserIntegration,
} from "@ez/types";
import { createEmptyResumeContent } from "@ez/types";
import { rankJobsForProfile } from "./job-matching";
import { computeLearnedPreferences } from "./learning";
import { buildDailyPriorities, getStaleApplications } from "./mission-control";

/**
 * Demo data used when Supabase has not been configured, so the product
 * experience can still be explored end to end without live credentials.
 */

export const DEMO_PROFILE: Profile = {
  id: "demo-user",
  email: "you@example.com",
  fullName: "Alex Morgan",
  avatarUrl: null,
  careerGoals: ["find_new_job"],
  currentJobTitle: "Product Designer",
  preferredLocations: ["Remote"],
  workTypes: ["full_time"],
  priorities: ["career_growth", "work_life_balance"],
  journeyTheme: "executive",
  onboardingCompletedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Product Designer",
    company: "Acme Inc.",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "mid",
    salaryMin: 95000,
    salaryMax: 125000,
    description:
      "We're looking for a product designer who is passionate about creating beautiful, meaningful experiences that solve real user problems.",
    skills: ["Figma", "UI Design", "Prototyping", "User Research"],
    applyUrl: "https://example.com/jobs/product-designer",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
  },
  {
    id: "job-2",
    title: "UI/UX Designer",
    company: "Vertex",
    location: "Hybrid",
    isRemote: false,
    employmentType: "full_time",
    seniorityLevel: "senior",
    salaryMin: 110000,
    salaryMax: 140000,
    description:
      "Lead the design of our flagship product experience, partnering closely with product and engineering.",
    skills: ["Design Systems", "Figma", "Accessibility"],
    applyUrl: "https://example.com/jobs/ui-ux-designer",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
  },
  {
    id: "job-3",
    title: "Design System Designer",
    company: "Flow Studio",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "mid",
    salaryMin: 100000,
    salaryMax: 130000,
    description: "Own and evolve our design system across web and mobile products.",
    skills: ["Design Systems", "Component Libraries", "Tokens"],
    applyUrl: "https://example.com/jobs/design-system-designer",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
  },
  {
    id: "job-4",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "senior",
    salaryMin: 140000,
    salaryMax: 175000,
    description:
      "Build fast, accessible, and delightful web interfaces used by thousands of professionals every day.",
    skills: ["TypeScript", "React", "Next.js", "Accessibility"],
    applyUrl: "https://example.com/jobs/senior-frontend-engineer",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
  },
  {
    id: "job-5",
    title: "Product Manager",
    company: "Meridian",
    location: "San Francisco, CA",
    isRemote: false,
    employmentType: "full_time",
    seniorityLevel: "senior",
    salaryMin: 150000,
    salaryMax: 190000,
    description:
      "Drive product strategy and execution for our career platform's core experience.",
    skills: ["Product Strategy", "Roadmapping", "User Research"],
    applyUrl: "https://example.com/jobs/product-manager",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    createdAt: new Date().toISOString(),
    source: "internal",
    isActive: true,
  },
];

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: "app-1",
    userId: DEMO_PROFILE.id,
    jobId: "job-1",
    status: "applied",
    matchScore: 92,
    matchReason: "Your Figma and design systems experience closely match this role.",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    notes: null,
    resumeId: "resume-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    job: DEMO_JOBS[0],
  },
  {
    id: "app-2",
    userId: DEMO_PROFILE.id,
    jobId: "job-2",
    status: "interviewing",
    matchScore: 87,
    matchReason: "Strong overlap with your design systems background.",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    notes: null,
    resumeId: "resume-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    job: DEMO_JOBS[1],
  },
  {
    id: "app-3",
    userId: DEMO_PROFILE.id,
    jobId: "job-3",
    status: "applied",
    matchScore: 81,
    matchReason: "Matches your interest in design systems work.",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    notes: null,
    resumeId: "resume-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    job: DEMO_JOBS[2],
  },
  {
    id: "app-4",
    userId: DEMO_PROFILE.id,
    jobId: "job-5",
    status: "hired",
    matchScore: 90,
    matchReason: "Your product strategy experience was a strong match.",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    notes: null,
    resumeId: "resume-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    job: DEMO_JOBS[4],
  },
];

export const DEMO_INTERVIEWS: Interview[] = [
  {
    id: "interview-1",
    applicationId: "app-2",
    userId: DEMO_PROFILE.id,
    interviewType: "video",
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    locationOrLink: "https://meet.example.com/vertex-interview",
    notes: "Panel interview with the design lead and a product manager.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    application: DEMO_APPLICATIONS[1],
  },
  {
    id: "interview-2",
    applicationId: "app-4",
    userId: DEMO_PROFILE.id,
    interviewType: "onsite",
    status: "completed",
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    locationOrLink: "Meridian HQ, San Francisco",
    notes: "Final round with the VP of Product. Went well — offer followed a week later.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    application: DEMO_APPLICATIONS[3],
  },
];

export const DEMO_JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    id: "milestone-1",
    applicationId: "app-4",
    type: "journey_started",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-2",
    applicationId: "app-4",
    type: "application_submitted",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-3",
    applicationId: "app-4",
    type: "recruiter_replied",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-4",
    applicationId: "app-4",
    type: "interview_scheduled",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-5",
    applicationId: "app-4",
    type: "interview_completed",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-6",
    applicationId: "app-4",
    type: "offer_received",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-7",
    applicationId: "app-4",
    type: "offer_accepted",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-8",
    applicationId: "app-4",
    type: "journey_completed",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-9",
    applicationId: "app-2",
    type: "journey_started",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-10",
    applicationId: "app-2",
    type: "application_submitted",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-11",
    applicationId: "app-2",
    type: "interview_scheduled",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-12",
    applicationId: "app-1",
    type: "journey_started",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-13",
    applicationId: "app-1",
    type: "application_submitted",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-14",
    applicationId: "app-3",
    type: "journey_started",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    metadata: null,
  },
  {
    id: "milestone-15",
    applicationId: "app-3",
    type: "application_submitted",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    metadata: null,
  },
];

export const DEMO_RESUMES: Resume[] = [
  {
    id: "resume-1",
    userId: DEMO_PROFILE.id,
    title: "Product Designer Resume",
    isPrimary: true,
    template: "modern",
    content: {
      contact: {
        fullName: "Alex Morgan",
        email: "you@example.com",
        phone: "(555) 010-2020",
        location: "Remote",
        linkedinUrl: "https://linkedin.com/in/alexmorgan",
        portfolioUrl: "https://alexmorgan.design",
      },
      summary:
        "Product designer with 6 years of experience shipping design systems and user-centered products for high-growth teams.",
      experience: [
        {
          id: "exp-1",
          title: "Senior Product Designer",
          company: "Flow Studio",
          location: "Remote",
          startDate: "2022-01",
          endDate: null,
          highlights: [
            "Led the redesign of the core design system, reducing engineering handoff time by 40%.",
            "Partnered with product and engineering to ship 12 major features in 18 months.",
          ],
        },
        {
          id: "exp-2",
          title: "Product Designer",
          company: "Northwind Labs",
          location: "Remote",
          startDate: "2019-03",
          endDate: "2021-12",
          highlights: [
            "Designed and shipped the onboarding flow that improved activation by 25%.",
          ],
        },
      ],
      education: [
        {
          id: "edu-1",
          school: "State University",
          degree: "B.A.",
          field: "Human-Computer Interaction",
          startDate: "2015-09",
          endDate: "2019-05",
        },
      ],
      skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Accessibility"],
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export const DEMO_COVER_LETTERS: CoverLetter[] = [
  {
    id: "cover-letter-1",
    userId: DEMO_PROFILE.id,
    applicationId: "app-1",
    title: "Acme Inc. — Product Designer",
    content:
      "Dear Hiring Team,\n\nI'm excited to apply for the Product Designer role at Acme Inc. My background in design systems and user research aligns closely with what you're building...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    application: DEMO_APPLICATIONS[0],
  },
];

export const DEMO_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: "learning-1",
    title: "Mastering the STAR Method",
    description: "Structure compelling behavioral interview answers using Situation, Task, Action, Result.",
    category: "Interviewing",
    resourceType: "article",
    skillTags: ["Interviewing", "Communication"],
    url: "https://example.com/learning/star-method",
    durationMinutes: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-2",
    title: "Portfolio Case Studies That Get Callbacks",
    description: "How to structure a case study that shows real product thinking, not just polished screens.",
    category: "Design",
    resourceType: "article",
    skillTags: ["Portfolio", "Design"],
    url: "https://example.com/learning/portfolio-case-studies",
    durationMinutes: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-3",
    title: "Negotiating Your Offer with Confidence",
    description: "A practical walkthrough of salary negotiation scripts and timing.",
    category: "Negotiation",
    resourceType: "video",
    skillTags: ["Negotiation", "Salary"],
    url: "https://example.com/learning/negotiating-offers",
    durationMinutes: 22,
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-4",
    title: "Design Systems Fundamentals",
    description: "A short course on tokens, component APIs, and governance for design systems.",
    category: "Design",
    resourceType: "course",
    skillTags: ["Design Systems", "Figma"],
    url: "https://example.com/learning/design-systems-fundamentals",
    durationMinutes: 90,
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-5",
    title: "Modern React Patterns",
    description: "Hooks, composition, and server components explained through practical examples.",
    category: "Engineering",
    resourceType: "course",
    skillTags: ["React", "TypeScript"],
    url: "https://example.com/learning/modern-react-patterns",
    durationMinutes: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-6",
    title: "Writing Cover Letters That Aren't Generic",
    description: "A framework for tailoring a cover letter to a specific role in under 20 minutes.",
    category: "Job Search",
    resourceType: "article",
    skillTags: ["Cover Letters", "Writing"],
    url: "https://example.com/learning/cover-letters",
    durationMinutes: 12,
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_LEARNING_PROGRESS: LearningProgress[] = [
  {
    id: "progress-1",
    userId: DEMO_PROFILE.id,
    resourceId: "learning-1",
    status: "completed",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "progress-2",
    userId: DEMO_PROFILE.id,
    resourceId: "learning-4",
    status: "in_progress",
    completedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "notification-1",
    userId: DEMO_PROFILE.id,
    type: "interview_scheduled",
    title: "Interview scheduled",
    body: "Your interview for UI/UX Designer at Vertex is confirmed for in 2 days.",
    readAt: null,
    metadata: { applicationId: "app-2" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "notification-2",
    userId: DEMO_PROFILE.id,
    type: "new_opportunity",
    title: "New opportunity found",
    body: "Senior Frontend Engineer at Northwind Labs matches your preferences.",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    metadata: { jobId: "job-4" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "notification-3",
    userId: DEMO_PROFILE.id,
    type: "journey_completed",
    title: "Journey completed",
    body: "You accepted the offer from Meridian. Congratulations!",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    metadata: { applicationId: "app-4" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

export const DEMO_INTEGRATIONS: UserIntegration[] = [
  {
    id: "integration-1",
    userId: DEMO_PROFILE.id,
    provider: "google_gmail",
    status: "disconnected",
    connectedAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "integration-2",
    userId: DEMO_PROFILE.id,
    provider: "google_calendar",
    status: "disconnected",
    connectedAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "integration-3",
    userId: DEMO_PROFILE.id,
    provider: "google_drive",
    status: "disconnected",
    connectedAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "integration-4",
    userId: DEMO_PROFILE.id,
    provider: "linkedin",
    status: "disconnected",
    connectedAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_RECRUITER_EMAILS: RecruiterEmail[] = [
  {
    id: "email-1",
    userId: DEMO_PROFILE.id,
    applicationId: "app-2",
    source: "manual",
    gmailMessageId: null,
    fromName: "Priya Nair",
    fromEmail: "priya.nair@vertex.example.com",
    subject: "Interview confirmation — UI/UX Designer",
    body: "Hi Alex,\n\nGreat speaking with you! I'd like to confirm your panel interview for the UI/UX Designer role in two days at 10am. You'll meet with our design lead and a product manager.\n\nLet me know if you have any questions.\n\nBest,\nPriya",
    category: "interview",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    readAt: null,
    draftReply: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    application: DEMO_APPLICATIONS[1],
  },
  {
    id: "email-2",
    userId: DEMO_PROFILE.id,
    applicationId: "app-1",
    source: "manual",
    gmailMessageId: null,
    fromName: "Jordan Blake",
    fromEmail: "jordan.blake@acme.example.com",
    subject: "Thanks for applying to Acme Inc.",
    body: "Hi Alex,\n\nThank you for applying to the Product Designer role. Our team is reviewing applications and we'll be in touch within the next two weeks with an update.\n\nThanks,\nJordan\nTalent Acquisition, Acme Inc.",
    category: "recruiter_outreach",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    draftReply: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    application: DEMO_APPLICATIONS[0],
  },
  {
    id: "email-3",
    userId: DEMO_PROFILE.id,
    applicationId: "app-4",
    source: "manual",
    gmailMessageId: null,
    fromName: "Morgan Reyes",
    fromEmail: "morgan.reyes@meridian.example.com",
    subject: "Offer — Product Manager at Meridian",
    body: "Hi Alex,\n\nWe're thrilled to offer you the Product Manager position at Meridian! Attached you'll find the formal offer letter. Please let us know if you have any questions about compensation or start date.\n\nCongratulations,\nMorgan",
    category: "offer",
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    draftReply: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    application: DEMO_APPLICATIONS[3],
  },
];

export function createEmptyDemoResume(title: string): Resume {
  return {
    id: `resume-${crypto.randomUUID()}`,
    userId: DEMO_PROFILE.id,
    title,
    isPrimary: false,
    template: "classic",
    content: createEmptyResumeContent(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const DAILY_RECOMMENDATION_LIMIT = 15;
const INTERVIEW_PREP_WINDOW_MS = 1000 * 60 * 60 * 48;
const NEW_JOB_WINDOW_MS = 1000 * 60 * 60 * 24;

export function getDemoDailyBriefing(): DailyBriefing {
  const now = new Date();

  const applicationsInProgress = DEMO_APPLICATIONS.filter(
    (application) => application.status === "applied" || application.status === "interviewing",
  ).length;
  const interviewsUpcoming = DEMO_APPLICATIONS.filter(
    (application) => application.status === "interviewing",
  ).length;

  const appliedJobIds = new Set(DEMO_APPLICATIONS.map((application) => application.jobId));
  const resumeSkills = DEMO_RESUMES[0]?.content.skills ?? [];
  const learned = computeLearnedPreferences(DEMO_APPLICATIONS);
  const recommended = rankJobsForProfile(
    DEMO_JOBS.filter((job) => !appliedJobIds.has(job.id)),
    DEMO_PROFILE,
    resumeSkills,
    learned,
  ).slice(0, DAILY_RECOMMENDATION_LIMIT);

  const unreadRecruiterEmailCount = DEMO_RECRUITER_EMAILS.filter((email) => !email.readAt).length;
  const staleApplicationCount = getStaleApplications(DEMO_APPLICATIONS, now).length;

  const upcomingInterviews = DEMO_INTERVIEWS.filter((interview) => {
    if (interview.status !== "scheduled") return false;
    const diff = new Date(interview.scheduledAt).getTime() - now.getTime();
    return diff >= 0 && diff <= INTERVIEW_PREP_WINDOW_MS;
  }).map((interview) => ({
    id: interview.id,
    jobTitle: interview.application?.job?.title ?? "Interview",
    company: interview.application?.job?.company ?? "",
    scheduledAt: interview.scheduledAt,
  }));

  const dailyPriorities = buildDailyPriorities({
    hasPrimaryResume: DEMO_RESUMES.some((resume) => resume.isPrimary),
    unreadRecruiterEmailCount,
    upcomingInterviews,
    staleApplicationCount,
    topOpportunityCount: recommended.filter((entry) => entry.match.score >= 60).length,
  });

  const jobsDiscoveredGlobally = DEMO_JOBS.filter(
    (job) => now.getTime() - new Date(job.createdAt).getTime() <= NEW_JOB_WINDOW_MS,
  ).length;
  const duplicatesRemovedGlobally = 0;
  const newInterviewsScheduledCount = DEMO_INTERVIEWS.filter(
    (interview) => now.getTime() - new Date(interview.createdAt).getTime() <= NEW_JOB_WINDOW_MS,
  ).length;

  return {
    greetingName: DEMO_PROFILE.fullName ?? "there",
    applicationsInProgress,
    interviewsUpcoming,
    recommendedJobs: recommended.map((entry) => entry.job),
    recommendedMatches: Object.fromEntries(
      recommended.map((entry) => [entry.job.id, { score: entry.match.score, reasons: entry.match.reasons }]),
    ),
    dailyPriorities,
    unreadRecruiterEmailCount,
    upcomingInterviews,
    staleApplicationCount,
    jobsDiscoveredGlobally,
    duplicatesRemovedGlobally,
    newInterviewsScheduledCount,
  };
}
