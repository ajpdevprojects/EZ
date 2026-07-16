"use client";

import { ScheduleInterviewForm } from "@/features/interviews/components/schedule-interview-form";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ez/ui";
import type { Application } from "@ez/types";
import { Plus } from "lucide-react";

export function ScheduleInterviewDialog({ applications }: { applications: Application[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule an interview</DialogTitle>
          <DialogDescription>I&apos;ll track this and remind you before it starts.</DialogDescription>
        </DialogHeader>
        <ScheduleInterviewForm applications={applications} />
      </DialogContent>
    </Dialog>
  );
}
