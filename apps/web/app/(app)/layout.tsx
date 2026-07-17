import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/data";
import { getCurrentSession } from "@/lib/session";
import { BottomNav, type BottomNavItem, EzMark } from "@ez/ui";
import { Briefcase, Home, Search, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Every route under this layout is per-user and session-gated. Without this,
// whether these pages render dynamically depends entirely on Next.js's
// static-analysis heuristic noticing the cookies() call inside
// getCurrentSession() — which only happens when NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY are present at build time. If a build ever
// runs without them (misnamed env var, preview deploy, etc.), every page
// below gets silently prerendered once as static HTML using the signed-out
// demo profile and served to every visitor from then on. Forcing dynamic
// rendering here makes that guarantee explicit instead of implicit.
export const dynamic = "force-dynamic";

const NAV_ITEMS: BottomNavItem[] = [
  { href: "/home", label: "Home", icon: <Home className="size-5" aria-hidden="true" /> },
  { href: "/search", label: "Search", icon: <Search className="size-5" aria-hidden="true" /> },
  { href: "/assistant", label: "Assistant", icon: <Sparkles className="size-5" aria-hidden="true" /> },
  {
    href: "/applications",
    label: "Applications",
    icon: <Briefcase className="size-5" aria-hidden="true" />,
  },
  { href: "/profile", label: "Profile", icon: <User className="size-5" aria-hidden="true" /> },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  console.error("[REDIRECT-TRACE] apps/web/app/(app)/layout.tsx AppLayout() entered");

  const session = await getCurrentSession();

  console.error("[REDIRECT-TRACE] apps/web/app/(app)/layout.tsx getCurrentSession() resolved", {
    sessionIsNull: session === null,
    isDemo: session === null ? null : session.isDemo,
    profileId: session === null ? null : session.profile.id,
    onboardingCompletedAt: session === null ? null : session.profile.onboardingCompletedAt,
  });

  if (!session) {
    console.error(
      "[REDIRECT-TRACE] FIRED apps/web/app/(app)/layout.tsx:48 redirect(\"/sign-in\") — condition `!session` was true because session === null",
    );
    redirect("/sign-in");
  }
  if (!session.isDemo && !session.profile.onboardingCompletedAt) {
    console.error(
      "[REDIRECT-TRACE] FIRED apps/web/app/(app)/layout.tsx:59 redirect(\"/onboarding\") — condition `!session.isDemo && !session.profile.onboardingCompletedAt` was true",
      {
        isDemo: session.isDemo,
        onboardingCompletedAt: session.profile.onboardingCompletedAt,
        userId: session.profile.id,
      },
    );
    redirect("/onboarding");
  }

  console.error("[REDIRECT-TRACE] apps/web/app/(app)/layout.tsx AppLayout() passed both checks — rendering children", {
    userId: session.profile.id,
  });

  const unreadCount = await getUnreadNotificationCount(session.profile.id, session.isDemo);

  return (
    <div className="flex flex-1 flex-col pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Link href="/home" aria-label="EZ home">
          <EzMark className="size-8" />
        </Link>
        <NotificationBell unreadCount={unreadCount} />
      </header>
      {children}
      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}
