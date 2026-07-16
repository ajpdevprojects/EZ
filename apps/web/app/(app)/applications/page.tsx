import { ApplicationPipeline } from "@/features/applications/components/application-pipeline";
import { getMyApplications } from "@/features/applications/data";
import { getCurrentSession } from "@/lib/session";
import { Button, PageHeader } from "@ez/ui";
import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const applications = await getMyApplications(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="My Applications"
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/interviews">
              <CalendarClock className="size-4" aria-hidden="true" />
              Interviews
            </Link>
          </Button>
        }
      />
      <ApplicationPipeline applications={applications} />
    </main>
  );
}
