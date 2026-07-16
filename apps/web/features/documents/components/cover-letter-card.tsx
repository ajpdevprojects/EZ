"use client";

import { deleteCoverLetterAction } from "@/features/documents/actions";
import { formatRelativeTime } from "@ez/lib";
import { Button, Card, CardContent, toast } from "@ez/ui";
import type { CoverLetter } from "@ez/types";
import { MessageSquareText, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function CoverLetterCard({ coverLetter }: { coverLetter: CoverLetter }) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete "${coverLetter.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteCoverLetterAction(coverLetter.id);
      if (result.error) toast({ title: "Couldn't delete", description: result.error, variant: "error" });
    });
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Link href={`/documents/cover-letters/${coverLetter.id}`} className="flex flex-1 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <MessageSquareText className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-base font-semibold text-foreground">{coverLetter.title}</span>
            <span className="text-sm text-muted-foreground">
              Updated {formatRelativeTime(coverLetter.updatedAt)}
              {coverLetter.application?.job ? ` · ${coverLetter.application.job.company}` : ""}
            </span>
          </span>
        </Link>
        <Button variant="tertiary" size="icon" disabled={isPending} aria-label="Delete" onClick={handleDelete}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}
