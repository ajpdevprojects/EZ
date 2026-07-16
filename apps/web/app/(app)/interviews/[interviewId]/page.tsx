import { FollowUpEmail } from "@/features/interviews/components/follow-up-email";
import { InterviewActions } from "@/features/interviews/components/interview-actions";
import { InterviewPrep } from "@/features/interviews/components/interview-prep";
import { getInterviewById } from "@/features/interviews/data";
import { getCurrentSession } from "@/lib/session";
import { formatInterviewDateTime } from "@ez/lib";
import { Badge, Button, PageHeader } from "@ez/ui";
import { CalendarPlus, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { interviewId } = await params;
  const interview = await getInterviewById(session.profile.id, interviewId, session.isDemo);

  if (!interview) notFound();

  const job = interview.application?.job;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title={job?.title ?? "Interview"}
        description={job ? `${job.company} · ${interview.interviewType} interview` : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="interview">{formatInterviewDateTime(interview.scheduledAt)}</Badge>
        {interview.locationOrLink && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {interview.locationOrLink}
          </span>
        )}
      </div>

      {interview.notes && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground">{interview.notes}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary" size="sm">
          <a href={`/api/interviews/${interview.id}/ics`} download={`interview-${interview.id}.ics`}>
            <CalendarPlus className="size-4" aria-hidden="true" />
            Add to Calendar
          </a>
        </Button>
      </div>

      <InterviewActions interviewId={interview.id} status={interview.status} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Prep questions</h2>
        <InterviewPrep skills={job?.skills ?? []} />
      </section>

      {job && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Follow up</h2>
          <FollowUpEmail jobTitle={job.title} company={job.company} interviewType={interview.interviewType} />
        </section>
      )}
    </main>
  );
}
