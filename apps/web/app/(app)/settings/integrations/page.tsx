import { markIntegrationConnectedAction } from "@/features/integrations/actions";
import { IntegrationCard } from "@/features/integrations/components/integration-card";
import { getMyIntegrations } from "@/features/integrations/data";
import { getCurrentSession } from "@/lib/session";
import { INTEGRATION_PROVIDERS } from "@ez/lib";
import { PageHeader } from "@ez/ui";
import type { IntegrationProvider } from "@ez/types";
import { redirect } from "next/navigation";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { connected } = await searchParams;

  if (connected && INTEGRATION_PROVIDERS.includes(connected as IntegrationProvider) && !session.isDemo) {
    await markIntegrationConnectedAction(connected as IntegrationProvider);
    redirect("/settings/integrations");
  }

  const integrations = await getMyIntegrations(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Integrations"
        description="Connect Gmail, Calendar, Drive, and LinkedIn to keep everything in sync."
      />

      <div className="flex flex-col gap-3">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.provider} integration={integration} />
        ))}
      </div>
    </main>
  );
}
