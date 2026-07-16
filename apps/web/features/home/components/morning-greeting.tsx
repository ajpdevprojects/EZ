import { buildDailyBriefingSummary } from "@ez/lib";
import { Sparkles } from "lucide-react";

export function MorningGreeting({
  greetingName,
  newOpportunitiesCount,
  topOpportunity,
  upcomingInterviewCount,
  staleApplicationCount,
  unreadRecruiterEmailCount,
}: {
  greetingName: string;
  newOpportunitiesCount: number;
  topOpportunity: { title: string; company: string; score: number } | null;
  upcomingInterviewCount: number;
  staleApplicationCount: number;
  unreadRecruiterEmailCount: number;
}) {
  const summary = buildDailyBriefingSummary({
    greetingName,
    newJobsCount: newOpportunitiesCount,
    topOpportunity,
    upcomingInterviewCount,
    staleApplicationCount,
    unreadRecruiterEmailCount,
  });

  return (
    <div className="flex items-start gap-3 rounded-3xl border border-primary/30 bg-primary/10 p-4">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{summary.greeting}</p>
        <p className="text-sm text-muted-foreground">{summary.highlights.join(" ")}</p>
      </div>
    </div>
  );
}
