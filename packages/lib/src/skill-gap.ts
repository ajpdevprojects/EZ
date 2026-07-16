/**
 * Deterministic skill-gap analysis (Software Engine). Comparing a resume's
 * skills against a job's listed skills is a plain set difference — no AI
 * is needed, so this runs instantly for every job a user views.
 */
export interface SkillGap {
  matchedSkills: string[];
  missingSkills: string[];
  coveragePercent: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function computeSkillGap(candidateSkills: string[], jobSkills: string[]): SkillGap {
  if (jobSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [], coveragePercent: 100 };
  }

  const candidateSet = new Set(candidateSkills.map(normalize));
  const matchedSkills = jobSkills.filter((skill) => candidateSet.has(normalize(skill)));
  const missingSkills = jobSkills.filter((skill) => !candidateSet.has(normalize(skill)));
  const coveragePercent = Math.round((matchedSkills.length / jobSkills.length) * 100);

  return { matchedSkills, missingSkills, coveragePercent };
}
