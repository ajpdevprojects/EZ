import { ResumeEditor } from "@/features/resume/components/resume-editor";
import { getResumeById } from "@/features/resume/data";
import { getCurrentSession } from "@/lib/session";
import { PageHeader } from "@ez/ui";
import { notFound, redirect } from "next/navigation";

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { resumeId } = await params;
  const resume = await getResumeById(session.profile.id, resumeId, session.isDemo);

  if (!resume) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title={resume.title} description="Editing resume" />
      <ResumeEditor resume={resume} />
    </main>
  );
}
