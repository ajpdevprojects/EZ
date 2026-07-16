"use server";

import { createNotification, recordMilestone, recordApplicationStatusMilestones } from "@/lib/journey-events";
import { createClient } from "@ez/lib/supabase/server";
import type { ApplicationStatus } from "@ez/types";
import { revalidatePath } from "next/cache";

export interface ApplyToJobResult {
  error?: string;
  alreadyApplied?: boolean;
}

export async function applyToJobAction(jobId: string): Promise<ApplyToJobResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Applying isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session expired — please sign in again." };

  const [{ data: job }, { data: primaryResume }] = await Promise.all([
    supabase.from("jobs").select("title, company").eq("id", jobId).maybeSingle(),
    supabase.from("resumes").select("id").eq("user_id", user.id).eq("is_primary", true).maybeSingle(),
  ]);

  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  let applicationId: string;

  if (existing) {
    if (existing.status !== "saved") return { alreadyApplied: true };

    const { error } = await supabase
      .from("applications")
      .update({ status: "applied", applied_at: new Date().toISOString(), resume_id: primaryResume?.id ?? null })
      .eq("id", existing.id);

    if (error) return { error: error.message };
    applicationId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: jobId,
        status: "applied",
        applied_at: new Date().toISOString(),
        resume_id: primaryResume?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    applicationId = created.id;

    await recordMilestone(supabase, applicationId, "journey_started");
  }

  await recordApplicationStatusMilestones(supabase, applicationId, "applied");

  if (job) {
    await createNotification(
      supabase,
      user.id,
      "new_opportunity",
      "Application submitted",
      `Your application for ${job.title} at ${job.company} is on its way. I'll track every update here.`,
      { applicationId, jobId },
    );
  }

  revalidatePath("/applications");
  revalidatePath("/home");
  revalidatePath("/journey");
  return {};
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Updating applications isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return { error: "That application couldn't be found." };

  await recordApplicationStatusMilestones(supabase, applicationId, status);

  const { data: application } = await supabase
    .from("applications")
    .select("job_id, jobs(title, company)")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();
  const job = (application as { jobs?: { title: string; company: string } | null } | null)?.jobs;

  if (job && status === "offer") {
    await createNotification(
      supabase,
      user.id,
      "offer_received",
      "Offer received",
      `Congratulations — you have an offer from ${job.company} for ${job.title}.`,
      { applicationId },
    );
  }

  if (job && status === "hired") {
    await createNotification(
      supabase,
      user.id,
      "journey_completed",
      "Journey completed",
      `You accepted the offer from ${job.company}. Congratulations on the new role!`,
      { applicationId },
    );
  }

  revalidatePath("/applications");
  revalidatePath("/journey");
  return {};
}
