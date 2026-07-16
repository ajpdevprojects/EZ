"use server";

import { createNotification, recordMilestone } from "@/lib/journey-events";
import { generateElizabethText, interviewSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

export async function scheduleInterviewAction(
  input: z.infer<typeof interviewSchema>,
): Promise<{ error?: string } | undefined> {
  const parsed = interviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the interview details and try again." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Scheduling isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { data: interview, error } = await supabase
    .from("interviews")
    .insert({
      application_id: parsed.data.applicationId,
      user_id: user.id,
      interview_type: parsed.data.interviewType,
      scheduled_at: parsed.data.scheduledAt,
      location_or_link: parsed.data.locationOrLink,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("applications")
    .update({ status: "interviewing" })
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id)
    .neq("status", "hired")
    .neq("status", "offer");

  await recordMilestone(supabase, parsed.data.applicationId, "interview_scheduled");

  const { data: application } = await supabase
    .from("applications")
    .select("jobs(title, company)")
    .eq("id", parsed.data.applicationId)
    .maybeSingle();
  const job = (application as { jobs?: { title: string; company: string } | null } | null)?.jobs;

  if (job) {
    await createNotification(
      supabase,
      user.id,
      "interview_scheduled",
      "Interview scheduled",
      `Your ${parsed.data.interviewType} interview for ${job.title} at ${job.company} is confirmed.`,
      { applicationId: parsed.data.applicationId },
    );
  }

  revalidatePath("/interviews");
  revalidatePath("/applications");
  revalidatePath("/journey");
  redirect(`/interviews/${interview.id}`);
}

export async function markInterviewCompletedAction(interviewId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Updating interviews isn't available yet — Supabase hasn't been configured." };
  }

  const { data: interview, error } = await supabase
    .from("interviews")
    .update({ status: "completed" })
    .eq("id", interviewId)
    .select("application_id")
    .single();

  if (error) return { error: error.message };

  await recordMilestone(supabase, interview.application_id, "interview_completed");

  revalidatePath("/interviews");
  revalidatePath("/journey");
  return {};
}

export async function cancelInterviewAction(interviewId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Updating interviews isn't available yet — Supabase hasn't been configured." };
  }

  const { error } = await supabase.from("interviews").update({ status: "cancelled" }).eq("id", interviewId);
  if (error) return { error: error.message };

  revalidatePath("/interviews");
  return {};
}

export async function draftFollowUpEmailAction(
  jobTitle: string,
  company: string,
  interviewType: string,
): Promise<{ draft?: string; error?: string }> {
  const prompt = `Draft a short, warm, professional thank-you follow-up email to send after a ${interviewType} interview for a "${jobTitle}" role at "${company}". Keep it under 120 words. Do not include a subject line.`;

  const result = await generateElizabethText(prompt);
  if (!result) {
    return {
      error: "Ask EZ isn't available yet — connect an AI provider to draft this email. You're welcome to write your own.",
    };
  }

  return { draft: result.text };
}
