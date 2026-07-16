import { BookOpen, Briefcase, Compass, FileStack } from "lucide-react";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/coach", label: "Career Coach", icon: Compass },
  { href: "/journey", label: "Career Journey", icon: Briefcase },
  { href: "/learning", label: "Learning Hub", icon: BookOpen },
  { href: "/documents", label: "Documents", icon: FileStack },
];

export function QuickLinks() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40"
        >
          <link.icon className="size-5 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">{link.label}</span>
        </Link>
      ))}
    </div>
  );
}
