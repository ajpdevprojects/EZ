import type { Application, DailyBriefing, Job, Profile } from "@ez/types";

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
  currentRole: "Product Designer",
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    job: DEMO_JOBS[2],
  },
];

export function getDemoDailyBriefing(): DailyBriefing {
  const applicationsInProgress = DEMO_APPLICATIONS.filter(
    (application) => application.status === "applied" || application.status === "interviewing",
  ).length;
  const interviewsUpcoming = DEMO_APPLICATIONS.filter(
    (application) => application.status === "interviewing",
  ).length;

  return {
    greetingName: DEMO_PROFILE.fullName ?? "there",
    applicationsInProgress,
    interviewsUpcoming,
    recommendedJobs: DEMO_JOBS.slice(0, 3),
    nextAction: "Review your UI/UX Designer interview prep for Vertex.",
  };
}
