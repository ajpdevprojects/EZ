import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Captures the cookie callbacks updateSession wires into createServerClient
// so each test can drive setAll exactly the way @supabase/ssr does.
let capturedCookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: object }[]) => void;
} | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, opts: { cookies: never }) => {
    capturedCookies = opts.cookies;
    return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } };
  },
}));

import { updateSession } from "./proxy";

function makeRequest(cookies: Record<string, string> = {}): NextRequest {
  const request = new NextRequest("http://localhost/home");
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

describe("updateSession cookie handling", () => {
  beforeEach(() => {
    capturedCookies = null;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("applies refreshed session cookies to the response, including stale-chunk cleanup", async () => {
    const request = makeRequest({
      "sb-x-auth-token.0": "old0",
      "sb-x-auth-token.1": "old1",
      "sb-x-auth-token.2": "old2",
    });
    const responsePromise = updateSession(request);
    // A successful rotation that needs fewer chunks: two sets plus one removal.
    capturedCookies!.setAll([
      { name: "sb-x-auth-token.0", value: "new0" },
      { name: "sb-x-auth-token.1", value: "new1" },
      { name: "sb-x-auth-token.2", value: "", options: { maxAge: 0 } },
    ]);
    const response = await responsePromise;

    expect(response.cookies.get("sb-x-auth-token.0")?.value).toBe("new0");
    expect(response.cookies.get("sb-x-auth-token.1")?.value).toBe("new1");
    expect(response.cookies.get("sb-x-auth-token.2")?.value).toBe("");
    // The mutated request the Server Component render sees must carry the
    // refreshed values too.
    expect(request.cookies.get("sb-x-auth-token.0")?.value).toBe("new0");
  });

  it("suppresses an all-deletions setAll (failed-refresh session wipe) so a lost refresh race cannot sign the user out", async () => {
    const request = makeRequest({
      "sb-x-auth-token.0": "current0",
      "sb-x-auth-token.1": "current1",
    });
    const responsePromise = updateSession(request);
    // What the SDK emits when getUser()'s refresh fails (e.g. this request
    // lost the single-use refresh-token race to a concurrent request): a
    // wipe of every session cookie, nothing set.
    capturedCookies!.setAll([
      { name: "sb-x-auth-token.0", value: "", options: { maxAge: 0 } },
      { name: "sb-x-auth-token.1", value: "", options: { maxAge: 0 } },
    ]);
    const response = await responsePromise;

    // Neither the browser response nor the downstream request may see the
    // deletions — the winner's cookies in the browser stay intact.
    expect(response.cookies.get("sb-x-auth-token.0")).toBeUndefined();
    expect(response.cookies.get("sb-x-auth-token.1")).toBeUndefined();
    expect(request.cookies.get("sb-x-auth-token.0")?.value).toBe("current0");
    expect(request.cookies.get("sb-x-auth-token.1")?.value).toBe("current1");
  });

  it("no-ops when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const response = await updateSession(makeRequest());
    expect(capturedCookies).toBeNull();
    expect(response).toBeDefined();
  });
});
