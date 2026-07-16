"use client";

import { updateJourneyReflectionAction } from "@/features/journey/actions";
import { Button, Textarea, toast } from "@ez/ui";
import * as React from "react";

export function ReflectionEditor({ applicationId, initialValue }: { applicationId: string; initialValue: string }) {
  const [value, setValue] = React.useState(initialValue);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateJourneyReflectionAction(applicationId, value);
    setIsSaving(false);
    if (result.error) toast({ title: "Couldn't save reflection", description: result.error, variant: "error" });
    else toast({ title: "Reflection saved", variant: "success" });
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="How did this journey feel? What would you do differently next time? (optional, just for you)"
      />
      <Button size="sm" variant="secondary" className="self-start" disabled={isSaving} onClick={handleSave}>
        {isSaving ? "Saving…" : "Save reflection"}
      </Button>
    </div>
  );
}
