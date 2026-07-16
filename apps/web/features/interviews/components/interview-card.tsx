import { formatInterviewDateTime } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import type { Interview } from "@ez/types";
import { Phone, Terminal, Users, Video } from "lucide-react";
import Link from "next/link";

const TYPE_ICON: Record<Interview["interviewType"], typeof Phone> = {
  phone: Phone,
  video: Video,
  onsite: Users,
  technical: Terminal,
};

const STATUS_BADGE: Record<Interview["status"], "neutral" | "interview" | "success"> = {
  scheduled: "interview",
  completed: "success",
  cancelled: "neutral",
};

export function InterviewCard({ interview }: { interview: Interview }) {
  const job = interview.application?.job;
  const Icon = TYPE_ICON[interview.interviewType];

  return (
    <Link href={`/interviews/${interview.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-display text-base font-semibold text-foreground">
              {job?.title ?? "Interview"}
            </p>
            <p className="text-sm text-muted-foreground">
              {job?.company ?? "Unknown company"} · {formatInterviewDateTime(interview.scheduledAt)}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[interview.status]}>{interview.status}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
