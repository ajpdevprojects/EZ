import { getMyApplications } from "@/features/applications/data";
import { CoverLetterEditor } from "@/features/documents/components/cover-letter-editor";
import { getCoverLetterById } from "@/features/documents/data";
import { getCurrentSession } from "@/lib/session";
import { PageHeader } from "@ez/ui";
import { notFound, redirect } from "next/navigation";

export default async function CoverLetterEditPage({
  params,
}: {
  params: Promise<{ coverLetterId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { coverLetterId } = await params;
  const [coverLetter, applications] = await Promise.all([
    getCoverLetterById(session.profile.id, coverLetterId, session.isDemo),
    getMyApplications(session.profile.id, session.isDemo),
  ]);

  if (!coverLetter) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title={coverLetter.title} description="Editing cover letter" />
      <CoverLetterEditor coverLetter={coverLetter} applications={applications} />
    </main>
  );
}
