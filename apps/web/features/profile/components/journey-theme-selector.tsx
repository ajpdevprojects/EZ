"use client";

import { updateJourneyThemeAction } from "@/features/profile/actions";
import { Label, Select, toast } from "@ez/ui";
import type { JourneyTheme } from "@ez/types";
import * as React from "react";

const THEME_OPTIONS: Array<{ value: JourneyTheme; label: string }> = [
  { value: "executive", label: "🚗 Executive (Default)" },
  { value: "minimal", label: "🎹 Minimal" },
  { value: "ambient", label: "🌌 Ambient" },
  { value: "nature", label: "🌿 Nature" },
  { value: "silent", label: "🔕 Silent" },
];

export function JourneyThemeSelector({ theme }: { theme: JourneyTheme }) {
  const [value, setValue] = React.useState(theme);
  const [isPending, startTransition] = React.useTransition();

  function handleChange(next: JourneyTheme) {
    setValue(next);
    startTransition(async () => {
      const result = await updateJourneyThemeAction(next);
      if (result.error) toast({ title: "Couldn't update theme", description: result.error, variant: "error" });
      else toast({ title: "Journey theme updated", variant: "success" });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="journey-theme">Journey sound theme</Label>
      <Select
        id="journey-theme"
        value={value}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as JourneyTheme)}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
