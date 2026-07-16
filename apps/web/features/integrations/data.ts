import "server-only";

import { DEMO_INTEGRATIONS, INTEGRATION_PROVIDERS, mapUserIntegration } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { UserIntegration } from "@ez/types";

function defaultIntegration(userId: string, provider: (typeof INTEGRATION_PROVIDERS)[number]): UserIntegration {
  return {
    id: `default-${provider}`,
    userId,
    provider,
    status: "disconnected",
    connectedAt: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getMyIntegrations(userId: string, isDemo: boolean): Promise<UserIntegration[]> {
  if (isDemo) return DEMO_INTEGRATIONS;

  const supabase = await createClient();
  if (!supabase) return DEMO_INTEGRATIONS;

  const { data } = await supabase.from("user_integrations").select("*").eq("user_id", userId);
  const byProvider = new Map((data ?? []).map(mapUserIntegration).map((row) => [row.provider, row]));

  return INTEGRATION_PROVIDERS.map((provider) => byProvider.get(provider) ?? defaultIntegration(userId, provider));
}
