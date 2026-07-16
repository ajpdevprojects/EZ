import { verifyCronRequest } from "@/lib/cron-auth";
import { ingestJobsFromAllSources } from "@ez/lib";
import { createServiceClient } from "@ez/lib/supabase/service";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Software Engine job discovery: fetches from every public job source,
 * normalizes, dedupes, and upserts into the shared `jobs` catalog. AI is
 * never invoked here. Triggered on a schedule by Vercel Cron (see
 * apps/web/vercel.json) behind CRON_SECRET.
 */
export async function GET(request: Request) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured — job ingestion is disabled." },
      { status: 503 },
    );
  }

  const summaries = await ingestJobsFromAllSources(supabase);
  const hasErrors = summaries.some((summary) => summary.error !== null);

  return NextResponse.json({ summaries }, { status: hasErrors ? 207 : 200 });
}
