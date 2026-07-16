import { ApplicationCard } from "@/features/applications/components/application-card";
import { getCompanyWorkspace } from "@/features/companies/data";
import { InterviewCard } from "@/features/interviews/components/interview-card";
import { getCurrentSession } from "@/lib/session";
import { Card, CardContent, EmptyState, PageHeader } from "@ez/ui";
import { CalendarClock, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function CompanyWorkspacePage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { company: encodedCompany } = await params;
  const company = decodeURIComponent(encodedCompany);
  const workspace = await getCompanyWorkspace(session.profile.id, company, session.isDemo);

  if (!workspace) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title={workspace.company} description="Company workspace" />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Applications</h2>
        <div className="flex flex-col gap-3">
          {workspace.applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Interviews</h2>
        {workspace.interviews.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-6" aria-hidden="true" />}
            title="No interviews yet"
            description="Scheduled interviews with this company will show up here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {workspace.interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Cover letters</h2>
        {workspace.coverLetters.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText className="size-6" aria-hidden="true" />}
            title="No cover letters yet"
            description="Create one from a job's details page and it will appear here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {workspace.coverLetters.map((letter) => (
              <Link key={letter.id} href={`/documents/cover-letters/${letter.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="p-4 text-sm font-medium text-foreground">{letter.title}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
