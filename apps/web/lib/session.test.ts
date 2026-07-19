import { beforeEach, describe, expect, it, vi } from "vitest";

// session.ts is (correctly) marked "server-only", which throws outside
// Next's RSC bundling — stub it for this test rather than weaken the
// production guard.
vi.mock("server-only", () => ({}));

/**
 * Reproduction + regression coverage for the "existing users can't proceed
 * past Sign In" bug. Root cause: getCurrentSession() treated *any* failure
 * of the profiles-row lookup (missing row, missing table, RLS denial,
 * transient error — @supabase/supabase-js's .single() doesn't throw, it
 * returns { data: null, error } for all of these) identically to "nobody
 * is signed in", even when auth.getUser() had already confirmed a valid,
 * authenticated session. See AUTH_SIGNIN_ROOT_CAUSE_REPORT.md.
 */

const MOCK_USER = {
  id: "user-123",
  email: "existing.user@example.com",
  user_metadata: { full_name: "Existing User" },
};

function makeSupabaseMock(options: {
  profileRow: Record<string, unknown> | null;
  profileError: { code?: string; message: string } | null;
  onInsert?: (row: Record<string, unknown>) => void;
}) {
  const insertedRows: Record<string, unknown>[] = [];

  return {
    auth: {
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
    },
    // Stands in for the debug_whoami() diagnostic RPC added alongside the
    // API-role-grants investigation. Not under test here (that's
    // proxy.test.ts / the migration's own SQL-level verification) — this
    // mock just needs to satisfy the call session.ts makes on the self-heal
    // path without throwing.
    rpc: () => ({
      maybeSingle: async () => ({
        data: { effective_role: "authenticated", resolved_auth_uid: MOCK_USER.id },
        error: null,
      }),
    }),
    from: (table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: options.profileRow, error: options.profileError }),
          }),
        }),
        insert: (row: Record<string, unknown>) => {
          insertedRows.push(row);
          options.onInsert?.(row);
          return {
            select: () => ({
              single: async () => ({
                data: { ...row, career_goals: [], preferred_locations: [], work_types: [], priorities: [] },
                error: null,
              }),
            }),
          };
        },
      };
    },
    __insertedRows: insertedRows,
  };
}

describe("getCurrentSession", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("REPRODUCTION: an authenticated user with no readable profile row was treated as signed out", async () => {
    // This is the exact shape @supabase/supabase-js's .single() returns
    // when the profiles table doesn't exist, RLS denies the row, or the
    // row genuinely isn't there — auth succeeded, but the profile lookup
    // failed. Before the fix, getCurrentSession() returned null for this,
    // identical to "nobody is signed in", even though supabase.auth.getUser()
    // above it had already confirmed a real, valid session.
    const mockClient = makeSupabaseMock({
      profileRow: null,
      profileError: { code: "42P01", message: 'relation "public.profiles" does not exist' },
    });

    vi.doMock("@ez/lib/supabase/server", () => ({ createClient: async () => mockClient }));
    const { getCurrentSession } = await import("./session");

    const session = await getCurrentSession();

    // Fixed behavior: self-heals by creating the missing profile row
    // instead of silently reporting the user as logged out.
    expect(session).not.toBeNull();
    expect(session?.isDemo).toBe(false);
    expect(session?.profile.id).toBe(MOCK_USER.id);
  });

  it("self-heals by creating a profile row when the lookup finds none (PGRST116 / no rows)", async () => {
    const mockClient = makeSupabaseMock({
      profileRow: null,
      profileError: { code: "PGRST116", message: "The result contains 0 rows" },
    });

    vi.doMock("@ez/lib/supabase/server", () => ({ createClient: async () => mockClient }));
    const { getCurrentSession } = await import("./session");

    const session = await getCurrentSession();

    expect(session).not.toBeNull();
    expect(session?.profile.id).toBe(MOCK_USER.id);
    expect(session?.profile.email).toBe(MOCK_USER.email);
    expect(mockClient.__insertedRows).toHaveLength(1);
    expect(mockClient.__insertedRows[0]).toMatchObject({ id: MOCK_USER.id, email: MOCK_USER.email });
  });

  it("still resolves normally when the profile row is found on the first try", async () => {
    const mockClient = makeSupabaseMock({
      profileRow: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        full_name: "Existing User",
        avatar_url: null,
        career_goals: [],
        current_job_title: null,
        preferred_locations: [],
        work_types: [],
        priorities: [],
        journey_theme: "executive",
        onboarding_completed_at: "2026-01-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      profileError: null,
    });

    vi.doMock("@ez/lib/supabase/server", () => ({ createClient: async () => mockClient }));
    const { getCurrentSession } = await import("./session");

    const session = await getCurrentSession();

    expect(session?.profile.id).toBe(MOCK_USER.id);
    expect(session?.profile.onboardingCompletedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(mockClient.__insertedRows).toHaveLength(0);
  });

  it("returns null when there is genuinely no authenticated user", async () => {
    const mockClient = {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      from: () => {
        throw new Error("must not query profiles without a user");
      },
    };

    vi.doMock("@ez/lib/supabase/server", () => ({ createClient: async () => mockClient }));
    const { getCurrentSession } = await import("./session");

    const session = await getCurrentSession();

    expect(session).toBeNull();
  });
});
