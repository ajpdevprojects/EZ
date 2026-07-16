import { AddEmailDialog } from "@/features/inbox/components/add-email-dialog";
import { EmailListItem } from "@/features/inbox/components/email-list-item";
import { getRecruiterEmails } from "@/features/inbox/data";
import { getCurrentSession } from "@/lib/session";
import { EmptyState, PageHeader } from "@ez/ui";
import { Inbox as InboxIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const emails = await getRecruiterEmails(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Inbox"
        description="Recruiter emails, organized and linked to your applications."
        actions={<AddEmailDialog />}
      />

      {emails.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="size-6" aria-hidden="true" />}
          title="Your inbox is empty"
          description="Add a recruiter email to see it organized here, or connect Gmail from Integrations."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {emails.map((email) => (
            <EmailListItem key={email.id} email={email} />
          ))}
        </div>
      )}
    </main>
  );
}
