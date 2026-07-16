import {
  inferSeniorityLevel,
  normalizeSkillTags,
  stripHtml,
} from "../normalize";
import type { JobSourceAdapter, NormalizedJob } from "../types";

/**
 * RemoteOK publishes a public, unauthenticated JSON feed of remote job
 * postings. No API key or account is required. The first array element is
 * a legal notice, not a job, and is skipped.
 */
interface RemoteOkRawJob {
  id?: string | number;
  slug?: string;
  position?: string;
  company?: string;
  tags?: string[];
  location?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
  legal?: string;
}

const REMOTEOK_ENDPOINT = "https://remoteok.com/api";

function normalizeRemoteOkJob(raw: RemoteOkRawJob): NormalizedJob | null {
  if (!raw.id || !raw.position || !raw.company) return null;

  return {
    title: raw.position,
    company: raw.company,
    location: raw.location?.trim() || "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: inferSeniorityLevel(raw.position),
    salaryMin: typeof raw.salary_min === "number" ? raw.salary_min : null,
    salaryMax: typeof raw.salary_max === "number" ? raw.salary_max : null,
    description: raw.description ? stripHtml(raw.description) : "",
    skills: normalizeSkillTags(raw.tags ?? []),
    applyUrl: raw.apply_url || raw.url || null,
    postedAt: raw.date ?? new Date().toISOString(),
    source: "remoteok",
    sourceId: String(raw.id),
  };
}

export const remoteOkSource: JobSourceAdapter = {
  id: "remoteok",
  label: "RemoteOK",
  async fetchJobs(fetchImpl: typeof fetch = fetch): Promise<NormalizedJob[]> {
    const response = await fetchImpl(REMOTEOK_ENDPOINT, {
      headers: { Accept: "application/json", "User-Agent": "EZ Job Search OS (+https://ez.example.com)" },
    });

    if (!response.ok) {
      throw new Error(`RemoteOK request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as RemoteOkRawJob[];

    return payload
      .filter((entry) => !entry.legal)
      .map(normalizeRemoteOkJob)
      .filter((job): job is NormalizedJob => job !== null);
  },
};
