"use client";

import { AddEmailForm } from "@/features/inbox/components/add-email-form";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ez/ui";
import { Plus } from "lucide-react";
import * as React from "react";

export function AddEmailDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Add email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a recruiter email</DialogTitle>
          <DialogDescription>
            Paste in an email you received and I&apos;ll organize it into your pipeline.
          </DialogDescription>
        </DialogHeader>
        <AddEmailForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
