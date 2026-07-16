import { ApplicationPipeline } from "@/features/applications/components/application-pipeline";
import { getMyApplications } from "@/features/applications/data";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const applications = await getMyApplications(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">My Applications</h1>
      <ApplicationPipeline applications={applications} />
    </main>
  );
}
