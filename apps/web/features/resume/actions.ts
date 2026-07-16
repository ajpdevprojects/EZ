"use server";

import { createEmptyResumeContent } from "@ez/types";
import { generateElizabethText, resumeContentSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { ResumeContent } from "@ez/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Resumes aren't available yet — Supabase hasn't been configured." } as const;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session expired — please sign in again." } as const;

  return { supabase, user } as const;
}

export async function createResumeAction(title: string): Promise<{ error?: string; resumeId?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { data, error } = await context.supabase
    .from("resumes")
    .insert({
      user_id: context.user.id,
      title: title.trim() || "Untitled resume",
      content: createEmptyResumeContent() as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/resume");
  redirect(`/resume/${data.id}`);
}

export async function updateResumeAction(
  resumeId: string,
  input: { title: string; content: z.infer<typeof resumeContentSchema> },
): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const parsed = resumeContentSchema.safeParse(input.content);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the resume fields and try again." };
  }

  const { error } = await context.supabase
    .from("resumes")
    .update({
      title: input.title.trim() || "Untitled resume",
      content: parsed.data as unknown as Record<string, unknown>,
    })
    .eq("id", resumeId)
    .eq("user_id", context.user.id);

  if (error) return { error: error.message };

  revalidatePath("/resume");
  revalidatePath(`/resume/${resumeId}`);
  return {};
}

export async function setPrimaryResumeAction(resumeId: string): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { error: clearError } = await context.supabase
    .from("resumes")
    .update({ is_primary: false })
    .eq("user_id", context.user.id);
  if (clearError) return { error: clearError.message };

  const { error } = await context.supabase
    .from("resumes")
    .update({ is_primary: true })
    .eq("id", resumeId)
    .eq("user_id", context.user.id);

  if (error) return { error: error.message };

  revalidatePath("/resume");
  return {};
}

export async function duplicateResumeAction(resumeId: string): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { data: original, error: fetchError } = await context.supabase
    .from("resumes")
    .select("title, template, content")
    .eq("id", resumeId)
    .eq("user_id", context.user.id)
    .single();

  if (fetchError || !original) return { error: fetchError?.message ?? "Resume not found." };

  const { error } = await context.supabase.from("resumes").insert({
    user_id: context.user.id,
    title: `${original.title} (copy)`,
    template: original.template,
    content: original.content,
  });

  if (error) return { error: error.message };

  revalidatePath("/resume");
  return {};
}

export async function deleteResumeAction(resumeId: string): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", context.user.id);

  if (error) return { error: error.message };

  revalidatePath("/resume");
  return {};
}

export async function getResumeFeedbackAction(
  resumeTitle: string,
  content: ResumeContent,
): Promise<{ feedback?: string; error?: string }> {
  const prompt = `Review this resume and give three specific, actionable pieces of feedback to strengthen it. Be concise.

Title: ${resumeTitle}
Summary: ${content.summary || "(none written yet)"}
Experience: ${content.experience.map((entry) => `${entry.title} at ${entry.company}: ${entry.highlights.join("; ")}`).join("\n")}
Skills: ${content.skills.join(", ")}`;

  const result = await generateElizabethText(prompt);
  if (!result) {
    return {
      error:
        "Ask EZ isn't available yet — connect an AI provider to get feedback. You can still edit your resume manually.",
    };
  }

  return { feedback: result.text };
}
