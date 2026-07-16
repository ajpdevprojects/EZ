"use server";

import { getMyApplications } from "@/features/applications/data";
import { getRecruiterEmailById } from "@/features/inbox/data";
import { createNotification, recordMilestone } from "@/lib/journey-events";
import { getCurrentSession } from "@/lib/session";
import { categorizeEmail, findLikelyApplication, generateElizabethText, recruiterEmailSchema } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AddRecruiterEmailInput {
  fromName?: string;
  fromEmail: string;
  subject: string;
  body: string;
}

/**
 * Adds a recruiter email manually (paste-in) — the credential-free Gmail
 * substitute. Deterministically categorizes it and links it to the most
 * likely application before anything touches the database or AI.
 */
export async function addRecruiterEmailAction(input: AddRecruiterEmailInput): Promise<{ error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { error: "You need to be signed in." };

  const parsed = recruiterEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the email details and try again." };
  }

  if (session.isDemo) {
    return { error: "Connect Supabase to save recruiter emails — you're viewing a read-only demo." };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Recruiter Inbox requires Supabase to be configured." };

  const applications = await getMyApplications(session.profile.id, false);
  const category = categorizeEmail(parsed.data.subject, parsed.data.body);
  const application = findLikelyApplication(parsed.data.fromEmail, parsed.data.subject, parsed.data.body, applications);

  const { error } = await supabase.from("recruiter_emails").insert({
    user_id: session.profile.id,
    application_id: application?.id ?? null,
    source: "manual",
    from_name: parsed.data.fromName || null,
    from_email: parsed.data.fromEmail,
    subject: parsed.data.subject,
    body: parsed.data.body,
    category,
    received_at: new Date().toISOString(),
  });

  if (error) return { error: "Couldn't save this email — please try again." };

  if (application) {
    await recordMilestone(supabase, application.id, "recruiter_replied");
    await createNotification(
      supabase,
      session.profile.id,
      "recruiter_replied",
      "Recruiter replied",
      `${parsed.data.fromName || parsed.data.fromEmail} replied about ${application.job?.title ?? "your application"}.`,
      { applicationId: application.id },
    );
  }

  revalidatePath("/inbox");
  revalidatePath("/notifications");
  if (application) revalidatePath(`/journey/${application.id}`);

  return {};
}

export async function markRecruiterEmailReadAction(emailId: string): Promise<{ error?: string }> {
  const session = await getCurrentSession();
  if (!session || session.isDemo) return {};

  const supabase = await createClient();
  if (!supabase) return {};

  await supabase
    .from("recruiter_emails")
    .update({ read_at: new Date().toISOString() })
    .eq("id", emailId)
    .eq("user_id", session.profile.id);

  revalidatePath("/inbox");
  return {};
}

/**
 * Drafts a reply for the user to review and send themselves — AI never
 * sends on the user's behalf (Product Philosophy: automation never
 * removes meaningful decisions).
 */
export async function draftRecruiterReplyAction(emailId: string): Promise<{ draft?: string; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { error: "You need to be signed in." };

  const email = await getRecruiterEmailById(session.profile.id, emailId, session.isDemo);
  if (!email) return { error: "Couldn't find that email." };

  const prompt = `Draft a warm, professional reply to this recruiter email. Keep it under 120 words and do not include a subject line.\n\nFrom: ${email.fromName ?? email.fromEmail}\nSubject: ${email.subject}\n\n${email.body}`;
  const result = await generateElizabethText(prompt);
  if (!result) {
    return {
      error: "Ask EZ isn't available yet — connect an AI provider to draft a reply. You're welcome to write your own.",
    };
  }

  if (!session.isDemo) {
    const supabase = await createClient();
    if (supabase) {
      await supabase
        .from("recruiter_emails")
        .update({ draft_reply: result.text })
        .eq("id", emailId)
        .eq("user_id", session.profile.id);
      revalidatePath("/inbox");
    }
  }

  return { draft: result.text };
}
