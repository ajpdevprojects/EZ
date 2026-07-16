import { describe, expect, it, vi } from "vitest";

vi.mock("@ez/lib", () => ({ buildElizabethAgent: () => ({}) }));
vi.mock("ai", () => ({ createAgentUIStreamResponse: () => new Response(null, { status: 200 }) }));

import { POST } from "./route";

describe("POST /api/assistant", () => {
  it("returns 400 instead of crashing on a malformed request body", async () => {
    const request = new Request("https://example.com/api/assistant", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("streams a response for a well-formed request", async () => {
    const request = new Request("https://example.com/api/assistant", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
