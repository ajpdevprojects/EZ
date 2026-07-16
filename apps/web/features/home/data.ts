import "server-only";

import { getMyApplications } from "@/features/applications/data";
import { getUnreadRecruiterEmailCount } from "@/features/inbox/data";
import { getMyInterviews } from "@/features/interviews/data";
import { getDismissedJobs } from "@/features/jobs/data";
import { getMyResumes } from "@/features/resume/data";
import {
  buildDailyPriorities,
  computeLearnedPreferences,
  getDemoDailyBriefing,
  getStaleApplications,
  mapJob,
  rankJobsForProfile,
} from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { DailyBriefing, Profile } from "@ez/types";

const DAILY_RECOMMENDATION_LIMIT = 15;
const INTERVIEW_PREP_WINDOW_MS = 1000 * 60 * 60 * 48;

export async function getDailyBriefing(profile: Profile, isDemo: boolean): Promise<DailyBriefing> {
  if (isDemo) return getDemoDailyBriefing();

  const supabase = await createClient();
  const greetingName = profile.fullName?.split(" ")[0] ?? "there";

  if (!supabase) {
    return { ...getDemoDailyBriefing(), greetingName };
  }

  const now = new Date();

  const [applications, interviews, resumes, dismissedJobs, unreadRecruiterEmailCount, { data: jobRows }] =
    await Promise.all([
      getMyApplications(profile.id, false),
      getMyInterviews(profile.id, false),
      getMyResumes(profile.id, false),
      getDismissedJobs(profile.id, false),
      getUnreadRecruiterEmailCount(profile.id, false),
      supabase.from("jobs").select("*").eq("is_active", true).order("posted_at", { ascending: false }).limit(500),
    ]);

  const applicationsInProgress = applications.filter(
    (application) => application.status === "applied" || application.status === "interviewing",
  ).length;
  const interviewsUpcoming = applications.filter((application) => application.status === "interviewing").length;

  const appliedJobIds = new Set(applications.map((application) => application.jobId));
  const dismissedJobIds = new Set(dismissedJobs.map((job) => job.id));
  const primaryResume = resumes.find((resume) => resume.isPrimary) ?? resumes[0];
  const resumeSkills = primaryResume?.content.skills ?? [];

  const learned = computeLearnedPreferences(applications, dismissedJobs);

  const candidateJobs = (jobRows ?? [])
    .map(mapJob)
    .filter((job) => !appliedJobIds.has(job.id) && !dismissedJobIds.has(job.id));

  const recommended = rankJobsForProfile(candidateJobs, profile, resumeSkills, learned).slice(
    0,
    DAILY_RECOMMENDATION_LIMIT,
  );

  const upcomingInterviews = interviews
    .filter((interview) => {
      if (interview.status !== "scheduled") return false;
      const diff = new Date(interview.scheduledAt).getTime() - now.getTime();
      return diff >= 0 && diff <= INTERVIEW_PREP_WINDOW_MS;
    })
    .map((interview) => ({
      id: interview.id,
      jobTitle: interview.application?.job?.title ?? "Interview",
      company: interview.application?.job?.company ?? "",
      scheduledAt: interview.scheduledAt,
    }));

  const staleApplicationCount = getStaleApplications(applications, now).length;

  const dailyPriorities = buildDailyPriorities({
    hasPrimaryResume: Boolean(primaryResume),
    unreadRecruiterEmailCount,
    upcomingInterviews,
    staleApplicationCount,
    topOpportunityCount: recommended.filter((entry) => entry.match.score >= 60).length,
  });

  return {
    greetingName,
    applicationsInProgress,
    interviewsUpcoming,
    recommendedJobs: recommended.map((entry) => entry.job),
    recommendedMatches: Object.fromEntries(
      recommended.map((entry) => [entry.job.id, { score: entry.match.score, reasons: entry.match.reasons }]),
    ),
    dailyPriorities,
    unreadRecruiterEmailCount,
    upcomingInterviews,
  };
}
