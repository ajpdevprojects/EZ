import { verifyCronRequest } from "@/lib/cron-auth";
import {
  computeLearnedPreferences,
  computeResumePerformance,
  getStaleApplications,
  mapApplication,
  mapJob,
  mapProfile,
  mapResume,
  planDailyBriefingNotifications,
  rankJobsForProfile,
} from "@ez/lib";
import { createServiceClient } from "@ez/lib/supabase/service";
import { NextResponse } from "next/server";

export const maxDuration = 120;

const NEW_JOB_WINDOW_MS = 1000 * 60 * 60 * 24;
const INTERVIEW_PREP_WINDOW_MS = 1000 * 60 * 60 * 48;
const HIGH_CONFIDENCE_THRESHOLD = 70;
const RESUME_PERFORMANCE_MIN_APPLICATIONS = 3;
const RESUME_PERFORMANCE_MIN_RATE = 50;
const FOLLOW_UP_DEDUPE_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;
const RESUME_ALERT_DEDUPE_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

/**
 * Proactive Software Brain: runs once a day so the user opens EZ to
 * meaningful work already done — new opportunities discovered, today's
 * best match ranked, follow-ups flagged, resume performance noted. Every
 * notification is idempotent (never repeats itself for the same job/day/
 * resume) so this can run on every schedule tick safely. Triggered by
 * Vercel Cron (see apps/web/vercel.json) behind CRON_SECRET.
 */
export async function GET(request: Request) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured — the daily briefing job is disabled." },
      { status: 503 },
    );
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const newJobCutoff = new Date(now.getTime() - NEW_JOB_WINDOW_MS).toISOString();

  const [{ data: profileRows, error: profilesError }, { data: activeJobRows }] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("jobs").select("*").eq("is_active", true).limit(1000),
  ]);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const activeJobs = (activeJobRows ?? []).map(mapJob);
  const newJobIds = new Set((activeJobRows ?? []).filter((row) => row.created_at >= newJobCutoff).map((row) => row.id));

  let briefingsCreated = 0;
  let notificationsCreated = 0;

  for (const profileRow of profileRows ?? []) {
    const profile = mapProfile(profileRow);

    const [
      { data: existingDailyBriefing },
      { data: applicationRows },
      { data: dismissedRows },
      { data: resumeRows },
      { data: interviewRows },
      { count: unreadRecruiterEmailCount },
    ] = await Promise.all([
      supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", "daily_briefing")
        .gte("created_at", startOfToday)
        .maybeSingle(),
      supabase.from("applications").select("*, jobs(*)").eq("user_id", profile.id),
      supabase.from("dismissed_jobs").select("jobs(*)").eq("user_id", profile.id),
      supabase.from("resumes").select("*").eq("user_id", profile.id),
      supabase.from("interviews").select("id, status, scheduled_at").eq("user_id", profile.id).eq("status", "scheduled"),
      supabase.from("recruiter_emails").select("id", { count: "exact", head: true }).eq("user_id", profile.id).is("read_at", null),
    ]);

    if (existingDailyBriefing) continue;

    const applications = (applicationRows ?? []).map((row) => {
      const { jobs: jobRow, ...applicationRow } = row as typeof row & { jobs: Parameters<typeof mapJob>[0] | null };
      return mapApplication(applicationRow, jobRow ?? undefined);
    });

    const dismissedJobs = (dismissedRows ?? [])
      .map((row) => (row as { jobs: Parameters<typeof mapJob>[0] | null }).jobs)
      .filter((job): job is Parameters<typeof mapJob>[0] => job !== null)
      .map(mapJob);

    const resumes = (resumeRows ?? []).map(mapResume);
    const primaryResume = resumes.find((resume) => resume.isPrimary) ?? resumes[0];
    const resumeSkills = primaryResume?.content.skills ?? [];

    const appliedJobIds = new Set(applications.map((application) => application.jobId));
    const dismissedJobIds = new Set(dismissedJobs.map((job) => job.id));

    const learned = computeLearnedPreferences(applications, dismissedJobs);
    const candidateJobs = activeJobs.filter((job) => !appliedJobIds.has(job.id) && !dismissedJobIds.has(job.id));
    const ranked = rankJobsForProfile(candidateJobs, profile, resumeSkills, learned);

    const topEntry = ranked[0];
    const topOpportunity = topEntry
      ? { title: topEntry.job.title, company: topEntry.job.company, score: topEntry.match.score }
      : null;

    const newJobsCount = ranked.filter((entry) => newJobIds.has(entry.job.id)).length;
    const highConfidenceNewJobs = ranked.filter(
      (entry) => newJobIds.has(entry.job.id) && entry.match.score >= HIGH_CONFIDENCE_THRESHOLD,
    );

    const newHighConfidenceJobs: Array<{ jobId: string; title: string; company: string; score: number }> = [];
    for (const entry of highConfidenceNewJobs) {
      const { data: alreadyNotified } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", "new_opportunity")
        .contains("metadata", { jobId: entry.job.id })
        .maybeSingle();
      if (!alreadyNotified) {
        newHighConfidenceJobs.push({
          jobId: entry.job.id,
          title: entry.job.title,
          company: entry.job.company,
          score: entry.match.score,
        });
      }
    }

    const upcomingInterviewCount = (interviewRows ?? []).filter((interview) => {
      const diff = new Date(interview.scheduled_at).getTime() - now.getTime();
      return diff >= 0 && diff <= INTERVIEW_PREP_WINDOW_MS;
    }).length;

    let staleApplicationCount = getStaleApplications(applications, now).length;
    if (staleApplicationCount > 0) {
      const { data: recentFollowUp } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", "follow_up_recommended")
        .gte("created_at", new Date(now.getTime() - FOLLOW_UP_DEDUPE_WINDOW_MS).toISOString())
        .maybeSingle();
      if (recentFollowUp) staleApplicationCount = 0;
    }

    const performance = computeResumePerformance(applications);
    const resumePerformanceAlerts: Array<{
      resumeId: string;
      resumeTitle: string;
      interviewRate: number;
      applications: number;
    }> = [];

    for (const resume of resumes) {
      const stats = performance[resume.id];
      if (!stats) continue;
      if (stats.applications < RESUME_PERFORMANCE_MIN_APPLICATIONS) continue;
      if (stats.interviewRate < RESUME_PERFORMANCE_MIN_RATE) continue;

      const { data: existingAlert } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", "resume_performing_well")
        .contains("metadata", { resumeId: resume.id })
        .gte("created_at", new Date(now.getTime() - RESUME_ALERT_DEDUPE_WINDOW_MS).toISOString())
        .maybeSingle();

      if (!existingAlert) {
        resumePerformanceAlerts.push({
          resumeId: resume.id,
          resumeTitle: resume.title,
          interviewRate: stats.interviewRate,
          applications: stats.applications,
        });
      }
    }

    const planned = planDailyBriefingNotifications({
      greetingName: profile.fullName?.split(" ")[0] ?? "there",
      newJobsCount,
      topOpportunity,
      upcomingInterviewCount,
      staleApplicationCount,
      unreadRecruiterEmailCount: unreadRecruiterEmailCount ?? 0,
      newHighConfidenceJobs,
      resumePerformanceAlerts,
    });

    for (const notification of planned) {
      const { error } = await supabase.from("notifications").insert({
        user_id: profile.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        metadata: notification.metadata,
      });
      if (!error) notificationsCreated++;
    }

    briefingsCreated++;
  }

  return NextResponse.json({ usersProcessed: profileRows?.length ?? 0, briefingsCreated, notificationsCreated });
}
