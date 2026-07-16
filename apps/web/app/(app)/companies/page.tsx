import { getMyCompanies } from "@/features/companies/data";
import { getCurrentSession } from "@/lib/session";
import { formatRelativeTime } from "@ez/lib";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@ez/ui";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CompaniesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const companies = await getMyCompanies(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Company Workspace" description="Every company you've engaged with, in one place." />

      {companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6" aria-hidden="true" />}
          title="No companies yet"
          description="Apply to a job and it will show up here, organized by company."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((entry) => (
            <Link key={entry.company} href={`/companies/${encodeURIComponent(entry.company)}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Building2 className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="font-display text-base font-semibold text-foreground">{entry.company}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.applications.length} application{entry.applications.length === 1 ? "" : "s"} · updated{" "}
                      {formatRelativeTime(entry.lastActivityAt)}
                    </p>
                  </div>
                  <Badge variant="neutral">{entry.applications.length}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
