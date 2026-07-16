"use server";

import { coverLetterSchema, generateElizabethText } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Documents aren't available yet — Supabase hasn't been configured." } as const;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session expired — please sign in again." } as const;

  return { supabase, user } as const;
}

export async function createCoverLetterAction(): Promise<{ error?: string } | undefined> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { data, error } = await context.supabase
    .from("cover_letters")
    .insert({ user_id: context.user.id, title: "Untitled cover letter", content: "" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/documents");
  redirect(`/documents/cover-letters/${data.id}`);
}

/** Creates a cover letter already linked to an application, so its AI
 * draft is tailored to that specific job from the first save. */
export async function createTailoredCoverLetterAction(
  applicationId: string,
  title: string,
): Promise<{ error?: string } | undefined> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  // applicationId is caller-supplied — confirm it's actually this user's
  // application before linking, rather than trusting the client. RLS would
  // stop them reading someone else's application through the link, but
  // without this check they could still plant a reference to an arbitrary
  // application id on their own cover letter.
  const { data: application } = await context.supabase
    .from("applications")
    .select("id")
    .eq("id", applicationId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (!application) return { error: "That application couldn't be found." };

  const { data, error } = await context.supabase
    .from("cover_letters")
    .insert({
      user_id: context.user.id,
      application_id: applicationId,
      title,
      content: "",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/documents");
  redirect(`/documents/cover-letters/${data.id}`);
}

export async function updateCoverLetterAction(
  coverLetterId: string,
  input: z.infer<typeof coverLetterSchema>,
): Promise<{ error?: string }> {
  const parsed = coverLetterSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the cover letter and try again." };
  }

  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("cover_letters")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      application_id: parsed.data.applicationId,
    })
    .eq("id", coverLetterId)
    .eq("user_id", context.user.id);

  if (error) return { error: error.message };

  revalidatePath("/documents");
  revalidatePath(`/documents/cover-letters/${coverLetterId}`);
  return {};
}

export async function deleteCoverLetterAction(coverLetterId: string): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("cover_letters")
    .delete()
    .eq("id", coverLetterId)
    .eq("user_id", context.user.id);

  if (error) return { error: error.message };

  revalidatePath("/documents");
  return {};
}

export async function draftCoverLetterAction(
  jobTitle: string,
  company: string,
  background: string,
): Promise<{ draft?: string; error?: string }> {
  const prompt = `Draft a concise, specific, non-generic cover letter (3 short paragraphs) for a "${jobTitle}" role at "${company}". Use this background about the candidate: ${background || "no additional background provided"}.`;

  const result = await generateElizabethText(prompt);
  if (!result) {
    return {
      error: "Ask EZ isn't available yet — connect an AI provider to draft a letter. You can still write one manually.",
    };
  }

  return { draft: result.text };
}

export async function deleteUploadedFileAction(path: string): Promise<{ error?: string }> {
  const context = await requireUser();
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase.storage.from("documents").remove([path]);
  if (error) return { error: error.message };

  revalidatePath("/documents");
  return {};
}
