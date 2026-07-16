"use server";

import { createClient } from "@ez/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Notifications aren't available yet — Supabase hasn't been configured." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) return { error: error.message };

  revalidatePath("/notifications");
  return {};
}

export async function markAllNotificationsReadAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Notifications aren't available yet — Supabase hasn't been configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };

  revalidatePath("/notifications");
  return {};
}
