"use client";

import { Button } from "@ez/ui";
import { AlertTriangle } from "lucide-react";
import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <AlertTriangle className="size-10 text-warning" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          Elizabeth ran into a problem preparing this page. Let&apos;s try that again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
