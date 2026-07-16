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
export async function generateElizabethText(prompt: string): Promise<AiTextResult | null> {
  const resolved = resolveAiModel();
  if (!resolved) return null;

  const { text } = await generateText({
    model: resolved.model,
    system: ELIZABETH_SYSTEM_PROMPT,
    prompt,
  });

  return { text };
}
