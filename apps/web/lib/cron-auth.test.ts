import { afterEach, describe, expect, it } from "vitest";
import { verifyCronRequest } from "./cron-auth";

describe("verifyCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("rejects with 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const response = verifyCronRequest(new Request("https://example.com/api/cron/ingest-jobs"));
    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);
  });

  it("rejects with 401 when the bearer token does not match", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const response = verifyCronRequest(
      new Request("https://example.com/api/cron/ingest-jobs", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );
    expect(response?.status).toBe(401);
  });

  it("allows the request through when the bearer token matches", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const response = verifyCronRequest(
      new Request("https://example.com/api/cron/ingest-jobs", {
        headers: { authorization: "Bearer correct-secret" },
      }),
    );
    expect(response).toBeNull();
  });
});
