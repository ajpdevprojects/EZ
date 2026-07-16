import { LearningCatalog } from "@/features/learning/components/learning-catalog";
import { getLearningResources, getMyLearningProgress } from "@/features/learning/data";
import { getCurrentSession } from "@/lib/session";
import { PageHeader } from "@ez/ui";
import { redirect } from "next/navigation";

export default async function LearningHubPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const [resources, progress] = await Promise.all([
    getLearningResources(session.isDemo),
    getMyLearningProgress(session.profile.id, session.isDemo),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Learning Hub" description="Sharpen the skills that move your career forward." />
      <LearningCatalog resources={resources} progress={progress} />
    </main>
  );
}
