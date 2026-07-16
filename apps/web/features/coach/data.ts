import "server-only";

import { DEMO_APPLICATIONS, DEMO_INTERVIEWS, DEMO_LEARNING_PROGRESS, DEMO_RESUMES } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";

export interface CoachingChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
}

export async function getCoachingChecklist(userId: string, isDemo: boolean): Promise<CoachingChecklistItem[]> {
  let hasResume = DEMO_RESUMES.length > 0;
  let hasApplied = DEMO_APPLICATIONS.length > 0;
  let hasUpcomingInterview = DEMO_INTERVIEWS.some((interview) => interview.status === "scheduled");
  let hasLearningProgress = DEMO_LEARNING_PROGRESS.length > 0;

  if (!isDemo) {
    const supabase = await createClient();
    if (supabase) {
      const [{ count: resumeCount }, { count: applicationCount }, { count: interviewCount }, { count: learningCount }] =
        await Promise.all([
          supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase
            .from("interviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "scheduled"),
          supabase.from("learning_progress").select("id", { count: "exact", head: true }).eq("user_id", userId),
        ]);

      hasResume = (resumeCount ?? 0) > 0;
      hasApplied = (applicationCount ?? 0) > 0;
      hasUpcomingInterview = (interviewCount ?? 0) > 0;
      hasLearningProgress = (learningCount ?? 0) > 0;
    }
  }

  return [
    {
      id: "resume",
      label: "Build your resume",
      description: "Create a resume so you're ready to apply with confidence.",
      done: hasResume,
      href: "/resume",
    },
    {
      id: "apply",
      label: "Submit your first application",
      description: "Find a role that fits and apply.",
      done: hasApplied,
      href: "/search",
    },
    {
      id: "interview",
      label: "Prepare for an interview",
      description: "Schedule and prep for your next conversation.",
      done: hasUpcomingInterview,
      href: "/interviews",
    },
    {
      id: "learning",
      label: "Start learning something new",
      description: "Sharpen a skill in the Learning Hub.",
      done: hasLearningProgress,
      href: "/learning",
    },
  ];
}
