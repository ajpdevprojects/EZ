import { formatRelativeTime } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import type { Application, ApplicationStatus } from "@ez/types";
import { Briefcase } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not moving forward",
  withdrawn: "Withdrawn",
};

const STATUS_BADGE_VARIANT: Record<ApplicationStatus, "applied" | "interview" | "offer" | "neutral" | "success"> = {
  saved: "neutral",
  applied: "applied",
  interviewing: "interview",
  offer: "offer",
  hired: "success",
  rejected: "neutral",
  withdrawn: "neutral",
};

export function ApplicationCard({ application }: { application: Application }) {
  const job = application.job;
  if (!job) return null;

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Briefcase className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-display text-base font-semibold text-foreground">{job.title}</p>
            <p className="text-sm text-muted-foreground">
              {job.company} · {formatRelativeTime(application.updatedAt)}
            </p>
          </div>
          <Badge variant={STATUS_BADGE_VARIANT[application.status]}>
            {STATUS_LABEL[application.status]}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
