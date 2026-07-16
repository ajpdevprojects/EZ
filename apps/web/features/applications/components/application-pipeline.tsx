"use client";

import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from "@ez/ui";
import type { Application } from "@ez/types";
import { Briefcase } from "lucide-react";
import { ApplicationCard } from "./application-card";

const TABS = [
  { value: "all", label: "All", filter: () => true },
  { value: "applied", label: "Applied", filter: (application: Application) => application.status === "applied" },
  {
    value: "interviewing",
    label: "Interviews",
    filter: (application: Application) => application.status === "interviewing",
  },
  { value: "offer", label: "Offers", filter: (application: Application) => application.status === "offer" },
] as const;

export function ApplicationPipeline({ applications }: { applications: Application[] }) {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => {
        const filtered = applications.filter(tab.filter);
        return (
          <TabsContent key={tab.value} value={tab.value} className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="size-6" aria-hidden="true" />}
                title="Nothing here yet"
                description="Applications will appear here as your journey progresses."
              />
            ) : (
              filtered.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
