"use client";

import { Chip, EmptyState, SearchBar } from "@ez/ui";
import type { Job } from "@ez/types";
import { SearchX } from "lucide-react";
import * as React from "react";
import { JobCard } from "./job-card";

const FILTERS = [
  { id: "remote", label: "Remote" },
  { id: "full_time", label: "Full-time" },
  { id: "senior", label: "Senior" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export interface JobSearchProps {
  jobs: Job[];
}

export function JobSearch({ jobs }: JobSearchProps) {
  const [query, setQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Set<FilterId>>(new Set());

  function toggleFilter(id: FilterId) {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      query.trim().length === 0 ||
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase());

    const matchesRemote = !activeFilters.has("remote") || job.isRemote;
    const matchesFullTime = !activeFilters.has("full_time") || job.employmentType === "full_time";
    const matchesSenior = !activeFilters.has("senior") || job.seniorityLevel === "senior";

    return matchesQuery && matchesRemote && matchesFullTime && matchesSenior;
  });

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search jobs, companies"
      />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            selected={activeFilters.has(filter.id)}
            onClick={() => toggleFilter(filter.id)}
          >
            {filter.label}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{filteredJobs.length} results</p>
      <div className="flex flex-col gap-3">
        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden="true" />}
            title="No matching opportunities"
            description="Try a different search term or clear a filter."
          />
        ) : (
          filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
