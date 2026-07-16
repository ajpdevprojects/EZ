import "server-only";

import { DEMO_RECRUITER_EMAILS, mapApplication, mapJob, mapRecruiterEmail } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { RecruiterEmail } from "@ez/types";

function mapRecruiterEmailRow(
  row: Record<string, unknown> & {
    applications?: (Record<string, unknown> & { jobs?: Parameters<typeof mapJob>[0] | null }) | null;
  },
): RecruiterEmail {
  const { applications: applicationRow, ...emailRow } = row;
  if (!applicationRow) return mapRecruiterEmail(emailRow as Parameters<typeof mapRecruiterEmail>[0]);

  const { jobs: jobRow, ...applicationOnly } = applicationRow;
  return mapRecruiterEmail(
    emailRow as Parameters<typeof mapRecruiterEmail>[0],
    applicationOnly as Parameters<typeof mapApplication>[0],
    jobRow ?? undefined,
  );
}

export async function getRecruiterEmails(userId: string, isDemo: boolean): Promise<RecruiterEmail[]> {
  if (isDemo) return DEMO_RECRUITER_EMAILS;

  const supabase = await createClient();
  if (!supabase) return DEMO_RECRUITER_EMAILS;

  const { data } = await supabase
    .from("recruiter_emails")
    .select("*, applications(*, jobs(*))")
    .eq("user_id", userId)
    .order("received_at", { ascending: false });

  return (data ?? []).map((row) => mapRecruiterEmailRow(row as never));
}

export async function getRecruiterEmailById(
  userId: string,
  emailId: string,
  isDemo: boolean,
): Promise<RecruiterEmail | null> {
  const emails = await getRecruiterEmails(userId, isDemo);
  return emails.find((email) => email.id === emailId) ?? null;
}

export async function getUnreadRecruiterEmailCount(userId: string, isDemo: boolean): Promise<number> {
  const emails = await getRecruiterEmails(userId, isDemo);
  return emails.filter((email) => !email.readAt).length;
}
