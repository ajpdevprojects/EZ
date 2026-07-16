import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/welcome");
  if (!session.isDemo && !session.profile.onboardingCompletedAt) redirect("/onboarding");

  redirect("/home");
}
