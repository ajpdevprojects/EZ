"use client";

import { deleteResumeAction, duplicateResumeAction, setPrimaryResumeAction } from "@/features/resume/actions";
import { formatRelativeTime, type ResumePerformance } from "@ez/lib";
import { Badge, Button, Card, CardContent, toast } from "@ez/ui";
import type { Resume } from "@ez/types";
import { Copy, FileText, Star, Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function ResumeCard({ resume, performance }: { resume: Resume; performance?: ResumePerformance }) {
  const [isPending, startTransition] = React.useTransition();

  function handleSetPrimary() {
    startTransition(async () => {
      const result = await setPrimaryResumeAction(resume.id);
      if (result.error) toast({ title: "Couldn't update resume", description: result.error, variant: "error" });
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateResumeAction(resume.id);
      if (result.error) toast({ title: "Couldn't duplicate resume", description: result.error, variant: "error" });
      else toast({ title: "Resume duplicated", variant: "success" });
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${resume.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteResumeAction(resume.id);
      if (result.error) toast({ title: "Couldn't delete resume", description: result.error, variant: "error" });
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/resume/${resume.id}`} className="flex flex-1 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-base font-semibold text-foreground">{resume.title}</span>
              <span className="text-sm text-muted-foreground">Updated {formatRelativeTime(resume.updatedAt)}</span>
            </span>
          </Link>
          {resume.isPrimary && <Badge variant="offer">Primary</Badge>}
        </div>
        {performance && performance.applications > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 shrink-0" aria-hidden="true" />
            {performance.applications} {performance.applications === 1 ? "application" : "applications"} ·{" "}
            {performance.interviewRate}% interview rate
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!resume.isPrimary && (
            <Button variant="tertiary" size="sm" disabled={isPending} onClick={handleSetPrimary}>
              <Star className="size-4" aria-hidden="true" />
              Set primary
            </Button>
          )}
          <Button variant="tertiary" size="sm" disabled={isPending} onClick={handleDuplicate}>
            <Copy className="size-4" aria-hidden="true" />
            Duplicate
          </Button>
          <Button variant="tertiary" size="sm" disabled={isPending} onClick={handleDelete}>
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
