import { Button } from "@ez/ui";
import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Compass className="size-10 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist, or may have moved. Let&apos;s get you back on track.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to EZ</Link>
      </Button>
    </main>
  );
}
