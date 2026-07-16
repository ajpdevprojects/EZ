import { ApplyButton } from "@/features/jobs/components/apply-button";
import { getJobById } from "@/features/jobs/data";
import { EMPLOYMENT_TYPE_LABEL, SENIORITY_LABEL } from "@/features/jobs/labels";
import { formatSalaryRange } from "@ez/lib";
import { Badge } from "@ez/ui";
import { Briefcase, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJobById(jobId);

  if (!job) notFound();

  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);

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

      <div className="mt-4">
        <ApplyButton jobId={job.id} />
      </div>
    </main>
  );
}
