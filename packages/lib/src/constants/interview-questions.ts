/**
 * Curated interview prep question bank. Available with or without AI, per
 * the Product Philosophy: "The application must remain valuable even if
 * AI is never used."
 */
export interface InterviewQuestionSet {
  category: string;
  questions: string[];
}

export const BEHAVIORAL_QUESTIONS: InterviewQuestionSet = {
  category: "Behavioral",
  questions: [
    "Tell me about a time you disagreed with a teammate. How did you resolve it?",
    "Describe a project that didn't go as planned. What did you learn?",
    "Tell me about a time you had to persuade someone to see things your way.",
    "Describe a situation where you had to manage competing priorities.",
    "Tell me about a time you received difficult feedback. How did you respond?",
  ],
};

export const CLOSING_QUESTIONS: InterviewQuestionSet = {
  category: "Questions to ask them",
  questions: [
    "What does success look like in this role after the first 90 days?",
    "How does the team measure impact?",
    "What's the biggest challenge someone in this role would face right now?",
    "How would you describe the team's working style?",
  ],
};

const SKILL_QUESTION_BANK: Record<string, string[]> = {
  "design systems": [
    "How do you decide when a pattern should become part of the design system versus stay one-off?",
    "How do you drive adoption of a design system across teams that are resistant to change?",
  ],
  figma: [
    "Walk me through how you structure a complex Figma file for a multi-platform product.",
  ],
  "user research": [
    "Tell me about a time research findings contradicted a stakeholder's assumption. What did you do?",
  ],
  react: [
    "How do you decide between client and server components in a Next.js app?",
    "Tell me about a performance problem you diagnosed and fixed in a React app.",
  ],
  typescript: ["How do you approach typing a complex, evolving domain model?"],
  "product strategy": [
    "Walk me through how you prioritized your last roadmap.",
    "Tell me about a bet you made that didn't pay off.",
  ],
};

/**
 * Builds a prep question set tailored to a job's skills, falling back to
 * general behavioral questions when no skill-specific bank matches.
 */
export function buildInterviewPrepQuestions(skills: string[]): InterviewQuestionSet[] {
  const roleSpecific = skills
    .map((skill) => skill.toLowerCase())
    .flatMap((skill) => SKILL_QUESTION_BANK[skill] ?? []);

  const sets: InterviewQuestionSet[] = [BEHAVIORAL_QUESTIONS];

  if (roleSpecific.length > 0) {
    sets.push({ category: "Role-specific", questions: Array.from(new Set(roleSpecific)) });
  }

  sets.push(CLOSING_QUESTIONS);
  return sets;
}
