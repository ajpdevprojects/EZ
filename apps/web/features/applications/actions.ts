"use server";

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

  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    if (existing.status !== "saved") return { alreadyApplied: true };

    const { error } = await supabase
      .from("applications")
      .update({ status: "applied", applied_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      job_id: jobId,
      status: "applied",
      applied_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/applications");
  revalidatePath("/home");
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

  const { error } = await supabase.from("applications").update({ status }).eq("id", applicationId);
  if (error) return { error: error.message };

  revalidatePath("/applications");
  return {};
}
