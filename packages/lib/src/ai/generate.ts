import { generateText } from "ai";
import { ELIZABETH_SYSTEM_PROMPT } from "./prompts";
import { resolveAiModel } from "./provider";

export interface AiTextResult {
  text: string;
}

/**
 * One-shot AI text generation for a single task (resume feedback, cover
 * letter drafts, career coaching suggestions) — distinct from the
 * multi-turn Ask EZ conversation. Returns null when no provider is
 * configured so callers can fall back to a human-only path, per the
 * Product Philosophy: AI enhances, it never becomes a requirement.
 */
const GENERATION_TIMEOUT_MS = 30_000;

export async function generateElizabethText(prompt: string): Promise<AiTextResult | null> {
  const resolved = resolveAiModel();
  if (!resolved) return null;

  try {
    const { text } = await generateText({
      model: resolved.model,
      system: ELIZABETH_SYSTEM_PROMPT,
      prompt,
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    return { text };
  } catch {
    // A provider failure (timeout, rate limit, outage, malformed response)
    // degrades to the same "not available" path callers already handle for
    // the no-provider-configured case, rather than throwing an unhandled
    // exception out of a Server Action — AI enhances, it never becomes a
    // requirement.
    return null;
  }
}
