"use server";

import { createClient } from "@ez/lib/supabase/server";
import type { JourneyTheme } from "@ez/types";
import { revalidatePath } from "next/cache";

const VALID_THEMES: JourneyTheme[] = ["executive", "minimal", "ambient", "nature", "silent"];

export async function updateJourneyThemeAction(theme: JourneyTheme): Promise<{ error?: string }> {
  if (!VALID_THEMES.includes(theme)) return { error: "Unknown journey theme." };

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Updating your journey theme isn't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase.from("profiles").update({ journey_theme: theme }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}
