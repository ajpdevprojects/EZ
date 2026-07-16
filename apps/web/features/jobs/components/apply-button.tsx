"use client";

import { applyToJobAction } from "@/features/applications/actions";
import { Button, toast } from "@ez/ui";
import { CheckCircle2 } from "lucide-react";
import * as React from "react";

export function ApplyButton({ jobId }: { jobId: string }) {
  const [isApplied, setIsApplied] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleApply() {
    startTransition(async () => {
      const result = await applyToJobAction(jobId);

      if (result.error) {
        toast({ title: "Couldn't submit application", description: result.error, variant: "error" });
        return;
      }

      setIsApplied(true);
      toast({
        title: result.alreadyApplied ? "Already applied" : "Application submitted",
        description: result.alreadyApplied
          ? "You've already applied to this role — find it in your pipeline."
          : "I've added this to your pipeline and will track it for you.",
        variant: "success",
      });
    });
  }

  if (isApplied) {
    return (
      <Button size="lg" variant="secondary" disabled className="w-full justify-center gap-2">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Applied
      </Button>
    );
  }

  return (
    <Button size="lg" className="w-full" disabled={isPending} onClick={handleApply}>
      {isPending ? "Submitting…" : "Apply Now"}
    </Button>
  );
}
