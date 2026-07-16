import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex size-2.5 rounded-full bg-primary" aria-hidden="true" />
      )}
    </Link>
  );
}
