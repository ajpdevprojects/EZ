import { formatRelativeTime, formatSalaryRange } from "@ez/lib";
import { Badge, Card, CardContent, CardHeader } from "@ez/ui";
import type { Job } from "@ez/types";
import { Bookmark, Briefcase, X } from "lucide-react";
import Link from "next/link";
import { EMPLOYMENT_TYPE_LABEL, SENIORITY_LABEL } from "../labels";

export interface JobCardProps {
  job: Job;
  saved?: boolean;
  onToggleSave?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  matchScore?: number;
  matchReason?: string;
}

export function JobCard({ job, saved = false, onToggleSave, onDismiss, matchScore, matchReason }: JobCardProps) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <Link href={`/jobs/${job.id}`} className="flex flex-1 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Briefcase className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-base font-semibold text-foreground">{job.title}</span>
            <span className="text-sm text-muted-foreground">
              {job.company} · {job.isRemote ? "Remote" : (job.location ?? "On-site")}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleSave && (
            <button
              type="button"
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved jobs" : "Save job"}
              onClick={() => onToggleSave(job.id)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <Bookmark className="size-4" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              aria-label={`Not interested in ${job.title} at ${job.company}`}
              onClick={() => onDismiss(job.id)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</Badge>
          {job.seniorityLevel && <Badge variant="neutral">{SENIORITY_LABEL[job.seniorityLevel]}</Badge>}
          {typeof matchScore === "number" && <Badge variant="recommended">{matchScore}% match</Badge>}
        </div>
        {matchReason && <p className="text-xs text-muted-foreground">{matchReason}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{salary ?? "Salary not disclosed"}</span>
          <span>{formatRelativeTime(job.postedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
