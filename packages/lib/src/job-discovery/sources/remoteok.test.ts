import { describe, expect, it, vi } from "vitest";
import { remoteOkSource } from "./remoteok";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("remoteOkSource", () => {
  it("skips the legal-notice entry and normalizes real jobs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { legal: "https://remoteok.com/legal" },
        {
          id: 123,
          position: "Senior React Developer",
          company: "Acme",
          tags: ["react", "typescript"],
          location: "Worldwide",
          description: "<p>Build things</p>",
          url: "https://remoteok.com/jobs/123",
          date: "2026-01-01T00:00:00.000Z",
          salary_min: 90000,
          salary_max: 120000,
        },
      ]),
    );

    const jobs = await remoteOkSource.fetchJobs(fetchMock);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: "Senior React Developer",
      company: "Acme",
      isRemote: true,
      source: "remoteok",
      sourceId: "123",
      salaryMin: 90000,
      salaryMax: 120000,
      description: "Build things",
    });
    expect(jobs[0].seniorityLevel).toBe("senior");
  });

  it("skips entries missing required fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }, { position: "No company" }]));
    const jobs = await remoteOkSource.fetchJobs(fetchMock);
    expect(jobs).toHaveLength(0);
  });

  it("throws when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 503));
    await expect(remoteOkSource.fetchJobs(fetchMock)).rejects.toThrow(/503/);
  });
});
