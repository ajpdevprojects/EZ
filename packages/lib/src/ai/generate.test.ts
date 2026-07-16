import { describe, expect, it, vi } from "vitest";

const generateTextMock = vi.hoisted(() => vi.fn());
const resolveAiModelMock = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({ generateText: generateTextMock }));
vi.mock("./provider", () => ({ resolveAiModel: resolveAiModelMock }));

import { generateElizabethText } from "./generate";

describe("generateElizabethText", () => {
  it("returns null when no provider is configured, without calling the model", async () => {
    resolveAiModelMock.mockReturnValue(null);

    const result = await generateElizabethText("hello");

    expect(result).toBeNull();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("returns the generated text when the provider call succeeds", async () => {
    resolveAiModelMock.mockReturnValue({ provider: "anthropic", model: {} });
    generateTextMock.mockResolvedValue({ text: "Here is your draft." });

    const result = await generateElizabethText("hello");

    expect(result).toEqual({ text: "Here is your draft." });
  });

  it("degrades to null instead of throwing when the provider call fails (timeout, rate limit, outage)", async () => {
    resolveAiModelMock.mockReturnValue({ provider: "anthropic", model: {} });
    generateTextMock.mockRejectedValue(new Error("upstream timeout"));

    const result = await generateElizabethText("hello");

    expect(result).toBeNull();
  });
});
