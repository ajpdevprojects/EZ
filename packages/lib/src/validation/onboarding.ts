import { z } from "zod";

export const careerGoalsStepSchema = z.object({
  careerGoals: z.array(z.string()).min(1, "Select at least one option"),
});

export const currentJobTitleStepSchema = z.object({
  currentJobTitle: z.string().trim().min(1, "Tell us your current role"),
  details: z.string().trim().optional(),
});

export const locationsStepSchema = z.object({
  preferredLocations: z.array(z.string()).min(1, "Add at least one location"),
});

export const workTypesStepSchema = z.object({
  workTypes: z.array(z.string()).min(1, "Select at least one work type"),
});

export const prioritiesStepSchema = z.object({
  priorities: z.array(z.string()).min(1, "Select at least one priority"),
});

export const onboardingSchema = careerGoalsStepSchema
  .merge(currentJobTitleStepSchema)
  .merge(locationsStepSchema)
  .merge(workTypesStepSchema)
  .merge(prioritiesStepSchema);

export type OnboardingInput = z.infer<typeof onboardingSchema>;
