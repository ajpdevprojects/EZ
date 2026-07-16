import { describe, expect, it, vi } from "vitest";
import { remotiveSource } from "./remotive";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("remotiveSource", () => {
  it("normalizes jobs including salary parsing and job type mapping", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        jobs: [
          {
            id: 456,
            url: "https://remotive.com/jobs/456",
            title: "Junior Data Analyst",
            company_name: "Globex",
            category: "Data",
            tags: ["sql", "python"],
            job_type: "contract",
            publication_date: "2026-01-02T00:00:00.000Z",
            candidate_required_location: "USA",
            salary: "$60,000 - $80,000",
            description: "<p>Analyze data</p>",
          },
        ],
      }),
    );

    const jobs = await remotiveSource.fetchJobs(fetchMock);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Junior Data Analyst",
      company: "Globex",
      employmentType: "contract",
      seniorityLevel: "entry",
      salaryMin: 60000,
      salaryMax: 80000,
      source: "remotive",
      sourceId: "456",
    });
    expect(jobs[0].skills).toContain("sql");
    expect(jobs[0].skills).toContain("Data");
  });

  it("skips entries missing required fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ jobs: [{ id: 1 }] }));
    const jobs = await remotiveSource.fetchJobs(fetchMock);
    expect(jobs).toHaveLength(0);
  });

  it("throws when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 500));
    await expect(remotiveSource.fetchJobs(fetchMock)).rejects.toThrow(/500/);
  });
});
