"use client";

import { type SignUpInput, signUpSchema } from "@ez/lib";
import { Button, Input, Label } from "@ez/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { signUpAction } from "../actions";

export function SignUpForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formMessage, setFormMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: SignUpInput) {
    setFormError(null);
    setFormMessage(null);
    const result = await signUpAction(data);
    if (result?.error) setFormError(result.error);
    else if (result?.message) setFormMessage(result.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          leadingIcon={<User className="size-4" aria-hidden="true" />}
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          leadingIcon={<Mail className="size-4" aria-hidden="true" />}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          leadingIcon={<Lock className="size-4" aria-hidden="true" />}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          leadingIcon={<Lock className="size-4" aria-hidden="true" />}
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      {formMessage && (
        <p role="status" className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
          {formMessage}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="justify-between">
        {isSubmitting ? "Creating your account…" : "Create account"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
