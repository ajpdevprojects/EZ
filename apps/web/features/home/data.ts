import "server-only";

import { getDemoDailyBriefing, mapJob } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { DailyBriefing, Profile } from "@ez/types";

export async function getDailyBriefing(profile: Profile, isDemo: boolean): Promise<DailyBriefing> {
  if (isDemo) return getDemoDailyBriefing();

  const supabase = await createClient();
  const greetingName = profile.fullName?.split(" ")[0] ?? "there";

  if (!supabase) {
    return { ...getDemoDailyBriefing(), greetingName };
  }

  const [{ data: applications }, { data: recommendedJobRows }] = await Promise.all([
    supabase.from("applications").select("status").eq("user_id", profile.id),
    supabase.from("jobs").select("*").order("posted_at", { ascending: false }).limit(3),
  ]);

  const applicationsInProgress =
    applications?.filter((row) => row.status === "applied" || row.status === "interviewing").length ?? 0;
  const interviewsUpcoming = applications?.filter((row) => row.status === "interviewing").length ?? 0;

  return {
    greetingName,
    applicationsInProgress,
    interviewsUpcoming,
    recommendedJobs: (recommendedJobRows ?? []).map(mapJob),
    nextAction:
      interviewsUpcoming > 0
        ? "You have an upcoming interview — review your prep notes."
        : "Explore today's recommended opportunities.",
  };
}
