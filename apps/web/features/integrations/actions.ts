"use server";

import { createClient } from "@ez/lib/supabase/server";
import type { IntegrationProvider } from "@ez/types";
import { revalidatePath } from "next/cache";

export async function markIntegrationConnectedAction(provider: IntegrationProvider): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Integrations aren't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase.from("user_integrations").upsert(
    {
      user_id: user.id,
      provider,
      status: "connected",
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );

  if (error) return { error: error.message };

  revalidatePath("/settings/integrations");
  return {};
}

export async function disconnectIntegrationAction(provider: IntegrationProvider): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Integrations aren't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase.from("user_integrations").upsert(
    {
      user_id: user.id,
      provider,
      status: "disconnected",
      connected_at: null,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) return { error: error.message };

  revalidatePath("/settings/integrations");
  return {};
}
