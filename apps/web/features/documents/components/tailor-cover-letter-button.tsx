"use client";

import { createTailoredCoverLetterAction } from "@/features/documents/actions";
import { Button, toast } from "@ez/ui";
import { MessageSquareText } from "lucide-react";
import * as React from "react";

export function TailorCoverLetterButton({
  applicationId,
  jobTitle,
  company,
}: {
  applicationId: string;
  jobTitle: string;
  company: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createTailoredCoverLetterAction(applicationId, `${company} — ${jobTitle}`);
      if (result?.error) {
        toast({ title: "Couldn't create cover letter", description: result.error, variant: "error" });
      }
    });
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleClick}>
      <MessageSquareText className="size-4" aria-hidden="true" />
      {isPending ? "Creating…" : "Create tailored cover letter"}
    </Button>
  );
}
