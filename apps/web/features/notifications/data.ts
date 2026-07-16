import "server-only";

import { DEMO_NOTIFICATIONS, mapNotification } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Notification } from "@ez/types";

export async function getMyNotifications(userId: string, isDemo: boolean): Promise<Notification[]> {
  if (isDemo) return DEMO_NOTIFICATIONS;

  const supabase = await createClient();
  if (!supabase) return DEMO_NOTIFICATIONS;

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string, isDemo: boolean): Promise<number> {
  if (isDemo) return DEMO_NOTIFICATIONS.filter((notification) => !notification.readAt).length;

  const supabase = await createClient();
  if (!supabase) return DEMO_NOTIFICATIONS.filter((notification) => !notification.readAt).length;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
