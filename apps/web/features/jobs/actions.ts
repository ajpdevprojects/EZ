"use server";

import { buildJobMatchPrompt, generateElizabethText, parseMatchAnalysis, type JobMatchAnalysis } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";

export type { JobMatchAnalysis };

/**
 * AI job analysis: compares a job against the professional's profile and
 * primary resume to produce a match score and honest reasoning. Recorded
 * on the application (if one exists) so the pipeline reflects it too.
 */
export async function analyzeJobMatchAction(jobId: string): Promise<{ analysis?: JobMatchAnalysis; error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Job analysis isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const [{ data: job }, { data: profile }, { data: resume }] = await Promise.all([
    supabase.from("jobs").select("title, company, description, skills").eq("id", jobId).maybeSingle(),
    supabase
      .from("profiles")
      .select("current_role, career_goals, priorities")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("content")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  if (!job) return { error: "Job not found." };

  const resumeContent = resume?.content as { summary?: string; skills?: string[] } | undefined;

  const prompt = buildJobMatchPrompt({
    jobTitle: job.title,
    company: job.company,
    description: job.description,
    requiredSkills: job.skills,
    currentRole: profile?.current_role ?? "",
    careerGoals: profile?.career_goals ?? [],
    priorities: profile?.priorities ?? [],
    resumeSummary: resumeContent?.summary ?? "",
    resumeSkills: resumeContent?.skills ?? [],
  });

  const result = await generateElizabethText(prompt);
  if (!result) {
    return {
      error: "Ask EZ isn't available yet — connect an AI provider to analyze this job against your profile.",
    };
  }

  const analysis = parseMatchAnalysis(result.text);

  await supabase
    .from("applications")
    .update({ match_score: analysis.score, match_reason: analysis.reason })
    .eq("user_id", user.id)
    .eq("job_id", jobId);

  return { analysis };
}
