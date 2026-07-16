"use client";

import { draftFollowUpEmailAction } from "@/features/interviews/actions";
import { Button, Card, CardContent, toast } from "@ez/ui";
import { Mail, Sparkles } from "lucide-react";
import * as React from "react";

export function FollowUpEmail({
  jobTitle,
  company,
  interviewType,
}: {
  jobTitle: string;
  company: string;
  interviewType: string;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const [isDrafting, setIsDrafting] = React.useState(false);

  async function handleDraft() {
    setIsDrafting(true);
    const result = await draftFollowUpEmailAction(jobTitle, company, interviewType);
    setIsDrafting(false);

    if (result.error) {
      toast({ title: "Draft unavailable", description: result.error, variant: "warning" });
      return;
    }
    if (result.draft) setDraft(result.draft);
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    toast({ title: "Copied to clipboard", variant: "success" });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="secondary" size="sm" disabled={isDrafting} onClick={handleDraft} className="self-start">
        <Sparkles className="size-4" aria-hidden="true" />
        {isDrafting ? "Drafting…" : "Draft a thank-you email"}
      </Button>
      {draft && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="whitespace-pre-line text-sm text-foreground">{draft}</p>
            <Button type="button" variant="tertiary" size="sm" className="self-start" onClick={handleCopy}>
              <Mail className="size-4" aria-hidden="true" />
              Copy to send from your email
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
