import type { Job, Profile } from "@ez/types";

/**
 * Deterministic job-fit scoring — the Software Engine's "Filter Jobs" step.
 * No AI is involved: this runs against every job in the catalog so only a
 * shortlist of the strongest matches ever reaches the AI Engine for deeper
 * reasoning (see docs/canon Product Directive: Brain 1 vs Brain 2).
 */
export interface JobMatchScore {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function skillsOverlap(jobSkills: string[], candidateSkills: string[]): { matched: string[]; missing: string[] } {
  const candidateSet = new Set(candidateSkills.map(normalize));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jobSkills) {
    if (candidateSet.has(normalize(skill))) matched.push(skill);
    else missing.push(skill);
  }

  return { matched, missing };
}

/** Scores a single job against a profile and (optionally) resume skills. Pure function, no AI. */
export function scoreJobForProfile(job: Job, profile: Profile, candidateSkills: string[] = []): JobMatchScore {
  const reasons: string[] = [];
  let score = 0;

  const { matched, missing } = skillsOverlap(job.skills, candidateSkills);
  if (job.skills.length > 0) {
    const coverage = matched.length / job.skills.length;
    score += Math.round(coverage * 50);
    if (matched.length > 0) {
      reasons.push(
        `Matches ${matched.length} of ${job.skills.length} listed skills (${matched.slice(0, 3).join(", ")}).`,
      );
    }
  } else {
    score += 25;
  }

  if (profile.workTypes.length === 0 || profile.workTypes.includes(job.employmentType)) {
    score += 15;
  }

  const preferredLocations = profile.preferredLocations.map(normalize);
  const wantsRemote = preferredLocations.some((location) => location.includes("remote"));
  if (preferredLocations.length === 0) {
    score += 12;
  } else if (job.isRemote && wantsRemote) {
    score += 25;
    reasons.push("This role is remote, matching your preference.");
  } else if (
    !job.isRemote &&
    job.location &&
    preferredLocations.some((location) => normalize(job.location ?? "").includes(location) || location.includes(normalize(job.location ?? "")))
  ) {
    score += 25;
    reasons.push(`Based in ${job.location}, matching one of your preferred locations.`);
  }

  if (profile.currentRole) {
    const firstWord = normalize(profile.currentRole).split(" ")[0];
    if (firstWord && normalize(job.title).includes(firstWord)) {
      score += 10;
      reasons.push(`Title aligns with your current role (${profile.currentRole}).`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedSkills: matched,
    missingSkills: missing,
    reasons,
  };
}

export interface RankedJob {
  job: Job;
  match: JobMatchScore;
}

/** Ranks a job catalog for a profile, strongest match first. This is the Filter step before AI. */
export function rankJobsForProfile(jobs: Job[], profile: Profile, candidateSkills: string[] = []): RankedJob[] {
  return jobs
    .map((job) => ({ job, match: scoreJobForProfile(job, profile, candidateSkills) }))
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      return new Date(b.job.postedAt).getTime() - new Date(a.job.postedAt).getTime();
    });
}
