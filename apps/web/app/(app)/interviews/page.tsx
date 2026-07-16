import { getMyApplications } from "@/features/applications/data";
import { InterviewCard } from "@/features/interviews/components/interview-card";
import { ScheduleInterviewDialog } from "@/features/interviews/components/schedule-interview-dialog";
import { getMyInterviews } from "@/features/interviews/data";
import { partitionInterviews } from "@/features/interviews/partition";
import { getCurrentSession } from "@/lib/session";
import { EmptyState, PageHeader } from "@ez/ui";
import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InterviewsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const [interviews, applications] = await Promise.all([
    getMyInterviews(session.profile.id, session.isDemo),
    getMyApplications(session.profile.id, session.isDemo),
  ]);

  const { upcoming, past } = partitionInterviews(interviews);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Interview Center"
        description="Every interview, prepped and tracked in one place."
        actions={<ScheduleInterviewDialog applications={applications} />}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-6" aria-hidden="true" />}
            title="No upcoming interviews"
            description="Schedule one to start preparing with Elizabeth."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Past</h2>
          <div className="flex flex-col gap-3">
            {past.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
