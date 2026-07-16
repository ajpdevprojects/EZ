"use client";

import { markNotificationReadAction } from "@/features/notifications/actions";
import { formatRelativeTime, NOTIFICATION_TYPE_LABEL } from "@ez/lib";
import { Badge, Card, CardContent } from "@ez/ui";
import type { Notification } from "@ez/types";
import { Bell } from "lucide-react";
import * as React from "react";

export function NotificationItem({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = React.useState(Boolean(notification.readAt));
  const [isPending, startTransition] = React.useTransition();

  function handleClick() {
    if (isRead) return;
    startTransition(async () => {
      const result = await markNotificationReadAction(notification.id);
      if (!result.error) setIsRead(true);
    });
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleClick();
      }}
      className={isRead ? "cursor-default" : "cursor-pointer border-primary/30 bg-primary/5"}
      aria-disabled={isPending}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Bell className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{notification.title}</p>
            {!isRead && <Badge variant="new">New</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{notification.body}</p>
          <p className="text-xs text-muted-foreground">
            {NOTIFICATION_TYPE_LABEL[notification.type]} · {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
