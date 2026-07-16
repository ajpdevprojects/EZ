"use client";

import { updateCareerGoalsAction } from "@/features/coach/actions";
import { CAREER_GOAL_OPTIONS, PRIORITY_OPTIONS, WORK_TYPE_OPTIONS } from "@ez/lib";
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Input, Label, toast } from "@ez/ui";
import type { Profile } from "@ez/types";
import { Plus, Save } from "lucide-react";
import * as React from "react";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function GoalsEditor({ profile }: { profile: Profile }) {
  const [careerGoals, setCareerGoals] = React.useState<string[]>(profile.careerGoals);
  const [currentRole, setCurrentRole] = React.useState(profile.currentRole ?? "");
  const [preferredLocations, setPreferredLocations] = React.useState<string[]>(profile.preferredLocations);
  const [locationDraft, setLocationDraft] = React.useState("");
  const [workTypes, setWorkTypes] = React.useState<string[]>(profile.workTypes);
  const [priorities, setPriorities] = React.useState<string[]>(profile.priorities);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateCareerGoalsAction({
      careerGoals,
      currentRole,
      details: "",
      preferredLocations,
      workTypes,
      priorities,
    });
    setIsSaving(false);
    if (result.error) toast({ title: "Couldn't save goals", description: result.error, variant: "error" });
    else toast({ title: "Goals updated", variant: "success" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your goals</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>What brings you here?</Label>
          <div className="flex flex-wrap gap-2">
            {CAREER_GOAL_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={careerGoals.includes(option.value)}
                onClick={() => setCareerGoals((current) => toggle(current, option.value))}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="current-role">Current role</Label>
          <Input id="current-role" value={currentRole} onChange={(event) => setCurrentRole(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Preferred locations</Label>
          <div className="flex flex-wrap gap-2">
            {preferredLocations.map((location) => (
              <Chip
                key={location}
                selected
                onRemove={() => setPreferredLocations((current) => current.filter((item) => item !== location))}
              >
                {location}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={locationDraft}
              placeholder="Add a location"
              onChange={(event) => setLocationDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && locationDraft.trim()) {
                  event.preventDefault();
                  setPreferredLocations((current) => Array.from(new Set([...current, locationDraft.trim()])));
                  setLocationDraft("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Add location"
              onClick={() => {
                if (!locationDraft.trim()) return;
                setPreferredLocations((current) => Array.from(new Set([...current, locationDraft.trim()])));
                setLocationDraft("");
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Work type</Label>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={workTypes.includes(option.value)}
                onClick={() => setWorkTypes((current) => toggle(current, option.value))}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Priorities</Label>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={priorities.includes(option.value)}
                onClick={() => setPriorities((current) => toggle(current, option.value))}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button disabled={isSaving} onClick={handleSave} className="self-start">
          <Save className="size-4" aria-hidden="true" />
          {isSaving ? "Saving…" : "Save goals"}
        </Button>
      </CardContent>
    </Card>
  );
}
