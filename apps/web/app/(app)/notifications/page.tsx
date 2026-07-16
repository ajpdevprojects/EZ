import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { getMyNotifications } from "@/features/notifications/data";
import { getCurrentSession } from "@/lib/session";
import { EmptyState, PageHeader } from "@ez/ui";
import { Bell } from "lucide-react";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const notifications = await getMyNotifications(session.profile.id, session.isDemo);
  const hasUnread = notifications.some((notification) => !notification.readAt);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Notifications"
        description="Updates about your journey, as they happen."
        actions={hasUnread ? <MarkAllReadButton /> : undefined}
      />

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-6" aria-hidden="true" />}
            title="No notifications yet"
            description="I'll let you know as your journey moves forward."
          />
        ) : (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </main>
  );
}
