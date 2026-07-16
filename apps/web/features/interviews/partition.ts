import type { Interview } from "@ez/types";

export function partitionInterviews(interviews: Interview[]) {
  const now = Date.now();

  const upcoming = interviews.filter(
    (interview) => interview.status === "scheduled" && new Date(interview.scheduledAt).getTime() >= now,
  );
  const past = interviews.filter(
    (interview) => interview.status !== "scheduled" || new Date(interview.scheduledAt).getTime() < now,
  );

  return { upcoming, past };
}
