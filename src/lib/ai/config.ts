export type AIProvider = "anthropic" | "google";

export type AIConfigurationStatus = {
  provider: AIProvider;
  configured: boolean;
  configuredVia: string | null;
  model: string;
  missing: string[];
};

const DEFAULT_PROVIDER: AIProvider = "anthropic";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  return provider === "google" ? "google" : DEFAULT_PROVIDER;
}

export function getAIConfigurationStatus(): AIConfigurationStatus {
  const provider = getAIProvider();

  if (provider === "google") {
    const configured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
    return {
      provider,
      configured,
      configuredVia: configured ? "GOOGLE_GENERATIVE_AI_API_KEY" : null,
      model: process.env.GOOGLE_MODEL ?? "gemini-3-flash-preview",
      missing: configured ? [] : ["GOOGLE_GENERATIVE_AI_API_KEY"],
    };
  }

  const configured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  return {
    provider,
    configured,
    configuredVia: configured ? "ANTHROPIC_API_KEY" : null,
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    missing: configured ? [] : ["ANTHROPIC_API_KEY"],
  };
}

