"use client";

import { cancelInterviewAction, markInterviewCompletedAction } from "@/features/interviews/actions";
import { Button, toast } from "@ez/ui";
import type { InterviewStatus } from "@ez/types";
import { CheckCircle2, XCircle } from "lucide-react";
import * as React from "react";

export function InterviewActions({ interviewId, status }: { interviewId: string; status: InterviewStatus }) {
  const [isPending, startTransition] = React.useTransition();

  if (status !== "scheduled") return null;

  function handleComplete() {
    startTransition(async () => {
      const result = await markInterviewCompletedAction(interviewId);
      if (result.error) toast({ title: "Couldn't update interview", description: result.error, variant: "error" });
      else toast({ title: "Marked as completed", variant: "success" });
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelInterviewAction(interviewId);
      if (result.error) toast({ title: "Couldn't cancel interview", description: result.error, variant: "error" });
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button disabled={isPending} onClick={handleComplete}>
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Mark as completed
      </Button>
      <Button variant="secondary" disabled={isPending} onClick={handleCancel}>
        <XCircle className="size-4" aria-hidden="true" />
        Cancel
      </Button>
    </div>
  );
}
