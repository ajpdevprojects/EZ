"use client";

import { dismissJobRecommendationAction } from "@/features/jobs/actions";
import { JobCard } from "@/features/jobs/components/job-card";
import { toast } from "@ez/ui";
import type { Job } from "@ez/types";
import * as React from "react";

export function DismissibleJobCard({
  job,
  matchScore,
  matchReason,
}: {
  job: Job;
  matchScore?: number;
  matchReason?: string;
}) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [, startTransition] = React.useTransition();

  function handleDismiss() {
    setIsDismissed(true);
    startTransition(async () => {
      const result = await dismissJobRecommendationAction(job.id);
      if (result.error) {
        setIsDismissed(false);
        toast({ title: "Couldn't dismiss this", description: result.error, variant: "error" });
        return;
      }
      toast({ title: "Got it — I'll show you fewer opportunities like this.", variant: "success" });
    });
  }

  if (isDismissed) return null;

  return <JobCard job={job} matchScore={matchScore} matchReason={matchReason} onDismiss={handleDismiss} />;
}
