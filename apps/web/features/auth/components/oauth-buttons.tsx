"use client";

import { createClient } from "@ez/lib/supabase/client";
import { Button, toast } from "@ez/ui";
import * as React from "react";
import type { OAuthProvider } from "../actions";

const PROVIDERS: Array<{ id: OAuthProvider; label: string; icon: React.ReactNode }> = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.35 11.1h-9.17v2.98h5.24c-.23 1.4-1.6 4.11-5.24 4.11-3.15 0-5.72-2.6-5.72-5.8s2.57-5.8 5.72-5.8c1.79 0 2.99.76 3.68 1.42l2.51-2.42C16.96 4.03 14.7 3 12.18 3 6.98 3 2.76 7.22 2.76 12.4s4.22 9.4 9.42 9.4c5.44 0 9.04-3.83 9.04-9.22 0-.62-.07-1.09-.15-1.48Z"
        />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.36 1.43c0 1.14-.42 2.2-1.15 3.02-.83.93-2.15 1.65-3.28 1.55-.14-1.1.44-2.26 1.15-3 .84-.9 2.28-1.6 3.28-1.57ZM19.7 17.1c-.5 1.15-.74 1.66-1.38 2.67-.9 1.4-2.16 3.15-3.73 3.16-1.39.02-1.75-.9-3.64-.9-1.88 0-2.29.88-3.68.92-1.57.06-2.77-1.5-3.67-2.9-2.02-3.13-2.24-6.8-.98-8.75.89-1.4 2.3-2.22 3.63-2.22 1.36 0 2.21.92 3.34.92 1.09 0 1.75-.92 3.32-.92 1.03 0 2.12.56 2.9 1.53-2.55 1.4-2.14 5.03.9 5.99Z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin_oidc",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.25h4.5V23H.24V8.25ZM8.5 8.25h4.32v2.02h.06c.6-1.14 2.07-2.34 4.26-2.34 4.55 0 5.39 3 5.39 6.9V23h-4.5v-6.99c0-1.67-.03-3.81-2.32-3.81-2.33 0-2.69 1.82-2.69 3.7V23H8.5V8.25Z"
        />
      </svg>
    ),
  },
];

export function OAuthButtons() {
  const [pendingProvider, setPendingProvider] = React.useState<OAuthProvider | null>(null);

  async function handleSignIn(provider: OAuthProvider) {
    const supabase = createClient();
    if (!supabase) {
      toast({
        title: "Not available yet",
        description: "Sign-in with providers requires Supabase to be configured.",
        variant: "warning",
      });
      return;
    }

    setPendingProvider(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      toast({ title: "Couldn't sign in", description: error.message, variant: "error" });
      setPendingProvider(null);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="secondary"
          size="sm"
          disabled={pendingProvider !== null}
          onClick={() => handleSignIn(provider.id)}
          className="flex-col gap-1.5 h-16 rounded-2xl"
        >
          {provider.icon}
          <span className="text-xs">{provider.label}</span>
        </Button>
      ))}
    </div>
  );
}
