import { RECRUITER_EMAIL_CATEGORY_LABEL } from "@/features/inbox/labels";
import { formatRelativeTime } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import type { RecruiterEmail } from "@ez/types";
import { Mail } from "lucide-react";
import Link from "next/link";

const CATEGORY_BADGE_VARIANT: Record<RecruiterEmail["category"], "neutral" | "interview" | "error" | "offer"> = {
  recruiter_outreach: "neutral",
  interview: "interview",
  rejection: "error",
  offer: "offer",
  other: "neutral",
};

export function EmailListItem({ email }: { email: RecruiterEmail }) {
  const isUnread = !email.readAt;

  return (
    <Link href={`/inbox/${email.id}`}>
      <Card className={isUnread ? "border-primary/30 bg-primary/5" : undefined}>
        <CardContent className="flex items-start gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{email.subject}</p>
              {isUnread && <Badge variant="new">New</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {email.fromName ?? email.fromEmail}
              {email.application?.job && <> · {email.application.job.company}</>}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant={CATEGORY_BADGE_VARIANT[email.category]}>
                {RECRUITER_EMAIL_CATEGORY_LABEL[email.category]}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(email.receivedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
