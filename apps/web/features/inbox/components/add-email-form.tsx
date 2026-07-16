"use client";

import { addRecruiterEmailAction } from "@/features/inbox/actions";
import { type RecruiterEmailInput, recruiterEmailSchema } from "@ez/lib";
import { Button, Input, Label, Textarea, toast } from "@ez/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";

export function AddEmailForm({ onSaved }: { onSaved?: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecruiterEmailInput>({
    resolver: zodResolver(recruiterEmailSchema),
    defaultValues: { fromName: "", fromEmail: "", subject: "", body: "" },
  });

  async function onSubmit(data: RecruiterEmailInput) {
    const result = await addRecruiterEmailAction(data);
    if (result.error) {
      toast({ title: "Couldn't add this email", description: result.error, variant: "error" });
      return;
    }
    toast({ title: "Email added to your inbox", variant: "success" });
    reset();
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Paste in a recruiter email — I&apos;ll categorize it and link it to the right application automatically.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fromName">Sender name (optional)</Label>
        <Input id="fromName" placeholder="Jordan Blake" {...register("fromName")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fromEmail">Sender email</Label>
        <Input id="fromEmail" type="email" placeholder="jordan@company.com" {...register("fromEmail")} />
        {errors.fromEmail && <p className="text-sm text-destructive">{errors.fromEmail.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...register("subject")} />
        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" rows={6} {...register("body")} />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="justify-between">
        {isSubmitting ? "Adding…" : "Add to inbox"}
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
