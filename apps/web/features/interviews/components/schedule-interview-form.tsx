"use client";

import { scheduleInterviewAction } from "@/features/interviews/actions";
import { type InterviewInput, interviewSchema } from "@ez/lib";
import { Button, Input, Label, Select, Textarea } from "@ez/ui";
import type { Application } from "@ez/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

const INTERVIEW_TYPE_OPTIONS: Array<{ value: InterviewInput["interviewType"]; label: string }> = [
  { value: "phone", label: "Phone" },
  { value: "video", label: "Video" },
  { value: "onsite", label: "Onsite" },
  { value: "technical", label: "Technical" },
];

export function ScheduleInterviewForm({ applications }: { applications: Application[] }) {
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InterviewInput>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      applicationId: applications[0]?.id ?? "",
      interviewType: "video",
      scheduledAt: "",
      locationOrLink: "",
      notes: "",
    },
  });

  async function onSubmit(data: InterviewInput) {
    setFormError(null);
    const result = await scheduleInterviewAction(data);
    if (result?.error) setFormError(result.error);
  }

  if (applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Apply to a job first, then come back here to schedule an interview for it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="applicationId">Application</Label>
        <Select id="applicationId" {...register("applicationId")}>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.job?.title} · {application.job?.company}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="interviewType">Interview type</Label>
        <Select id="interviewType" {...register("interviewType")}>
          {INTERVIEW_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="scheduledAt">Date and time</Label>
        <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
        {errors.scheduledAt && <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="locationOrLink">Location or link</Label>
        <Input id="locationOrLink" placeholder="Meeting link or address" {...register("locationOrLink")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      {formError && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="justify-between">
        {isSubmitting ? "Scheduling…" : "Schedule interview"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
