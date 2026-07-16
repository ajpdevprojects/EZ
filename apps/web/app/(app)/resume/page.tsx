import { getMyApplications } from "@/features/applications/data";
import { NewResumeButton } from "@/features/resume/components/new-resume-button";
import { ResumeCard } from "@/features/resume/components/resume-card";
import { getMyResumes } from "@/features/resume/data";
import { getCurrentSession } from "@/lib/session";
import { computeResumePerformance } from "@ez/lib";
import { EmptyState, PageHeader } from "@ez/ui";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ResumePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const [resumes, applications] = await Promise.all([
    getMyResumes(session.profile.id, session.isDemo),
    getMyApplications(session.profile.id, session.isDemo),
  ]);
  const performance = computeResumePerformance(applications);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Resumes" description="Build and manage every version of your resume." actions={<NewResumeButton />} />

      <div className="flex flex-col gap-3">
        {resumes.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" aria-hidden="true" />}
            title="No resumes yet"
            description="Create your first resume to start applying with confidence."
          />
        ) : (
          resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} performance={performance[resume.id]} />
          ))
        )}
      </div>
    </main>
  );
}
