import "server-only";

import { DEMO_PROFILE, mapProfile } from "@ez/lib";
import { createClient } from "@ez/lib/supabase/server";
import type { Profile } from "@ez/types";

export interface SessionResult {
  profile: Profile;
  isDemo: boolean;
}

/**
 * Resolves the signed-in professional's profile. Falls back to demo data
 * when Supabase has not been configured so the product can be explored
 * end to end without live credentials. Returns null when Supabase IS
 * configured but no one is signed in.
 *
 * IMPORTANT: a missing/unreadable profiles row is NOT the same thing as
 * "not signed in" — auth.getUser() above already proved there's a valid,
 * authenticated session. Treating the two identically previously caused
 * genuinely signed-in users to be silently bounced back to /sign-in by
 * every session-gated page, with no error visible anywhere (the profile
 * query's error is swallowed by design in the client, not thrown). This
 * self-heals by creating the row that public.handle_new_user() should
 * already have created on signup — a safety net for whenever that
 * trigger didn't run (schema drift, a migration that failed partway,
 * a user created before the trigger existed), not the primary mechanism.
 */
export async function getCurrentSession(): Promise<SessionResult | null> {
  const supabase = await createClient();

  if (!supabase) {
    return { profile: DEMO_PROFILE, isDemo: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileRow) {
    return { profile: mapProfile(profileRow), isDemo: false };
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  const { data: createdRow } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email ?? "", full_name: fullName })
    .select()
    .single();

  if (!createdRow) return null;

  return { profile: mapProfile(createdRow), isDemo: false };
}
