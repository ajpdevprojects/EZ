import { JobSearch } from "@/features/jobs/components/job-search";
import { getAllJobs } from "@/features/jobs/data";

export default async function SearchPage() {
  const jobs = await getAllJobs();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">Search</h1>
      <JobSearch jobs={jobs} />
    </main>
  );
}
