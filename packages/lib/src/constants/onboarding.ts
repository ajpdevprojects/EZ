import type { CareerGoal, WorkType } from "@ez/types";

export const CAREER_GOAL_OPTIONS: Array<{ value: CareerGoal; label: string }> = [
  { value: "find_new_job", label: "Find a new job" },
  { value: "grow_career", label: "Grow my career" },
  { value: "switch_industries", label: "Switch industries" },
  { value: "get_career_guidance", label: "Get career guidance" },
  { value: "other", label: "Other" },
];

export const WORK_TYPE_OPTIONS: Array<{ value: WorkType; label: string }> = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export const PRIORITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "career_growth", label: "Career growth" },
  { value: "work_life_balance", label: "Work-life balance" },
  { value: "salary_benefits", label: "Salary & benefits" },
  { value: "company_culture", label: "Company culture" },
  { value: "impact_purpose", label: "Impact & purpose" },
];
