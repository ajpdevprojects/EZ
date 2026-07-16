import type { NormalizedJob } from "./types";

function normalizeForSignature(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** A content signature used to catch the same job posted on multiple sources. */
export function buildJobSignature(job: Pick<NormalizedJob, "title" | "company">): string {
  return `${normalizeForSignature(job.title)}::${normalizeForSignature(job.company)}`;
}

/**
 * Removes duplicates within a batch of normalized jobs. Two layers:
 * 1. Exact `source:sourceId` — the same source should never list a job twice.
 * 2. Content signature (title + company) — catches the same role posted to
 *    more than one source, keeping whichever copy was seen first.
 */
export function dedupeNormalizedJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const result: NormalizedJob[] = [];

  for (const job of jobs) {
    const idKey = `${job.source}:${job.sourceId}`;
    if (seenIds.has(idKey)) continue;

    const signature = buildJobSignature(job);
    if (seenSignatures.has(signature)) continue;

    seenIds.add(idKey);
    seenSignatures.add(signature);
    result.push(job);
  }

  return result;
}
