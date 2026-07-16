import "server-only";

import { DEMO_RESUMES, mapResume } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Resume } from "@ez/types";

export async function getMyResumes(userId: string, isDemo: boolean): Promise<Resume[]> {
  if (isDemo) return DEMO_RESUMES;

  const supabase = await createClient();
  if (!supabase) return DEMO_RESUMES;

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map(mapResume);
}

export async function getResumeById(
  userId: string,
  resumeId: string,
  isDemo: boolean,
): Promise<Resume | null> {
  if (isDemo) return DEMO_RESUMES.find((resume) => resume.id === resumeId) ?? null;

  const supabase = await createClient();
  if (!supabase) return DEMO_RESUMES.find((resume) => resume.id === resumeId) ?? null;

  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapResume(data) : null;
}
