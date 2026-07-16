import type { Application, EmploymentType, Job } from "@ez/types";

/**
 * Software Brain continuous learning (Product Evolution Directive). Pure,
 * deterministic derivation of a user's revealed preferences from their own
 * history — no AI involved. Every signal comes from actions the user
 * already took (applying, being interviewed, being rejected, dismissing a
 * recommendation), so recommendations quietly get better the longer EZ is
 * used without any model call.
 */
export interface LearnedPreferences {
  /** Normalized skill (lowercase) -> affinity in [-1, 1]. Positive = skills present in jobs that led to interviews/offers. */
  skillAffinity: Record<string, number>;
  /** Employment type -> affinity in [-1, 1]. */
  workTypeAffinity: Partial<Record<EmploymentType, number>>;
  /** Affinity toward remote work in [-1, 1], derived from which outcomes were remote vs on-site. */
  remoteAffinity: number;
  /** The salary range associated with positive outcomes, if any salary data was available. */
  salarySweetSpot: { min: number; max: number } | null;
  /** How many outcome data points informed this — used to decide whether to trust the signal yet. */
  sampleSize: number;
}

const POSITIVE_OUTCOME_WEIGHT: Record<string, number> = {
  hired: 1,
  offer: 1,
  interviewing: 0.6,
};
const NEGATIVE_OUTCOME_WEIGHT: Record<string, number> = {
  rejected: -0.6,
};

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

function normalizeToUnitRange(values: Record<string, number>): Record<string, number> {
  const maxAbs = Math.max(1e-9, ...Object.values(values).map((value) => Math.abs(value)));
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    normalized[key] = value / maxAbs;
  }
  return normalized;
}

export function computeLearnedPreferences(
  applications: Application[],
  dismissedJobs: Job[] = [],
): LearnedPreferences {
  const skillWeights: Record<string, number> = {};
  const workTypeWeights: Record<string, number> = {};
  let remoteWeightedSum = 0;
  let remoteSamples = 0;
  const salaryPoints: number[] = [];
  let sampleSize = 0;

  function applyJobSignal(job: Job, weight: number) {
    for (const skill of job.skills) {
      const key = normalizeSkill(skill);
      skillWeights[key] = (skillWeights[key] ?? 0) + weight;
    }
    workTypeWeights[job.employmentType] = (workTypeWeights[job.employmentType] ?? 0) + weight;
    remoteWeightedSum += job.isRemote ? weight : -weight;
    remoteSamples++;
    if (weight > 0) {
      if (job.salaryMin) salaryPoints.push(job.salaryMin);
      if (job.salaryMax) salaryPoints.push(job.salaryMax);
    }
  }

  for (const application of applications) {
    const job = application.job;
    if (!job) continue;

    const weight = POSITIVE_OUTCOME_WEIGHT[application.status] ?? NEGATIVE_OUTCOME_WEIGHT[application.status];
    if (weight === undefined) continue;

    sampleSize++;
    applyJobSignal(job, weight);
  }

  for (const job of dismissedJobs) {
    for (const skill of job.skills) {
      const key = normalizeSkill(skill);
      skillWeights[key] = (skillWeights[key] ?? 0) - 0.3;
    }
  }

  const salarySweetSpot =
    salaryPoints.length > 0 ? { min: Math.min(...salaryPoints), max: Math.max(...salaryPoints) } : null;

  return {
    skillAffinity: normalizeToUnitRange(skillWeights),
    workTypeAffinity: normalizeToUnitRange(workTypeWeights) as Partial<Record<EmploymentType, number>>,
    remoteAffinity: remoteSamples > 0 ? Math.max(-1, Math.min(1, remoteWeightedSum / remoteSamples)) : 0,
    salarySweetSpot,
    sampleSize,
  };
}
