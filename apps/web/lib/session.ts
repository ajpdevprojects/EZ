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

  if (!profileRow) return null;

  return { profile: mapProfile(profileRow), isDemo: false };
}
