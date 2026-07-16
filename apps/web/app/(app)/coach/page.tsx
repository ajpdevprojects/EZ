import { AssistantChat, type AssistantSuggestion } from "@/features/assistant/components/assistant-chat";
import { CoachingChecklist } from "@/features/coach/components/coaching-checklist";
import { GoalsEditor } from "@/features/coach/components/goals-editor";
import { getCoachingChecklist } from "@/features/coach/data";
import { getCurrentSession } from "@/lib/session";
import { isAiConfigured } from "@ez/lib";
import { PageHeader } from "@ez/ui";
import { redirect } from "next/navigation";

const COACHING_SUGGESTIONS: AssistantSuggestion[] = [
  { icon: "goal", label: "Help me set a career goal", prompt: "Can you help me set a clear career goal for the next 6 months?" },
  { icon: "progress", label: "What should I focus on this month?", prompt: "Based on my current progress, what should I focus on this month?" },
  { icon: "review", label: "Review my progress", prompt: "Can you review my job search progress and give me honest feedback?" },
];

export default async function CareerCoachPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const checklist = await getCoachingChecklist(session.profile.id, session.isDemo);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Career Coach" description="Set your direction and get guidance along the way." />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Your next steps</h2>
        <CoachingChecklist items={checklist} />
      </section>

      <section className="flex flex-col gap-3">
        <GoalsEditor profile={session.profile} />
      </section>

      <section className="flex flex-1 flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Coaching session</h2>
        <AssistantChat
          aiConfigured={isAiConfigured()}
          greeting="Hi, I'm Elizabeth. Let's talk about where you want your career to go."
          suggestions={COACHING_SUGGESTIONS}
          unavailableTitle="Coaching sessions aren't available yet"
          unavailableDescription="Connect an AI provider to talk through your goals with Elizabeth. You can still track goals and next steps above."
        />
      </section>
    </main>
  );
}
