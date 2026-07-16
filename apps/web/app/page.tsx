import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Same reasoning as apps/web/app/(app)/layout.tsx — this route decides
// where to send every visitor based on session state, so it must never be
// statically prerendered.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/welcome");
  if (!session.isDemo && !session.profile.onboardingCompletedAt) redirect("/onboarding");

  redirect("/home");
}
