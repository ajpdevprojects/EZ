"use client";

import { createCoverLetterAction } from "@/features/documents/actions";
import { Button, toast } from "@ez/ui";
import { Plus } from "lucide-react";
import * as React from "react";

export function NewCoverLetterButton() {
  const [isPending, startTransition] = React.useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createCoverLetterAction();
      if (result?.error) {
        toast({ title: "Couldn't create cover letter", description: result.error, variant: "error" });
      }
    });
  }

  return (
    <Button size="sm" disabled={isPending} onClick={handleCreate}>
      <Plus className="size-4" aria-hidden="true" />
      New cover letter
    </Button>
  );
}
