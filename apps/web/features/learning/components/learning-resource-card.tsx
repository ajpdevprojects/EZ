"use client";

import { updateLearningProgressAction } from "@/features/learning/actions";
import { Badge, Button, Card, CardContent, toast } from "@ez/ui";
import type { LearningProgressStatus, LearningResource } from "@ez/types";
import { BookOpen, Check, PlayCircle } from "lucide-react";
import * as React from "react";

const TYPE_LABEL: Record<LearningResource["resourceType"], string> = {
  article: "Article",
  video: "Video",
  course: "Course",
};

const STATUS_LABEL: Record<LearningProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export function LearningResourceCard({
  resource,
  status,
}: {
  resource: LearningResource;
  status: LearningProgressStatus;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [currentStatus, setCurrentStatus] = React.useState(status);

  function handleSetStatus(next: LearningProgressStatus) {
    startTransition(async () => {
      const result = await updateLearningProgressAction(resource.id, next);
      if (result.error) {
        toast({ title: "Couldn't update progress", description: result.error, variant: "error" });
        return;
      }
      setCurrentStatus(next);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-display text-base font-semibold text-foreground">{resource.title}</p>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{TYPE_LABEL[resource.resourceType]}</Badge>
          {resource.durationMinutes && <Badge variant="neutral">{resource.durationMinutes} min</Badge>}
          <Badge variant={currentStatus === "completed" ? "success" : "recommended"}>
            {STATUS_LABEL[currentStatus]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentStatus !== "in_progress" && currentStatus !== "completed" && (
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleSetStatus("in_progress")}
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              Start
            </Button>
          )}
          {currentStatus !== "completed" && (
            <Button size="sm" disabled={isPending} onClick={() => handleSetStatus("completed")}>
              <Check className="size-4" aria-hidden="true" />
              Mark complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
