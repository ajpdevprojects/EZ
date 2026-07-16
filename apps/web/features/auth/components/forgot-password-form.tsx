"use client";

import { type ForgotPasswordInput, forgotPasswordSchema } from "@ez/lib";
import { Button, Input, Label } from "@ez/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sentMessage, setSentMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setFormError(null);
    const result = await forgotPasswordAction(data);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSentMessage(result.message ?? "Check your email for a reset link.");
  }

  if (sentMessage) {
    return (
      <p role="status" className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
        {sentMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          leadingIcon={<Mail className="size-4" aria-hidden="true" />}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="justify-between">
        {isSubmitting ? "Sending…" : "Send reset link"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
