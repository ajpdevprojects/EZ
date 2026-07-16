"use client";

import { createResumeAction } from "@/features/resume/actions";
import { Button, toast } from "@ez/ui";
import { Plus } from "lucide-react";
import * as React from "react";

export function NewResumeButton() {
  const [isPending, startTransition] = React.useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createResumeAction("Untitled resume");
      if (result?.error) {
        toast({ title: "Couldn't create resume", description: result.error, variant: "error" });
      }
    });
  }

  return (
    <Button size="sm" disabled={isPending} onClick={handleCreate}>
      <Plus className="size-4" aria-hidden="true" />
      New resume
    </Button>
  );
}
