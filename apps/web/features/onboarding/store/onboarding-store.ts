import { create } from "zustand";

export const ONBOARDING_STEPS = [
  "Welcome",
  "Your Goals",
  "Current Role",
  "Location",
  "Work Type",
  "Priorities",
  "Complete",
] as const;

interface OnboardingState {
  stepIndex: number;
  careerGoals: string[];
  currentRole: string;
  details: string;
  preferredLocations: string[];
  workTypes: string[];
  priorities: string[];
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  toggleCareerGoal: (value: string) => void;
  setCurrentRole: (value: string) => void;
  setDetails: (value: string) => void;
  addLocation: (value: string) => void;
  removeLocation: (value: string) => void;
  toggleWorkType: (value: string) => void;
  togglePriority: (value: string) => void;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  stepIndex: 0,
  careerGoals: [],
  currentRole: "",
  details: "",
  preferredLocations: [],
  workTypes: [],
  priorities: [],
  goToNextStep: () =>
    set((state) => ({ stepIndex: Math.min(state.stepIndex + 1, ONBOARDING_STEPS.length - 1) })),
  goToPreviousStep: () => set((state) => ({ stepIndex: Math.max(state.stepIndex - 1, 0) })),
  toggleCareerGoal: (value) => set((state) => ({ careerGoals: toggleValue(state.careerGoals, value) })),
  setCurrentRole: (value) => set({ currentRole: value }),
  setDetails: (value) => set({ details: value }),
  addLocation: (value) =>
    set((state) =>
      state.preferredLocations.includes(value)
        ? state
        : { preferredLocations: [...state.preferredLocations, value] },
    ),
  removeLocation: (value) =>
    set((state) => ({ preferredLocations: state.preferredLocations.filter((item) => item !== value) })),
  toggleWorkType: (value) => set((state) => ({ workTypes: toggleValue(state.workTypes, value) })),
  togglePriority: (value) => set((state) => ({ priorities: toggleValue(state.priorities, value) })),
}));
