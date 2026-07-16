"use client";

import { deleteUploadedFileAction } from "@/features/documents/actions";
import type { UploadedFile } from "@/features/documents/data";
import { Card, CardContent, EmptyState, toast } from "@ez/ui";
import { FileStack, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FileUpload } from "./file-upload";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadedFilesSection({ userId, files }: { userId: string; files: UploadedFile[] }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleDelete(path: string) {
    startTransition(async () => {
      const result = await deleteUploadedFileAction(path);
      if (result.error) toast({ title: "Couldn't delete file", description: result.error, variant: "error" });
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <FileUpload userId={userId} onUploaded={() => router.refresh()} />
      {files.length === 0 ? (
        <EmptyState
          icon={<FileStack className="size-6" aria-hidden="true" />}
          title="No files uploaded yet"
          description="Upload certificates, transcripts, or anything else worth keeping with your job search."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {files.map((file) => (
            <Card key={file.path}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(file.sizeBytes)}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${file.name}`}
                  disabled={isPending}
                  onClick={() => handleDelete(file.path)}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
