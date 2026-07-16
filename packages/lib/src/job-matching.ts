import type { Job, Profile } from "@ez/types";
import type { LearnedPreferences } from "./learning";

/**
 * Deterministic confidence scoring — the Software Brain's "Filter Jobs"
 * step. No AI is involved: this runs against every job in the catalog so
 * only a shortlist of the strongest matches ever reaches the AI Brain for
 * deeper reasoning (Product Evolution Directive: Software Brain vs AI
 * Brain). Each factor is transparent so the user always understands WHY a
 * recommendation exists.
 */
export interface ConfidenceFactor {
  key: "skills" | "workType" | "location" | "role" | "behavioral";
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface JobMatchScore {
  score: number;
  confidenceLabel: "Strong match" | "Good match" | "Fair match" | "Low match";
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  factors: ConfidenceFactor[];
}

const FACTOR_BUDGET = {
  skills: 40,
  workType: 15,
  location: 20,
  role: 10,
  behavioral: 15,
} as const;

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

function confidenceLabelFor(score: number): JobMatchScore["confidenceLabel"] {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Fair match";
  return "Low match";
}

function computeSkillFactor(job: Job, candidateSkills: string[]): { factor: ConfidenceFactor; matched: string[]; missing: string[] } {
  const { matched, missing } = skillsOverlap(job.skills, candidateSkills);
  const maxPoints = FACTOR_BUDGET.skills;

  if (job.skills.length === 0) {
    return {
      matched,
      missing,
      factor: { key: "skills", label: "Skill match", points: Math.round(maxPoints * 0.6), maxPoints, detail: "This posting doesn't list specific required skills." },
    };
  }

  const coverage = matched.length / job.skills.length;
  const points = Math.round(coverage * maxPoints);
  const detail =
    matched.length > 0
      ? `Matches ${matched.length} of ${job.skills.length} listed skills (${matched.slice(0, 3).join(", ")}).`
      : "Doesn't overlap with your current resume skills.";

  return { matched, missing, factor: { key: "skills", label: "Skill match", points, maxPoints, detail } };
}

function computeWorkTypeFactor(job: Job, profile: Profile): ConfidenceFactor {
  const maxPoints = FACTOR_BUDGET.workType;
  const matches = profile.workTypes.length === 0 || profile.workTypes.includes(job.employmentType);
  return {
    key: "workType",
    label: "Work type",
    points: matches ? maxPoints : 0,
    maxPoints,
    detail: matches ? "Matches your preferred work type." : "Doesn't match your preferred work type.",
  };
}

function computeLocationFactor(job: Job, profile: Profile): ConfidenceFactor {
  const maxPoints = FACTOR_BUDGET.location;
  const preferredLocations = profile.preferredLocations.map(normalize);
  const wantsRemote = preferredLocations.some((location) => location.includes("remote"));

  if (preferredLocations.length === 0) {
    return { key: "location", label: "Location", points: Math.round(maxPoints * 0.5), maxPoints, detail: "No location preference set yet." };
  }

  if (job.isRemote && wantsRemote) {
    return { key: "location", label: "Location", points: maxPoints, maxPoints, detail: "This role is remote, matching your preference." };
  }

  const jobLocation = normalize(job.location ?? "");
  const locationMatches =
    !job.isRemote && jobLocation && preferredLocations.some((location) => jobLocation.includes(location) || location.includes(jobLocation));

  if (locationMatches) {
    return { key: "location", label: "Location", points: maxPoints, maxPoints, detail: `Based in ${job.location}, matching one of your preferred locations.` };
  }

  return { key: "location", label: "Location", points: 0, maxPoints, detail: "Doesn't match your preferred locations." };
}

function computeRoleFactor(job: Job, profile: Profile): ConfidenceFactor {
  const maxPoints = FACTOR_BUDGET.role;
  if (!profile.currentRole) {
    return { key: "role", label: "Role alignment", points: 0, maxPoints, detail: "Add your current role to personalize this factor." };
  }

  const firstWord = normalize(profile.currentRole).split(" ")[0];
  const aligns = Boolean(firstWord && normalize(job.title).includes(firstWord));

  return {
    key: "role",
    label: "Role alignment",
    points: aligns ? maxPoints : 0,
    maxPoints,
    detail: aligns ? `Title aligns with your current role (${profile.currentRole}).` : "Title doesn't closely match your current role.",
  };
}

function computeBehavioralFactor(job: Job, learned: LearnedPreferences | undefined): ConfidenceFactor {
  const maxPoints = FACTOR_BUDGET.behavioral;

  if (!learned || learned.sampleSize === 0) {
    return {
      key: "behavioral",
      label: "Your history",
      points: 0,
      maxPoints,
      detail: "Not enough application history yet to personalize this factor.",
    };
  }

  let signalSum = 0;
  let signalCount = 0;

  if (job.skills.length > 0) {
    const skillScores = job.skills.map((skill) => learned.skillAffinity[normalize(skill)] ?? 0);
    signalSum += skillScores.reduce((total, value) => total + value, 0) / skillScores.length;
    signalCount++;
  }

  const workTypeScore = learned.workTypeAffinity[job.employmentType];
  if (workTypeScore !== undefined) {
    signalSum += workTypeScore;
    signalCount++;
  }

  if (learned.remoteAffinity !== 0) {
    signalSum += job.isRemote ? learned.remoteAffinity : -learned.remoteAffinity;
    signalCount++;
  }

  if (learned.salarySweetSpot && (job.salaryMin || job.salaryMax)) {
    const jobMidpoint = job.salaryMax ?? job.salaryMin ?? 0;
    const { min, max } = learned.salarySweetSpot;
    const inRange = jobMidpoint >= min * 0.85 && jobMidpoint <= max * 1.15;
    signalSum += inRange ? 1 : -0.3;
    signalCount++;
  }

  const normalizedSignal = signalCount > 0 ? Math.max(-1, Math.min(1, signalSum / signalCount)) : 0;
  const points = Math.round(((normalizedSignal + 1) / 2) * maxPoints);

  const detail =
    normalizedSignal > 0.2
      ? "Similar to opportunities that have worked well for you before."
      : normalizedSignal < -0.2
        ? "Different from what's worked for you historically."
        : "Neutral based on your history so far.";

  return { key: "behavioral", label: "Your history", points, maxPoints, detail };
}

/**
 * Scores a single job against a profile, resume skills, and (optionally)
 * learned behavioral preferences. Pure function, no AI. Returns a
 * transparent factor breakdown so the user always understands why a
 * recommendation exists.
 */
export function scoreJobForProfile(
  job: Job,
  profile: Profile,
  candidateSkills: string[] = [],
  learned?: LearnedPreferences,
): JobMatchScore {
  const { factor: skillFactor, matched, missing } = computeSkillFactor(job, candidateSkills);
  const workTypeFactor = computeWorkTypeFactor(job, profile);
  const locationFactor = computeLocationFactor(job, profile);
  const roleFactor = computeRoleFactor(job, profile);
  const behavioralFactor = computeBehavioralFactor(job, learned);

  const factors = [skillFactor, workTypeFactor, locationFactor, roleFactor, behavioralFactor];
  const score = Math.max(
    0,
    Math.min(
      100,
      factors.reduce((total, factor) => total + factor.points, 0),
    ),
  );

  const reasons = factors
    .filter((factor) => factor.points >= factor.maxPoints * 0.5 && factor.points > 0)
    .map((factor) => factor.detail);

  return {
    score,
    confidenceLabel: confidenceLabelFor(score),
    matchedSkills: matched,
    missingSkills: missing,
    reasons,
    factors,
  };
}

export interface RankedJob {
  job: Job;
  match: JobMatchScore;
}

/** Ranks a job catalog for a profile, strongest match first. This is the Filter step before AI. */
export function rankJobsForProfile(
  jobs: Job[],
  profile: Profile,
  candidateSkills: string[] = [],
  learned?: LearnedPreferences,
): RankedJob[] {
  return jobs
    .map((job) => ({ job, match: scoreJobForProfile(job, profile, candidateSkills, learned) }))
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      return new Date(b.job.postedAt).getTime() - new Date(a.job.postedAt).getTime();
    });
}
