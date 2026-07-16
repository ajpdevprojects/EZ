import "server-only";

import { getDemoDailyBriefing, mapJob, rankJobsForProfile } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { DailyBriefing, Profile, ResumeContent } from "@ez/types";

export async function getDailyBriefing(profile: Profile, isDemo: boolean): Promise<DailyBriefing> {
  if (isDemo) return getDemoDailyBriefing();

  const supabase = await createClient();
  const greetingName = profile.fullName?.split(" ")[0] ?? "there";

  if (!supabase) {
    return { ...getDemoDailyBriefing(), greetingName };
  }

  const [{ data: applications }, { data: jobRows }, { data: resumeRows }] = await Promise.all([
    supabase.from("applications").select("status").eq("user_id", profile.id),
    supabase.from("jobs").select("*").eq("is_active", true).order("posted_at", { ascending: false }).limit(200),
    supabase.from("resumes").select("content").eq("user_id", profile.id).eq("is_primary", true).limit(1),
  ]);

  const applicationsInProgress =
    applications?.filter((row) => row.status === "applied" || row.status === "interviewing").length ?? 0;
  const interviewsUpcoming = applications?.filter((row) => row.status === "interviewing").length ?? 0;

  const resumeSkills = (resumeRows?.[0]?.content as ResumeContent | undefined)?.skills ?? [];
  const recommended = rankJobsForProfile((jobRows ?? []).map(mapJob), profile, resumeSkills).slice(0, 3);

  return {
    greetingName,
    applicationsInProgress,
    interviewsUpcoming,
    recommendedJobs: recommended.map((entry) => entry.job),
    recommendedMatches: Object.fromEntries(
      recommended.map((entry) => [entry.job.id, { score: entry.match.score, reasons: entry.match.reasons }]),
    ),
    nextAction:
      interviewsUpcoming > 0
        ? "You have an upcoming interview — review your prep notes."
        : "Explore today's recommended opportunities.",
  };
}
