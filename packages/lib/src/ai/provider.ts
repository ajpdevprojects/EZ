import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AiProviderName = "anthropic" | "openai" | "google";

interface AiProviderConfig {
  name: AiProviderName;
  apiKeyEnvVar: string;
  modelEnvVar: string;
  defaultModel: string;
}

/**
 * Providers are tried in order. The Engineering Canon requires a common
 * abstraction over multiple AI providers so application logic never
 * depends on a specific model or vendor.
 */
const PROVIDER_PRIORITY: AiProviderConfig[] = [
  {
    name: "anthropic",
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    modelEnvVar: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-5",
  },
  {
    name: "openai",
    apiKeyEnvVar: "OPENAI_API_KEY",
    modelEnvVar: "OPENAI_MODEL",
    defaultModel: "gpt-5",
  },
  {
    name: "google",
    apiKeyEnvVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    modelEnvVar: "GOOGLE_MODEL",
    defaultModel: "gemini-2.5-pro",
  },
];

function buildModel(config: AiProviderConfig, apiKey: string): LanguageModel {
  const model = process.env[config.modelEnvVar] || config.defaultModel;

  switch (config.name) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
  }
}

/**
 * Resolves the first configured AI provider based on available API keys.
 * Returns null when no provider is configured so callers can fail
 * gracefully rather than crash — AI is an enhancement, never a
 * requirement, per the Product Philosophy.
 */
export function resolveAiModel(): { provider: AiProviderName; model: LanguageModel } | null {
  for (const config of PROVIDER_PRIORITY) {
    const apiKey = process.env[config.apiKeyEnvVar];
    if (apiKey) {
      return { provider: config.name, model: buildModel(config, apiKey) };
    }
  }

  return null;
}

export function isAiConfigured(): boolean {
  return PROVIDER_PRIORITY.some((config) => Boolean(process.env[config.apiKeyEnvVar]));
}
