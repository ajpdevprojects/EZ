import { ToolLoopAgent } from "ai";
import { ELIZABETH_SYSTEM_PROMPT } from "./prompts";
import { isAiConfigured, resolveAiModel } from "./provider";

/**
 * Builds the Elizabeth conversational agent for the currently configured
 * provider. Returns null when no AI provider is configured so the route
 * handler can respond gracefully — AI is an enhancement, never a
 * requirement (Product Philosophy: Human Before AI).
 */
export function buildElizabethAgent() {
  if (!isAiConfigured()) return null;

  const resolved = resolveAiModel();
  if (!resolved) return null;

  return new ToolLoopAgent({
    model: resolved.model,
    instructions: ELIZABETH_SYSTEM_PROMPT,
  });
}
