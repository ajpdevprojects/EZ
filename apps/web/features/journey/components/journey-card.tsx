import { formatJourneyDuration, sortJourneyMilestones } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import type { JourneyEntry } from "@/features/journey/data";
import { Briefcase } from "lucide-react";
import Link from "next/link";

export function JourneyCard({ entry }: { entry: JourneyEntry }) {
  const { application, milestones } = entry;
  const job = application.job;
  if (!job) return null;

  const sorted = sortJourneyMilestones(milestones);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const duration = first && last ? formatJourneyDuration(first.occurredAt, last.occurredAt) : null;

  return (
    <Link href={`/journey/${application.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Briefcase className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-display text-base font-semibold text-foreground">{job.title}</p>
            <p className="text-sm text-muted-foreground">
              {job.company}
              {duration ? ` · ${duration}` : ""}
            </p>
          </div>
          <Badge variant="neutral">{milestones.length} milestones</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
