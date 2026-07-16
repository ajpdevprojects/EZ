"use client";

import { signOutAction } from "@/features/auth/actions";
import { Button } from "@ez/ui";
import { LogOut } from "lucide-react";
import * as React from "react";

export function SignOutButton() {
  const [isPending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction())}
      className="justify-center gap-2"
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
