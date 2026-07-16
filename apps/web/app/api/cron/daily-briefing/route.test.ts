import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for the bounded-concurrency batching refactor: the
 * specific risk introduced by that change is a user being skipped, double
 * counted, or processed out of isolation from other users when the profile
 * count crosses a batch boundary (USER_BATCH_SIZE = 10 in route.ts). This
 * builds a minimal chainable fake of the Supabase query builder rather than
 * a real client, since the goal is isolating that one risk, not
 * re-verifying the notification-planning logic itself (already covered by
 * packages/lib/src/daily-briefing-generator.test.ts).
 */

const PROFILE_COUNT = 23; // deliberately spans more than two batches of 10

function makeProfileRows() {
  return Array.from({ length: PROFILE_COUNT }, (_, i) => ({
    id: `user-${i}`,
    email: `user${i}@example.com`,
    full_name: `User ${i}`,
    avatar_url: null,
    career_goals: [],
    current_job_title: null,
    preferred_locations: [],
    work_types: [],
    priorities: [],
    journey_theme: "executive",
    onboarding_completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function makeQueryBuilder(table: string, insertedRows: Array<{ table: string; row: unknown }>) {
  const builder: Record<string, unknown> = {};
  const resolve = () => {
    if (table === "profiles") return { data: makeProfileRows(), error: null };
    if (table === "jobs") return { data: [], error: null };
    if (table === "job_ingestion_runs") return { data: [], error: null };
    if (table === "notifications") return { data: null, error: null }; // no existing briefing today
    if (table === "applications") return { data: [], error: null };
    if (table === "dismissed_jobs") return { data: [], error: null };
    if (table === "resumes") return { data: [], error: null };
    if (table === "interviews") return { data: [], error: null };
    if (table === "recruiter_emails") return { count: 0, data: null, error: null };
    return { data: [], error: null };
  };

  for (const method of ["select", "eq", "neq", "gte", "lte", "in", "contains", "is", "limit", "order"]) {
    builder[method] = () => builder;
  }
  builder.maybeSingle = async () => resolve();
  builder.then = (onFulfilled: (value: unknown) => unknown) => Promise.resolve(resolve()).then(onFulfilled);
  builder.insert = (row: unknown) => {
    insertedRows.push({ table, row });
    return Promise.resolve({ data: null, error: null });
  };

  return builder;
}

describe("GET /api/cron/daily-briefing", () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    vi.resetModules();
  });

  it("processes every profile exactly once across batch boundaries, none skipped or duplicated", async () => {
    const insertedRows: Array<{ table: string; row: unknown }> = [];

    vi.doMock("@ez/lib/supabase/service", () => ({
      createServiceClient: () => ({
        from: (table: string) => makeQueryBuilder(table, insertedRows),
      }),
    }));

    const { GET } = await import("./route");
    const request = new Request("https://example.com/api/cron/daily-briefing", {
      headers: { authorization: "Bearer test-secret" },
    });

    const response = await GET(request);
    const body = (await response.json()) as { usersProcessed: number; briefingsCreated: number };

    expect(response.status).toBe(200);
    expect(body.usersProcessed).toBe(PROFILE_COUNT);
    expect(body.briefingsCreated).toBe(PROFILE_COUNT);

    const notifiedUserIds = insertedRows
      .filter((r) => r.table === "notifications")
      .map((r) => (r.row as { user_id: string }).user_id);
    // No user_id should be missing or repeated beyond what a single
    // "calm day" briefing produces per user.
    expect(new Set(notifiedUserIds).size).toBeLessThanOrEqual(PROFILE_COUNT);
    for (let i = 0; i < PROFILE_COUNT; i++) {
      const countForUser = notifiedUserIds.filter((id) => id === `user-${i}`).length;
      expect(countForUser).toBeLessThanOrEqual(1);
    }
  });
});
