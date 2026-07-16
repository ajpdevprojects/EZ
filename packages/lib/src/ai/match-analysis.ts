export interface JobMatchAnalysis {
  score: number | null;
  reason: string;
}

/** Parses the "SCORE: n / REASON: text" format we ask the AI to respond in. */
export function parseMatchAnalysis(text: string): JobMatchAnalysis {
  const scoreMatch = text.match(/SCORE:\s*(\d{1,3})/i);
  const reasonMatch = text.match(/REASON:\s*([\s\S]+)/i);

  const score = scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[1]))) : null;
  const reason = reasonMatch ? reasonMatch[1].trim() : text.trim();

  return { score, reason };
}

export function buildJobMatchPrompt(input: {
  jobTitle: string;
  company: string;
  description: string;
  requiredSkills: string[];
  currentJobTitle: string;
  careerGoals: string[];
  priorities: string[];
  resumeSummary: string;
  resumeSkills: string[];
}): string {
  return `Analyze how well this professional matches this job. Respond in exactly this format:
SCORE: <a number from 0 to 100>
REASON: <2-3 concise, honest sentences explaining the score, including any real gaps>

Job: ${input.jobTitle} at ${input.company}
Job description: ${input.description}
Required skills: ${input.requiredSkills.join(", ")}

Candidate's current role: ${input.currentJobTitle || "unknown"}
Candidate's career goals: ${input.careerGoals.join(", ") || "unspecified"}
Candidate's priorities: ${input.priorities.join(", ") || "unspecified"}
Candidate's resume summary: ${input.resumeSummary || "no resume on file"}
Candidate's resume skills: ${input.resumeSkills.join(", ") || "none listed"}`;
}
