"use server";

import { createClient } from "@ez/lib/supabase/server";
import type { LearningProgressStatus } from "@ez/types";
import { revalidatePath } from "next/cache";

export async function updateLearningProgressAction(
  resourceId: string,
  status: LearningProgressStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Tracking progress isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase.from("learning_progress").upsert(
    {
      user_id: user.id,
      resource_id: resourceId,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,resource_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/learning");
  return {};
}
