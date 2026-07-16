import "server-only";

import { DEMO_COVER_LETTERS, mapApplication, mapCoverLetter, mapJob } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { CoverLetter } from "@ez/types";

export interface UploadedFile {
  name: string;
  path: string;
  sizeBytes: number | null;
  updatedAt: string | null;
}

function mapCoverLetterRow(
  row: Record<string, unknown> & {
    applications?: (Record<string, unknown> & { jobs?: Parameters<typeof mapJob>[0] | null }) | null;
  },
): CoverLetter {
  const { applications: applicationRow, ...coverLetterRow } = row;
  if (!applicationRow) return mapCoverLetter(coverLetterRow as Parameters<typeof mapCoverLetter>[0]);

  const { jobs: jobRow, ...applicationOnly } = applicationRow;
  return mapCoverLetter(
    coverLetterRow as Parameters<typeof mapCoverLetter>[0],
    applicationOnly as Parameters<typeof mapApplication>[0],
    jobRow ?? undefined,
  );
}

export async function getMyCoverLetters(userId: string, isDemo: boolean): Promise<CoverLetter[]> {
  if (isDemo) return DEMO_COVER_LETTERS;

  const supabase = await createClient();
  if (!supabase) return DEMO_COVER_LETTERS;

  const { data } = await supabase
    .from("cover_letters")
    .select("*, applications(*, jobs(*))")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => mapCoverLetterRow(row as never));
}

export async function getCoverLetterById(
  userId: string,
  coverLetterId: string,
  isDemo: boolean,
): Promise<CoverLetter | null> {
  const letters = await getMyCoverLetters(userId, isDemo);
  return letters.find((letter) => letter.id === coverLetterId) ?? null;
}

export async function getMyUploadedFiles(userId: string, isDemo: boolean): Promise<UploadedFile[]> {
  if (isDemo) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from("documents").list(userId, {
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error || !data) return [];

  return data
    .filter((file) => file.id !== null)
    .map((file) => ({
      name: file.name,
      path: `${userId}/${file.name}`,
      sizeBytes: (file.metadata as { size?: number } | null)?.size ?? null,
      updatedAt: file.updated_at ?? null,
    }));
}
