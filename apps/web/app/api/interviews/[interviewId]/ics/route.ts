import { getInterviewById } from "@/features/interviews/data";
import { getCurrentSession } from "@/lib/session";
import { buildIcsEvent } from "@ez/lib";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { interviewId } = await params;
  const interview = await getInterviewById(session.profile.id, interviewId, session.isDemo);
  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  const job = interview.application?.job;
  const title = job ? `Interview: ${job.title} at ${job.company}` : "Interview";
  const description = [
    interview.notes,
    job ? `Role: ${job.title} at ${job.company}` : null,
    `Type: ${interview.interviewType}`,
  ]
    .filter(Boolean)
    .join("\n");

  const ics = buildIcsEvent({
    uid: interview.id,
    title,
    description,
    location: interview.locationOrLink ?? "",
    startIso: interview.scheduledAt,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="interview-${interview.id}.ics"`,
    },
  });
}
