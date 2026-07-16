import { Card, CardContent } from "@ez/ui";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  ChevronRight,
  Compass,
  FileStack,
  FileText,
  Inbox,
  Plug,
} from "lucide-react";
import Link from "next/link";

const HUB_ITEMS = [
  { href: "/resume", label: "Resumes", description: "Build and manage your resumes", icon: FileText },
  { href: "/documents", label: "Documents Center", description: "Cover letters and uploaded files", icon: FileStack },
  { href: "/inbox", label: "Inbox", description: "Recruiter emails, organized and linked", icon: Inbox },
  { href: "/interviews", label: "Interview Center", description: "Schedule and prep for interviews", icon: CalendarClock },
  { href: "/companies", label: "Company Workspace", description: "Everything organized by company", icon: Building2 },
  { href: "/coach", label: "Career Coach", description: "Goals, guidance, and next steps", icon: Compass },
  { href: "/journey", label: "Career Journey", description: "Your journeys, active and archived", icon: Briefcase },
  { href: "/learning", label: "Learning Hub", description: "Grow your skills", icon: BookOpen },
  { href: "/analytics", label: "Analytics", description: "How your search is going", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", description: "Your journey updates", icon: Bell },
  { href: "/settings/integrations", label: "Integrations", description: "Gmail, Calendar, Drive, LinkedIn", icon: Plug },
];

export function HubMenu() {
  return (
    <Card>
      <CardContent className="flex flex-col divide-y divide-border p-0">
        {HUB_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-muted"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <item.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
