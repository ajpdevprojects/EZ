import { verifyCronRequest } from "@/lib/cron-auth";
import { createServiceClient } from "@ez/lib/supabase/service";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const REMINDER_WINDOW_MS = 1000 * 60 * 60 * 24;

/**
 * Software Engine background job: creates a Journey Notification for any
 * scheduled interview happening within the next 24 hours that doesn't
 * already have one. Idempotent — safe to run on every tick. Triggered on
 * a schedule by Vercel Cron (see apps/web/vercel.json) behind CRON_SECRET.
 */
export async function GET(request: Request) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured — interview reminders are disabled." },
      { status: 503 },
    );
  }

  const windowStart = new Date().toISOString();
  const windowEnd = new Date(Date.now() + REMINDER_WINDOW_MS).toISOString();

  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, user_id, application_id, scheduled_at, interview_type")
    .eq("status", "scheduled")
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let remindersCreated = 0;

  for (const interview of interviews ?? []) {
    const { data: existingReminder } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", interview.user_id)
      .eq("type", "interview_reminder")
      .contains("metadata", { interviewId: interview.id })
      .maybeSingle();

    if (existingReminder) continue;

    const { data: application } = await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("id", interview.application_id)
      .single();

    const job = (application as { jobs?: { title: string; company: string } | null } | null)?.jobs;
    const body = job
      ? `Your ${interview.interview_type} interview for ${job.title} at ${job.company} is coming up.`
      : "You have an interview coming up.";

    const { error: insertError } = await supabase.from("notifications").insert({
      user_id: interview.user_id,
      type: "interview_reminder",
      title: "Interview reminder",
      body,
      metadata: { interviewId: interview.id },
    });

    if (!insertError) remindersCreated++;
  }

  return NextResponse.json({ remindersCreated });
}
