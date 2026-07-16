"use server";

import { onboardingSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { redirect } from "next/navigation";
import type { z } from "zod";

export async function completeOnboardingAction(
  input: z.infer<typeof onboardingSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete every step." };
  }

  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Your session expired — please sign in again." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        career_goals: parsed.data.careerGoals,
        current_job_title: parsed.data.currentJobTitle,
        preferred_locations: parsed.data.preferredLocations,
        work_types: parsed.data.workTypes,
        priorities: parsed.data.priorities,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
  }

  redirect("/home");
}
