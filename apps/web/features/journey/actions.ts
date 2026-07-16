"use server";

import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateJourneyReflectionAction(
  applicationId: string,
  reflection: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Saving reflections isn't available yet — Supabase hasn't been configured." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ notes: reflection })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/journey");
  revalidatePath(`/journey/${applicationId}`);
  return {};
}
