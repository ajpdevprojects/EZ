"use client";

import { draftCoverLetterAction, updateCoverLetterAction } from "@/features/documents/actions";
import { Button, Input, Label, Select, Textarea, toast } from "@ez/ui";
import type { Application, CoverLetter } from "@ez/types";
import { Sparkles } from "lucide-react";
import * as React from "react";

export function CoverLetterEditor({
  coverLetter,
  applications,
}: {
  coverLetter: CoverLetter;
  applications: Application[];
}) {
  const [title, setTitle] = React.useState(coverLetter.title);
  const [applicationId, setApplicationId] = React.useState(coverLetter.applicationId ?? "");
  const [content, setContent] = React.useState(coverLetter.content);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDrafting, setIsDrafting] = React.useState(false);

  const selectedApplication = applications.find((application) => application.id === applicationId);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateCoverLetterAction(coverLetter.id, {
      title,
      content,
      applicationId: applicationId || null,
    });
    setIsSaving(false);
    if (result.error) toast({ title: "Couldn't save", description: result.error, variant: "error" });
    else toast({ title: "Cover letter saved", variant: "success" });
  }

  async function handleDraft() {
    if (!selectedApplication?.job) {
      toast({ title: "Choose an application first", description: "Elizabeth needs to know which role to write for.", variant: "warning" });
      return;
    }

    setIsDrafting(true);
    const result = await draftCoverLetterAction(
      selectedApplication.job.title,
      selectedApplication.job.company,
      selectedApplication.matchReason ?? "",
    );
    setIsDrafting(false);

    if (result.error) toast({ title: "Draft unavailable", description: result.error, variant: "warning" });
    else if (result.draft) setContent(result.draft);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cover-letter-title">Title</Label>
        <Input id="cover-letter-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cover-letter-application">Linked application (optional)</Label>
        <Select
          id="cover-letter-application"
          value={applicationId}
          onChange={(event) => setApplicationId(event.target.value)}
        >
          <option value="">None</option>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.job?.title} · {application.job?.company}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="cover-letter-content">Content</Label>
          <Button type="button" variant="tertiary" size="sm" disabled={isDrafting} onClick={handleDraft}>
            <Sparkles className="size-4" aria-hidden="true" />
            {isDrafting ? "Drafting…" : "Draft with Elizabeth"}
          </Button>
        </div>
        <Textarea
          id="cover-letter-content"
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your cover letter, or generate a draft to start from…"
        />
      </div>

      <Button size="lg" disabled={isSaving} onClick={handleSave} className="self-start">
        {isSaving ? "Saving…" : "Save cover letter"}
      </Button>
    </div>
  );
}
