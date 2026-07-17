"use server";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";

export interface AuthActionResult {
  error?: string;
  message?: string;
}

/**
 * Derives this deployment's own origin from the incoming request headers so
 * emailRedirectTo/redirectTo links always point back at this app (not
 * whatever Site URL happens to be configured in the Supabase dashboard).
 * Works locally and on Vercel, where x-forwarded-* is set by the platform.
 */
async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = forwardedProto ?? (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signInAction(
  input: z.infer<typeof signInSchema>,
): Promise<AuthActionResult | undefined> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Sign in isn't available yet — Supabase hasn't been configured." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[signInAction] signInWithPassword failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return { error: error.message };
  }

  console.error("[signInAction] signInWithPassword succeeded", {
    userId: data.user?.id,
    hasSession: Boolean(data.session),
  });

  redirect("/home");
}

export async function signUpAction(
  input: z.infer<typeof signUpSchema>,
): Promise<AuthActionResult | undefined> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Account creation isn't available yet — Supabase hasn't been configured." };
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) return { error: error.message };

  // When email confirmation is required, Supabase returns a user with no
  // active session — there's nothing to redirect into yet. Tell the person
  // to check their inbox instead of silently landing them on /onboarding
  // without a session (see /auth/confirm for what happens after they click
  // through).
  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account before continuing. The link expires, so sign up again if it doesn't arrive soon.",
    };
  }

  redirect("/onboarding");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/welcome");
}

export async function forgotPasswordAction(
  input: z.infer<typeof forgotPasswordSchema>,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Password reset isn't available yet — Supabase hasn't been configured." };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  // Supabase intentionally doesn't reveal whether the email exists, so we
  // only surface actual delivery/config errors, not "no such account".
  if (error) return { error: error.message };

  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function resendConfirmationAction(email: string): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Resending isn't available yet — Supabase hasn't been configured." };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/onboarding` },
  });

  if (error) return { error: error.message };

  return { message: "Check your inbox for a fresh link." };
}

export async function resetPasswordAction(
  input: z.infer<typeof resetPasswordSchema>,
): Promise<AuthActionResult | undefined> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Password reset isn't available yet — Supabase hasn't been configured." };
  }

  // Requires the short-lived recovery session established by /auth/confirm
  // from the password-reset email link; without it there's no user to update.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one and try again." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/home");
}

export type OAuthProvider = "google" | "apple" | "linkedin_oidc";
