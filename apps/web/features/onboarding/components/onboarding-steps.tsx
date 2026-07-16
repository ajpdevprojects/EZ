"use client";

import {
  CAREER_GOAL_OPTIONS,
  PRIORITY_OPTIONS,
  WORK_TYPE_OPTIONS,
} from "@ez/lib";
import { Button, Chip, Input, Label, Textarea } from "@ez/ui";
import { Plus, Sparkles } from "lucide-react";
import * as React from "react";
import { useOnboardingStore } from "../store/onboarding-store";

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Sparkles className="size-10 text-primary" aria-hidden="true" />
      <h2 className="font-display text-2xl font-semibold text-foreground">
        Let&apos;s personalize your journey
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        A few quick questions help me find opportunities that actually fit you. You can change
        any of this later.
      </p>
    </div>
  );
}

export function GoalsStep() {
  const careerGoals = useOnboardingStore((state) => state.careerGoals);
  const toggleCareerGoal = useOnboardingStore((state) => state.toggleCareerGoal);

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="What brings you here today?" subtitle="Select all that apply." />
      <div className="flex flex-wrap gap-2">
        {CAREER_GOAL_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={careerGoals.includes(option.value)}
            onClick={() => toggleCareerGoal(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function RoleStep() {
  const currentRole = useOnboardingStore((state) => state.currentRole);
  const setCurrentRole = useOnboardingStore((state) => state.setCurrentRole);
  const details = useOnboardingStore((state) => state.details);
  const setDetails = useOnboardingStore((state) => state.setDetails);

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="What's your current role?" subtitle="This helps me personalize opportunities for you." />
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-role">Current role</Label>
        <Input
          id="current-role"
          value={currentRole}
          onChange={(event) => setCurrentRole(event.target.value)}
          placeholder="Product Designer"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role-details">Add more details (optional)</Label>
        <Textarea
          id="role-details"
          value={details}
          maxLength={500}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Tell me about yourself…"
        />
        <span className="self-end text-xs text-muted-foreground">{details.length}/500</span>
      </div>
    </div>
  );
}

export function LocationsStep() {
  const [draft, setDraft] = React.useState("");
  const preferredLocations = useOnboardingStore((state) => state.preferredLocations);
  const addLocation = useOnboardingStore((state) => state.addLocation);
  const removeLocation = useOnboardingStore((state) => state.removeLocation);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addLocation(trimmed);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="Where would you like to work?" subtitle="You can add multiple locations." />
      <div className="flex flex-wrap gap-2">
        {preferredLocations.map((location) => (
          <Chip key={location} selected onRemove={() => removeLocation(location)}>
            {location}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Remote, San Francisco CA, New York NY…"
        />
        <Button type="button" variant="secondary" size="icon" onClick={handleAdd} aria-label="Add location">
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function WorkTypeStep() {
  const workTypes = useOnboardingStore((state) => state.workTypes);
  const toggleWorkType = useOnboardingStore((state) => state.toggleWorkType);

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="What type of work are you looking for?" subtitle="Select your preference." />
      <div className="flex flex-wrap gap-2">
        {WORK_TYPE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={workTypes.includes(option.value)}
            onClick={() => toggleWorkType(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function PrioritiesStep() {
  const priorities = useOnboardingStore((state) => state.priorities);
  const togglePriority = useOnboardingStore((state) => state.togglePriority);

  return (
    <div className="flex flex-col gap-4">
      <StepHeading title="What's most important to you?" subtitle="Choose your top priorities." />
      <div className="flex flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={priorities.includes(option.value)}
            onClick={() => togglePriority(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function CompleteStep() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Sparkles className="size-10 text-primary" aria-hidden="true" />
      <h2 className="font-display text-2xl font-semibold text-foreground">You&apos;re all set!</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        I&apos;ll start finding the best opportunities for you.
      </p>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
