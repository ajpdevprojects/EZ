"use client";

import { createClient } from "@ez/lib/supabase/client";
import { Button, EzWordmark } from "@ez/ui";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { resendConfirmationAction } from "../actions";

type Status = "processing" | "error" | "invalid";

/**
 * Supabase's default email-confirmation and password-recovery links redirect
 * back with the session (or an error) encoded in the URL *hash* fragment —
 * e.g. `#access_token=...&type=signup` or `#error=access_denied&error_code=
 * otp_expired`. Fragments are never sent to the server, so no server
 * component or route handler can ever see them; only client-side JS running
 * on the page they land on can read `window.location.hash`. This is that
 * page.
 */
export function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";

  const [status, setStatus] = React.useState<Status>("processing");
  const [errorDescription, setErrorDescription] = React.useState<string | null>(null);
  const [resendEmail, setResendEmail] = React.useState("");
  const [resendState, setResendState] = React.useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [resendError, setResendError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function processRedirectHash() {
      // Yield a tick first so every branch below sets state from within an
      // async continuation rather than the effect's synchronous body.
      await Promise.resolve();
      if (cancelled) return;

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);

      const error = params.get("error");
      const description = params.get("error_description");

      if (error) {
        setStatus("error");
        setErrorDescription(
          description ? description.replace(/\+/g, " ") : "This link is invalid or has expired.",
        );
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      const supabase = accessToken && refreshToken ? createClient() : null;
      if (!accessToken || !refreshToken || !supabase) {
        setStatus("invalid");
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled) return;

      if (sessionError) {
        setStatus("error");
        setErrorDescription(sessionError.message);
        return;
      }

      // Clear the token hash from the URL before navigating so a
      // back/forward or copy-paste never re-exposes it.
      window.history.replaceState(null, "", window.location.pathname);

      const destination = type === "recovery" ? "/reset-password" : next;
      router.replace(destination);
      router.refresh();
    }

    processRedirectHash().catch((thrown: unknown) => {
      if (cancelled) return;
      setStatus("error");
      setErrorDescription(thrown instanceof Error ? thrown.message : "Something went wrong.");
    });

    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount to process the redirect fragment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendState("sending");
    setResendError(null);
    const result = await resendConfirmationAction(resendEmail);
    if (result.error) {
      setResendState("error");
      setResendError(result.error);
      return;
    }
    setResendState("sent");
  }

  if (status === "processing") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Confirming…</p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <EzWordmark className="h-10 w-auto" />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Nothing to confirm here
          </h1>
          <p className="text-sm text-muted-foreground">
            This page only works when you arrive from a link in an EZ email.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          That link expired
        </h1>
        <p className="text-sm text-muted-foreground">{errorDescription}</p>
      </div>

      {resendState === "sent" ? (
        <p role="status" className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
          Check your inbox for a fresh link.
        </p>
      ) : (
        <form onSubmit={handleResend} className="flex w-full flex-col gap-3">
          <input
            type="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {resendError && (
            <p role="alert" className="text-sm text-destructive">
              {resendError}
            </p>
          )}
          <Button type="submit" size="lg" disabled={resendState === "sending"}>
            {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
          </Button>
        </form>
      )}

      <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </main>
  );
}
