"use client";

import { LEARNING_CATEGORIES } from "@ez/lib";
import { Chip, EmptyState } from "@ez/ui";
import type { LearningProgress, LearningResource } from "@ez/types";
import { GraduationCap } from "lucide-react";
import * as React from "react";
import { LearningResourceCard } from "./learning-resource-card";

export function LearningCatalog({
  resources,
  progress,
}: {
  resources: LearningResource[];
  progress: LearningProgress[];
}) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const progressByResource = new Map(progress.map((entry) => [entry.resourceId, entry.status]));

  const filtered = activeCategory
    ? resources.filter((resource) => resource.category === activeCategory)
    : resources;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {LEARNING_CATEGORIES.map((category) => (
          <Chip
            key={category}
            selected={activeCategory === category}
            onClick={() => setActiveCategory((current) => (current === category ? null : category))}
          >
            {category}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title="No resources in this category yet"
            description="Check back soon, or explore another category."
          />
        ) : (
          filtered.map((resource) => (
            <LearningResourceCard
              key={resource.id}
              resource={resource}
              status={progressByResource.get(resource.id) ?? "not_started"}
            />
          ))
        )}
      </div>
    </div>
  );
}
