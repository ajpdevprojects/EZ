import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";
import { dedupeNormalizedJobs } from "./dedupe";
import { JOB_SOURCES } from "./sources";
import type { JobSourceAdapter, NormalizedJob } from "./types";

/** Jobs from a source not seen in an ingestion run for this long are archived (marked inactive). */
export const STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 3;

export interface IngestSummary {
  source: string;
  jobsFound: number;
  jobsCreated: number;
  jobsUpdated: number;
  jobsArchived: number;
  jobsDuplicatesRemoved: number;
  error: string | null;
}

type JobsInsert = Database["public"]["Tables"]["jobs"]["Insert"];

function normalizedJobToRow(job: NormalizedJob, seenAt: string): JobsInsert {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    is_remote: job.isRemote,
    employment_type: job.employmentType,
    seniority_level: job.seniorityLevel,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    description: job.description,
    skills: job.skills,
    apply_url: job.applyUrl,
    posted_at: job.postedAt,
    source: job.source,
    source_id: job.sourceId,
    is_active: true,
    last_seen_at: seenAt,
  };
}

async function ingestFromSource(
  supabase: SupabaseClient<Database>,
  source: JobSourceAdapter,
): Promise<IngestSummary> {
  const { data: run } = await supabase
    .from("job_ingestion_runs")
    .insert({ source: source.id })
    .select()
    .single();

  try {
    const rawJobs = await source.fetchJobs();
    const jobs = dedupeNormalizedJobs(rawJobs);
    const jobsDuplicatesRemoved = rawJobs.length - jobs.length;
    const seenAt = new Date().toISOString();

    const sourceIds = jobs.map((job) => job.sourceId);
    const { data: existingRows } = sourceIds.length
      ? await supabase.from("jobs").select("source_id").eq("source", source.id).in("source_id", sourceIds)
      : { data: [] as Array<{ source_id: string | null }> };
    const existingIds = new Set((existingRows ?? []).map((row) => row.source_id));

    const jobsCreated = jobs.filter((job) => !existingIds.has(job.sourceId)).length;
    const jobsUpdated = jobs.length - jobsCreated;

    if (jobs.length > 0) {
      const rows = jobs.map((job) => normalizedJobToRow(job, seenAt));
      const { error } = await supabase.from("jobs").upsert(rows, { onConflict: "source,source_id" });
      if (error) throw error;
    }

    const staleCutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
    const { data: archivedRows } = await supabase
      .from("jobs")
      .update({ is_active: false })
      .eq("source", source.id)
      .eq("is_active", true)
      .lt("last_seen_at", staleCutoff)
      .select("id");
    const jobsArchived = archivedRows?.length ?? 0;

    if (run) {
      await supabase
        .from("job_ingestion_runs")
        .update({
          status: "succeeded",
          jobs_found: jobs.length,
          jobs_created: jobsCreated,
          jobs_updated: jobsUpdated,
          jobs_archived: jobsArchived,
          jobs_duplicates_removed: jobsDuplicatesRemoved,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id);
    }

    return {
      source: source.id,
      jobsFound: jobs.length,
      jobsCreated,
      jobsUpdated,
      jobsArchived,
      jobsDuplicatesRemoved,
      error: null,
    };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unknown ingestion error";

    if (run) {
      await supabase
        .from("job_ingestion_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", run.id);
    }

    return {
      source: source.id,
      jobsFound: 0,
      jobsCreated: 0,
      jobsUpdated: 0,
      jobsArchived: 0,
      jobsDuplicatesRemoved: 0,
      error: message,
    };
  }
}

/**
 * Runs the full Software Engine job-discovery pipeline: fetch from every
 * public source, normalize, dedupe, upsert into the shared `jobs` catalog,
 * and archive listings no longer seen. AI is never invoked here — this is
 * deterministic collection only (see docs/canon Product Directive: Brain 1).
 */
export async function ingestJobsFromAllSources(
  supabase: SupabaseClient<Database>,
  sources: JobSourceAdapter[] = JOB_SOURCES,
): Promise<IngestSummary[]> {
  const summaries: IngestSummary[] = [];
  for (const source of sources) {
    summaries.push(await ingestFromSource(supabase, source));
  }
  return summaries;
}
