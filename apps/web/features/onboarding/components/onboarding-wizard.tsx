"use client";

import { Button, ProgressStepper } from "@ez/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import { completeOnboardingAction } from "../actions";
import { ONBOARDING_STEPS, useOnboardingStore } from "../store/onboarding-store";
import {
  CompleteStep,
  GoalsStep,
  LocationsStep,
  PrioritiesStep,
  RoleStep,
  WelcomeStep,
  WorkTypeStep,
} from "./onboarding-steps";

const STEP_COMPONENTS = [
  WelcomeStep,
  GoalsStep,
  RoleStep,
  LocationsStep,
  WorkTypeStep,
  PrioritiesStep,
  CompleteStep,
];

export function OnboardingWizard() {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const stepIndex = useOnboardingStore((state) => state.stepIndex);
  const goToNextStep = useOnboardingStore((state) => state.goToNextStep);
  const goToPreviousStep = useOnboardingStore((state) => state.goToPreviousStep);
  const careerGoals = useOnboardingStore((state) => state.careerGoals);
  const currentJobTitle = useOnboardingStore((state) => state.currentJobTitle);
  const preferredLocations = useOnboardingStore((state) => state.preferredLocations);
  const workTypes = useOnboardingStore((state) => state.workTypes);
  const priorities = useOnboardingStore((state) => state.priorities);
  const details = useOnboardingStore((state) => state.details);

  const StepComponent = STEP_COMPONENTS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_COMPONENTS.length - 1;

  const stepIsValid = React.useMemo(() => {
    switch (stepIndex) {
      case 1:
        return careerGoals.length > 0;
      case 2:
        return currentJobTitle.trim().length > 0;
      case 3:
        return preferredLocations.length > 0;
      case 4:
        return workTypes.length > 0;
      case 5:
        return priorities.length > 0;
      default:
        return true;
    }
  }, [stepIndex, careerGoals, currentJobTitle, preferredLocations, workTypes, priorities]);

  async function handleContinue() {
    setError(null);

    if (!isLastStep) {
      goToNextStep();
      return;
    }

    setIsSubmitting(true);
    const result = await completeOnboardingAction({
      careerGoals,
      currentJobTitle,
      details,
      preferredLocations,
      workTypes,
      priorities,
    });
    setIsSubmitting(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-10">
      {!isFirstStep && !isLastStep && (
        <ProgressStepper
          steps={ONBOARDING_STEPS.slice(1, -1)}
          currentStep={stepIndex}
        />
      )}

      <div className="flex flex-1 flex-col justify-center">
        <StepComponent />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {!isFirstStep && !isLastStep && (
          <Button type="button" variant="secondary" size="lg" onClick={goToPreviousStep}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          size="lg"
          className="flex-1 justify-between"
          disabled={!stepIsValid || isSubmitting}
          onClick={handleContinue}
        >
          {isLastStep ? (isSubmitting ? "Preparing your journey…" : "Go to Home") : "Next"}
          {!isLastStep && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
