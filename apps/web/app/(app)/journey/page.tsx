import { JourneyCard } from "@/features/journey/components/journey-card";
import { getMyJourneys, isJourneyComplete } from "@/features/journey/data";
import { getCurrentSession } from "@/lib/session";
import { EmptyState, PageHeader } from "@ez/ui";
import { Compass } from "lucide-react";
import { redirect } from "next/navigation";

export default async function JourneyPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const journeys = await getMyJourneys(session.profile.id, session.isDemo);
  const active = journeys.filter((entry) => !isJourneyComplete(entry.application));
  const archived = journeys.filter((entry) => isJourneyComplete(entry.application));

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Career Journey" description="Every step of every application, remembered." />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Active journeys</h2>
        {active.length === 0 ? (
          <EmptyState
            icon={<Compass className="size-6" aria-hidden="true" />}
            title="No active journeys yet"
            description="Apply to a job to start your first journey."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((entry) => (
              <JourneyCard key={entry.application.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Journey Archive</h2>
          <div className="flex flex-col gap-3">
            {archived.map((entry) => (
              <JourneyCard key={entry.application.id} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
