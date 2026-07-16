import { getCurrentSession } from "@/lib/session";
import { BottomNav, type BottomNavItem } from "@ez/ui";
import { Briefcase, Home, Search, Sparkles, User } from "lucide-react";
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

  return (
    <div className="flex flex-1 flex-col pb-24">
      {children}
      <BottomNav items={NAV_ITEMS} />
    </div>
  );
}
