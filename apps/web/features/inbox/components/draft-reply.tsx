"use client";

import { draftRecruiterReplyAction } from "@/features/inbox/actions";
import { Button, Card, CardContent, toast } from "@ez/ui";
import { Mail, Sparkles } from "lucide-react";
import * as React from "react";

export function DraftReply({ emailId, initialDraft }: { emailId: string; initialDraft: string | null }) {
  const [draft, setDraft] = React.useState(initialDraft);
  const [isDrafting, setIsDrafting] = React.useState(false);

  async function handleDraft() {
    setIsDrafting(true);
    const result = await draftRecruiterReplyAction(emailId);
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
        {isDrafting ? "Drafting…" : draft ? "Redraft reply" : "Draft a reply"}
      </Button>
      {draft && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="whitespace-pre-line text-sm text-foreground">{draft}</p>
            <p className="text-xs text-muted-foreground">
              Review before sending — I never send email on your behalf.
            </p>
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
