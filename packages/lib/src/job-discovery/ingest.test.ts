import { describe, expect, it } from "vitest";
import { ingestJobsFromAllSources } from "./ingest";
import type { JobSourceAdapter, NormalizedJob } from "./types";

function makeNormalizedJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    title: "Frontend Engineer",
    company: "Acme",
    location: "Remote",
    isRemote: true,
    employmentType: "full_time",
    seniorityLevel: "mid",
    salaryMin: null,
    salaryMax: null,
    description: "",
    skills: ["React"],
    applyUrl: "https://example.com/apply",
    postedAt: new Date().toISOString(),
    source: "remoteok",
    sourceId: "1",
    ...overrides,
  };
}

function createFakeSupabase(
  opts: { existingSourceIds?: string[]; upsertError?: Error | null; archivedIds?: string[] } = {},
) {
  const { existingSourceIds = [], upsertError = null, archivedIds = [] } = opts;
  const upsertedRows: unknown[] = [];
  const runs: Record<string, Record<string, unknown>> = {};
  let runCounter = 0;

  function jobsTable() {
    return {
      select(_cols: string) {
        return {
          eq(_col: string, _val: string) {
            return {
              in(_col2: string, ids: string[]) {
                return Promise.resolve({
                  data: ids.filter((id) => existingSourceIds.includes(id)).map((id) => ({ source_id: id })),
                });
              },
            };
          },
        };
      },
      upsert(rows: unknown[]) {
        upsertedRows.push(...rows);
        return Promise.resolve({ error: upsertError });
      },
      update(_patch: unknown) {
        return {
          eq() {
            return {
              eq() {
                return {
                  lt() {
                    return {
                      select(_c: string) {
                        return Promise.resolve({ data: archivedIds.map((id) => ({ id })) });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  function runsTable() {
    return {
      insert(row: Record<string, unknown>) {
        const id = `run-${++runCounter}`;
        runs[id] = { id, ...row };
        return {
          select() {
            return { single: async () => ({ data: runs[id] }) };
          },
        };
      },
      update(patch: Record<string, unknown>) {
        return {
          eq(_col: string, id: string) {
            Object.assign(runs[id], patch);
            return Promise.resolve({ data: null });
          },
        };
      },
    };
  }

  const client = {
    from(table: string) {
      if (table === "jobs") return jobsTable();
      if (table === "job_ingestion_runs") return runsTable();
      throw new Error(`Unexpected table ${table}`);
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, upsertedRows, runs };
}

function makeSource(fetchJobs: () => Promise<NormalizedJob[]>): JobSourceAdapter {
  return { id: "remoteok", label: "RemoteOK", fetchJobs };
}

describe("ingestJobsFromAllSources", () => {
  it("creates new jobs and records a succeeded run", async () => {
    const { client, upsertedRows, runs } = createFakeSupabase();
    const source = makeSource(async () => [
      makeNormalizedJob({ sourceId: "1", title: "Frontend Engineer" }),
      makeNormalizedJob({ sourceId: "2", title: "Backend Engineer" }),
    ]);

    const summaries = await ingestJobsFromAllSources(client, [source]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ jobsFound: 2, jobsCreated: 2, jobsUpdated: 0, error: null });
    expect(upsertedRows).toHaveLength(2);
    expect(Object.values(runs)[0]).toMatchObject({ status: "succeeded", jobs_created: 2 });
  });

  it("counts already-known source ids as updates, not creates", async () => {
    const { client } = createFakeSupabase({ existingSourceIds: ["1"] });
    const source = makeSource(async () => [
      makeNormalizedJob({ sourceId: "1", title: "Frontend Engineer" }),
      makeNormalizedJob({ sourceId: "2", title: "Backend Engineer" }),
    ]);

    const [summary] = await ingestJobsFromAllSources(client, [source]);

    expect(summary.jobsCreated).toBe(1);
    expect(summary.jobsUpdated).toBe(1);
  });

  it("dedupes before upserting", async () => {
    const { client, upsertedRows } = createFakeSupabase();
    const source = makeSource(async () => [makeNormalizedJob({ sourceId: "1" }), makeNormalizedJob({ sourceId: "1" })]);

    const [summary] = await ingestJobsFromAllSources(client, [source]);

    expect(summary.jobsFound).toBe(1);
    expect(upsertedRows).toHaveLength(1);
  });

  it("records a failed run and returns the error when the source throws", async () => {
    const { client, runs } = createFakeSupabase();
    const source = makeSource(async () => {
      throw new Error("network unreachable");
    });

    const [summary] = await ingestJobsFromAllSources(client, [source]);

    expect(summary.error).toBe("network unreachable");
    expect(Object.values(runs)[0]).toMatchObject({ status: "failed", error: "network unreachable" });
  });

  it("surfaces an upsert error without throwing", async () => {
    const { client } = createFakeSupabase({ upsertError: new Error("constraint violation") });
    const source = makeSource(async () => [makeNormalizedJob()]);

    const [summary] = await ingestJobsFromAllSources(client, [source]);
    expect(summary.error).toBe("constraint violation");
  });
});
