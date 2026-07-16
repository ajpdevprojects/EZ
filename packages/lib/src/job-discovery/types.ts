import type { EmploymentType, JobSource, SeniorityLevel } from "@ez/types";

/**
 * A job posting normalized into EZ's internal shape, before it is written
 * to the `jobs` table. Every external source adapter must produce this
 * shape so the rest of the Software Engine (dedupe, filtering, storage)
 * never needs to know where a job came from.
 */
export interface NormalizedJob {
  title: string;
  company: string;
  location: string | null;
  isRemote: boolean;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  skills: string[];
  applyUrl: string | null;
  postedAt: string;
  source: JobSource;
  sourceId: string;
}

/**
 * A pluggable public job source. Sources fetch and normalize; they never
 * touch the database directly, so they can be unit tested with a mocked
 * `fetchImpl` and reused outside of the ingestion orchestrator.
 */
export interface JobSourceAdapter {
  id: JobSource;
  label: string;
  fetchJobs(fetchImpl?: typeof fetch): Promise<NormalizedJob[]>;
}
