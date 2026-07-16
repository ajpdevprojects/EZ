import { getAnalyticsSummary } from "@/features/analytics/data";
import { getCurrentSession } from "@/lib/session";
import { BarChart, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, StatTile } from "@ez/ui";
import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const summary = await getAnalyticsSummary(session.profile.id, session.isDemo);

  if (summary.totalApplications === 0) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
        <PageHeader title="Analytics" description="How your job search is going." />
        <EmptyState
          icon={<BarChart3 className="size-6" aria-hidden="true" />}
          title="Nothing to analyze yet"
          description="Apply to a few jobs and check back — I'll track your progress here."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Analytics" description="How your job search is going." />

      <div className="flex gap-3">
        <StatTile label="Response rate" value={`${summary.responseRatePercent}%`} />
        <StatTile
          label="Avg. days to interview"
          value={summary.averageDaysToInterview ?? "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={summary.statusCounts} caption="Applications by pipeline stage" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications over time</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={summary.applicationsPerWeek} caption="Applications submitted per week, last 6 weeks" />
        </CardContent>
      </Card>
    </main>
  );
}
