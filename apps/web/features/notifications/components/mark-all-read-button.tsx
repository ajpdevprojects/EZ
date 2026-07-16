"use client";

import { markAllNotificationsReadAction } from "@/features/notifications/actions";
import { Button, toast } from "@ez/ui";
import { CheckCheck } from "lucide-react";
import * as React from "react";

export function MarkAllReadButton() {
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.error) toast({ title: "Couldn't update notifications", description: result.error, variant: "error" });
    });
  }

  return (
    <Button size="sm" variant="secondary" disabled={isPending} onClick={handleClick}>
      <CheckCheck className="size-4" aria-hidden="true" />
      Mark all read
    </Button>
  );
}
