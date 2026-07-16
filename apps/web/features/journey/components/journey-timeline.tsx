import { JOURNEY_MILESTONE_LABEL, JOURNEY_MILESTONE_ORDER, formatRelativeTime } from "@ez/lib";
import type { JourneyMilestone } from "@ez/types";
import { Check } from "lucide-react";

export function JourneyTimeline({ milestones }: { milestones: JourneyMilestone[] }) {
  const reachedByType = new Map(milestones.map((milestone) => [milestone.type, milestone]));

  return (
    <ol className="flex flex-col">
      {JOURNEY_MILESTONE_ORDER.map((type, index) => {
        const milestone = reachedByType.get(type);
        const isReached = Boolean(milestone);
        const isLast = index === JOURNEY_MILESTONE_ORDER.length - 1;

        return (
          <li key={type} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={
                  isReached
                    ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                }
              >
                {isReached && <Check className="size-3.5" aria-hidden="true" />}
              </span>
              {!isLast && <span className={isReached ? "w-px flex-1 bg-primary" : "w-px flex-1 bg-border"} />}
            </div>
            <div className="flex flex-col pb-6">
              <span className={isReached ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>
                {JOURNEY_MILESTONE_LABEL[type]}
              </span>
              {milestone && (
                <span className="text-xs text-muted-foreground">{formatRelativeTime(milestone.occurredAt)}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
