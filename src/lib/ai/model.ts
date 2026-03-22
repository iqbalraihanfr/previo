import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { getAIConfigurationStatus } from "@/lib/ai/config";

/**
 * Returns the configured AI model based on AI_PROVIDER env var.
 * Supports "anthropic" (default) and "google".
 *
 * .env.local:
 *   AI_PROVIDER=anthropic | google
 *   ANTHROPIC_API_KEY=...         ANTHROPIC_MODEL=claude-sonnet-4-6 (optional)
 *   GOOGLE_GENERATIVE_AI_API_KEY=... GOOGLE_MODEL=gemini-2.0-flash (optional)
 */
export function getModel(): LanguageModel {
  const status = getAIConfigurationStatus();

  if (!status.configured) {
    throw new Error(
      `AI provider is not configured. Set AI_PROVIDER=${status.provider} and ${status.missing.join(", ")} in .env.local.`,
    );
  }

  if (status.provider === "google") {
    return google(status.model);
  }

  return anthropic(status.model);
}
