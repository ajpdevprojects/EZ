import {
  inferEmploymentType,
  inferSeniorityLevel,
  normalizeSkillTags,
  parseSalaryRange,
  stripHtml,
} from "../normalize";
import type { JobSourceAdapter, NormalizedJob } from "../types";

/**
 * Remotive publishes a public, unauthenticated JSON API of remote job
 * postings. No API key or account is required.
 */
interface RemotiveRawJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

const REMOTIVE_ENDPOINT = "https://remotive.com/api/remote-jobs";

function normalizeRemotiveJob(raw: RemotiveRawJob): NormalizedJob | null {
  if (!raw.id || !raw.title || !raw.company_name) return null;

  const { min, max } = parseSalaryRange(raw.salary);
  const location = raw.candidate_required_location?.trim() || "Remote";

  return {
    title: raw.title,
    company: raw.company_name,
    location,
    isRemote: true,
    employmentType: inferEmploymentType(raw.job_type),
    seniorityLevel: inferSeniorityLevel(raw.title),
    salaryMin: min,
    salaryMax: max,
    description: raw.description ? stripHtml(raw.description) : "",
    skills: normalizeSkillTags([...(raw.tags ?? []), ...(raw.category ? [raw.category] : [])]),
    applyUrl: raw.url ?? null,
    postedAt: raw.publication_date ?? new Date().toISOString(),
    source: "remotive",
    sourceId: String(raw.id),
  };
}

export const remotiveSource: JobSourceAdapter = {
  id: "remotive",
  label: "Remotive",
  async fetchJobs(fetchImpl: typeof fetch = fetch): Promise<NormalizedJob[]> {
    const response = await fetchImpl(REMOTIVE_ENDPOINT, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Remotive request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { jobs?: RemotiveRawJob[] };

    return (payload.jobs ?? [])
      .map(normalizeRemotiveJob)
      .filter((job): job is NormalizedJob => job !== null);
  },
};
