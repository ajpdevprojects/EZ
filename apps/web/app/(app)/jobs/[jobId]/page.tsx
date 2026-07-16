import { getApplicationForJob } from "@/features/applications/data";
import { TailorCoverLetterButton } from "@/features/documents/components/tailor-cover-letter-button";
import { ApplyButton } from "@/features/jobs/components/apply-button";
import { JobMatchAnalysisCard } from "@/features/jobs/components/job-match-analysis";
import { SkillGapCard } from "@/features/jobs/components/skill-gap-card";
import { getJobById } from "@/features/jobs/data";
import { EMPLOYMENT_TYPE_LABEL, SENIORITY_LABEL } from "@/features/jobs/labels";
import { getMyResumes } from "@/features/resume/data";
import { getCurrentSession } from "@/lib/session";
import { computeSkillGap, formatSalaryRange } from "@ez/lib";
import { Badge } from "@ez/ui";
import { Briefcase, ExternalLink, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const { jobId } = await params;
  const [job, application, resumes] = await Promise.all([
    getJobById(jobId),
    getApplicationForJob(session.profile.id, jobId, session.isDemo),
    getMyResumes(session.profile.id, session.isDemo),
  ]);

  if (!job) notFound();

  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
  const primaryResume = resumes.find((resume) => resume.isPrimary) ?? resumes[0];
  const skillGap = computeSkillGap(primaryResume?.content.skills ?? [], job.skills);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Briefcase className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold text-foreground">{job.title}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {job.company}
            <span aria-hidden="true">·</span>
            <MapPin className="size-3.5" aria-hidden="true" />
            {job.isRemote ? "Remote" : (job.location ?? "On-site")}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</Badge>
        {job.seniorityLevel && <Badge variant="neutral">{SENIORITY_LABEL[job.seniorityLevel]}</Badge>}
        {salary && <Badge variant="new">{salary}</Badge>}
      </div>

      {job.skills.length > 0 && <SkillGapCard skillGap={skillGap} />}

      <JobMatchAnalysisCard
        jobId={job.id}
        initialScore={application?.matchScore ?? null}
        initialReason={application?.matchReason ?? null}
      />

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
      </section>

      {job.skills.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="recommended">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <ApplyButton jobId={job.id} initiallyApplied={Boolean(application && application.status !== "saved")} />
        {job.source !== "internal" && job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View original posting on {job.source === "remoteok" ? "RemoteOK" : "Remotive"}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
        {application && (
          <TailorCoverLetterButton applicationId={application.id} jobTitle={job.title} company={job.company} />
        )}
      </div>
    </main>
  );
}
