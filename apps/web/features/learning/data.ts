import "server-only";

import {
  DEMO_LEARNING_PROGRESS,
  DEMO_LEARNING_RESOURCES,
  mapLearningProgress,
  mapLearningResource,
} from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { LearningProgress, LearningResource } from "@ez/types";

export async function getLearningResources(isDemo: boolean): Promise<LearningResource[]> {
  const supabase = await createClient();
  if (isDemo || !supabase) return DEMO_LEARNING_RESOURCES;

  const { data } = await supabase.from("learning_resources").select("*").order("category");
  return (data ?? []).map(mapLearningResource);
}

export async function getMyLearningProgress(userId: string, isDemo: boolean): Promise<LearningProgress[]> {
  const supabase = await createClient();
  if (isDemo || !supabase) return DEMO_LEARNING_PROGRESS;

  const { data } = await supabase.from("learning_progress").select("*").eq("user_id", userId);
  return (data ?? []).map(mapLearningProgress);
}
