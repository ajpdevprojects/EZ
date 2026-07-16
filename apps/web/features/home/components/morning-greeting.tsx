import { buildDailyBriefingSummary } from "@ez/lib";
import { Sparkles } from "lucide-react";

export function MorningGreeting({
  greetingName,
  jobsDiscoveredGlobally,
  duplicatesRemovedGlobally,
  jobsShortlistedCount,
  topOpportunity,
  upcomingInterviewCount,
  newInterviewsScheduledCount,
  staleApplicationCount,
  unreadRecruiterEmailCount,
}: {
  greetingName: string;
  jobsDiscoveredGlobally: number;
  duplicatesRemovedGlobally: number;
  jobsShortlistedCount: number;
  topOpportunity: { title: string; company: string; score: number } | null;
  upcomingInterviewCount: number;
  newInterviewsScheduledCount: number;
  staleApplicationCount: number;
  unreadRecruiterEmailCount: number;
}) {
  const summary = buildDailyBriefingSummary({
    greetingName,
    jobsDiscoveredGlobally,
    duplicatesRemovedGlobally,
    jobsShortlistedCount,
    topOpportunity,
    upcomingInterviewCount,
    newInterviewsScheduledCount,
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
