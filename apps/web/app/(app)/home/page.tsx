import { DailyPriorities } from "@/features/home/components/daily-priorities";
import { OpportunityList } from "@/features/home/components/opportunity-list";
import { QuickLinks } from "@/features/home/components/quick-links";
import { getCurrentSession } from "@/lib/session";
import { getDailyBriefing } from "@/features/home/data";
import { EmptyState, StatTile } from "@ez/ui";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const briefing = await getDailyBriefing(session.profile, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {briefing.greetingName}
        </h1>
      </header>

      <div className="flex gap-3">
        <StatTile label="Applications" value={briefing.applicationsInProgress} />
        <StatTile label="Interviews" value={briefing.interviewsUpcoming} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Today&apos;s priorities</h2>
        <DailyPriorities priorities={briefing.dailyPriorities} />
      </section>

      <QuickLinks />

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-foreground">Today&apos;s opportunities</h2>
        </div>
        {briefing.recommendedJobs.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-6" aria-hidden="true" />}
            title="No new opportunities right now"
            description="Check back soon — I'm continuously discovering new roles for you."
          />
        ) : (
          <OpportunityList jobs={briefing.recommendedJobs} matches={briefing.recommendedMatches} />
        )}
      </section>
    </main>
  );
}
