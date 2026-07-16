import { beforeEach, describe, expect, it } from "vitest";
import { useOnboardingStore } from "./onboarding-store";

const INITIAL_STATE = useOnboardingStore.getState();

describe("useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.setState(INITIAL_STATE, true);
  });

  it("toggles career goals on and off", () => {
    useOnboardingStore.getState().toggleCareerGoal("find_new_job");
    expect(useOnboardingStore.getState().careerGoals).toEqual(["find_new_job"]);

    useOnboardingStore.getState().toggleCareerGoal("find_new_job");
    expect(useOnboardingStore.getState().careerGoals).toEqual([]);
  });

  it("adds and removes preferred locations without duplicates", () => {
    useOnboardingStore.getState().addLocation("Remote");
    useOnboardingStore.getState().addLocation("Remote");
    expect(useOnboardingStore.getState().preferredLocations).toEqual(["Remote"]);

    useOnboardingStore.getState().removeLocation("Remote");
    expect(useOnboardingStore.getState().preferredLocations).toEqual([]);
  });

  it("moves forward and backward through steps within bounds", () => {
    expect(useOnboardingStore.getState().stepIndex).toBe(0);

    useOnboardingStore.getState().goToPreviousStep();
    expect(useOnboardingStore.getState().stepIndex).toBe(0);

    useOnboardingStore.getState().goToNextStep();
    useOnboardingStore.getState().goToNextStep();
    expect(useOnboardingStore.getState().stepIndex).toBe(2);
  });
});
