import { JobCard } from "@/features/jobs/components/job-card";
import { getCurrentSession } from "@/lib/session";
import { getDailyBriefing } from "@/features/home/data";
import { StatTile } from "@ez/ui";
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

      {briefing.nextAction && (
        <div className="flex items-start gap-3 rounded-3xl border border-primary/30 bg-primary/10 p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">Today&apos;s next step</p>
            <p className="text-sm text-muted-foreground">{briefing.nextAction}</p>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Recommended for you</h2>
        <div className="flex flex-col gap-3">
          {briefing.recommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </main>
  );
}
