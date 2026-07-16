import { DraftReply } from "@/features/inbox/components/draft-reply";
import { MarkEmailReadOnView } from "@/features/inbox/components/mark-email-read-on-view";
import { getRecruiterEmailById } from "@/features/inbox/data";
import { RECRUITER_EMAIL_CATEGORY_LABEL } from "@/features/inbox/labels";
import { getCurrentSession } from "@/lib/session";
import { formatRelativeTime } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import { Briefcase, Mail } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function RecruiterEmailPage({
  params,
}: {
  params: Promise<{ emailId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { emailId } = await params;
  const email = await getRecruiterEmailById(session.profile.id, emailId, session.isDemo);
  if (!email) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <MarkEmailReadOnView emailId={email.id} isRead={Boolean(email.readAt)} />

      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Mail className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold text-foreground">{email.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {email.fromName ? `${email.fromName} · ` : ""}
            {email.fromEmail}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{RECRUITER_EMAIL_CATEGORY_LABEL[email.category]}</Badge>
        <span className="text-xs text-muted-foreground">{formatRelativeTime(email.receivedAt)}</span>
      </div>

      {email.application?.job && (
        <Link href={`/jobs/${email.application.jobId}`}>
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-3 p-4">
              <Briefcase className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground">{email.application.job.title}</p>
                <p className="text-xs text-muted-foreground">{email.application.job.company}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <Card>
        <CardContent className="p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{email.body}</p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Reply</h2>
        <DraftReply emailId={email.id} initialDraft={email.draftReply} />
      </section>
    </main>
  );
}
