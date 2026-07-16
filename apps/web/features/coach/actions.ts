"use server";

import { onboardingSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

export async function updateCareerGoalsAction(
  input: z.infer<typeof onboardingSchema>,
): Promise<{ error?: string }> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your goals and try again." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Updating goals isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({
      career_goals: parsed.data.careerGoals,
      current_role: parsed.data.currentRole,
      preferred_locations: parsed.data.preferredLocations,
      work_types: parsed.data.workTypes,
      priorities: parsed.data.priorities,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/coach");
  revalidatePath("/profile");
  return {};
}
