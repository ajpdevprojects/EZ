import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/data";
import { getCurrentSession } from "@/lib/session";
import { BottomNav, type BottomNavItem, EzMark } from "@ez/ui";
import { Briefcase, Home, Search, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  if (!session) redirect("/sign-in");
  if (!session.isDemo && !session.profile.onboardingCompletedAt) redirect("/onboarding");

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
