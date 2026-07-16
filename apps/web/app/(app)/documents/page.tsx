import { CoverLetterCard } from "@/features/documents/components/cover-letter-card";
import { NewCoverLetterButton } from "@/features/documents/components/new-cover-letter-button";
import { UploadedFilesSection } from "@/features/documents/components/uploaded-files-section";
import { getMyCoverLetters, getMyUploadedFiles } from "@/features/documents/data";
import { getMyResumes } from "@/features/resume/data";
import { getCurrentSession } from "@/lib/session";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@ez/ui";
import { FileText, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const [resumes, coverLetters, files] = await Promise.all([
    getMyResumes(session.profile.id, session.isDemo),
    getMyCoverLetters(session.profile.id, session.isDemo),
    getMyUploadedFiles(session.profile.id, session.isDemo),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Documents Center" description="Every resume, letter, and file, all in one place." />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Resumes</h2>
        <Link href="/resume">
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">
                {resumes.length === 0 ? "Create your first resume" : `${resumes.length} resume${resumes.length === 1 ? "" : "s"}`}
              </span>
              <Badge variant="neutral">Manage</Badge>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Cover letters</h2>
          <NewCoverLetterButton />
        </div>
        {coverLetters.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText className="size-6" aria-hidden="true" />}
            title="No cover letters yet"
            description="Create one tailored to your next application."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {coverLetters.map((letter) => (
              <CoverLetterCard key={letter.id} coverLetter={letter} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Uploaded files</h2>
        <UploadedFilesSection userId={session.profile.id} files={files} />
      </section>
    </main>
  );
}
