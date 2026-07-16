"use client";

import { createClient } from "@ez/lib/supabase/client";
import { Button, EmptyState, toast } from "@ez/ui";
import { Upload } from "lucide-react";
import * as React from "react";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function FileUpload({ userId, onUploaded }: { userId: string; onUploaded: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const supabase = React.useMemo(() => createClient(), []);

  if (!supabase) {
    return (
      <EmptyState
        icon={<Upload className="size-6" aria-hidden="true" />}
        title="File uploads aren't available yet"
        description="Connect Supabase to store certificates, transcripts, and other documents."
      />
    );
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: "File too large", description: "Files must be under 10MB.", variant: "error" });
      return;
    }

    setIsUploading(true);
    const { error } = await supabase!.storage
      .from("documents")
      .upload(`${userId}/${file.name}`, file, { upsert: true });
    setIsUploading(false);

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "error" });
      return;
    }

    toast({ title: "File uploaded", variant: "success" });
    onUploaded();
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="sr-only" onChange={handleFileChange} aria-label="Upload a file" />
      <Button variant="secondary" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" aria-hidden="true" />
        {isUploading ? "Uploading…" : "Upload a file"}
      </Button>
    </div>
  );
}
