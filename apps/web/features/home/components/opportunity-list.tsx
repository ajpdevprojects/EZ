"use client";

import { DismissibleJobCard } from "@/features/jobs/components/dismissible-job-card";
import { Button } from "@ez/ui";
import type { Job, JobMatchSummary } from "@ez/types";
import * as React from "react";

const INITIAL_VISIBLE = 5;

export function OpportunityList({
  jobs,
  matches,
}: {
  jobs: Job[];
  matches: Record<string, JobMatchSummary>;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const visibleJobs = showAll ? jobs : jobs.slice(0, INITIAL_VISIBLE);
  const remaining = jobs.length - visibleJobs.length;

  return (
    <div className="flex flex-col gap-3">
      {visibleJobs.map((job, index) => {
        const match = matches[job.id];
        return (
          <DismissibleJobCard
            key={job.id}
            job={job}
            matchScore={match?.score}
            matchReason={match?.reasons[0]}
            priorityRank={index < 3 ? index + 1 : undefined}
          />
        );
      })}
      {remaining > 0 && (
        <Button type="button" variant="secondary" onClick={() => setShowAll(true)}>
          Show {remaining} more {remaining === 1 ? "opportunity" : "opportunities"}
        </Button>
      )}
    </div>
  );
}
