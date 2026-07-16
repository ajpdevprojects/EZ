"use server";

import { signInSchema, signUpSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { redirect } from "next/navigation";
import type { z } from "zod";

export interface AuthActionResult {
  error: string;
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

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: error.message };

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

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) return { error: error.message };

  redirect("/onboarding");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/welcome");
}

export type OAuthProvider = "google" | "apple" | "linkedin_oidc";
