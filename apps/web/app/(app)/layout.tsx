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
  const session = await getCurrentSession();

  if (!session) {
    console.error("[AppLayout] getCurrentSession() returned null — redirecting to /sign-in");
    redirect("/sign-in");
  }
  if (!session.isDemo && !session.profile.onboardingCompletedAt) {
    console.error("[AppLayout] session found but onboarding incomplete — redirecting to /onboarding", {
      userId: session.profile.id,
    });
    redirect("/onboarding");
  }

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
