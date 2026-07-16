import { JourneyTimeline } from "@/features/journey/components/journey-timeline";
import { ReflectionEditor } from "@/features/journey/components/reflection-editor";
import { getJourneyByApplicationId, isJourneyComplete } from "@/features/journey/data";
import { getCurrentSession } from "@/lib/session";
import { PageHeader } from "@ez/ui";
import { notFound, redirect } from "next/navigation";

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { applicationId } = await params;
  const entry = await getJourneyByApplicationId(session.profile.id, applicationId, session.isDemo);

  if (!entry) notFound();

  const { application, milestones } = entry;
  const job = application.job;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title={job?.title ?? "Journey"}
        description={job ? `${job.company} · started ${new Date(application.createdAt).toLocaleDateString()}` : undefined}
      />

      <JourneyTimeline milestones={milestones} />

      {isJourneyComplete(application) && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Your reflection</h2>
          <ReflectionEditor applicationId={application.id} initialValue={application.notes ?? ""} />
        </section>
      )}
    </main>
  );
}
