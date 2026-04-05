import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export type ModelProvider = "openai" | "anthropic";

const MODEL_MAP = {
  "openai/gpt-4o": () => openai("gpt-4o"),
  "openai/gpt-4o-mini": () => openai("gpt-4o-mini"),
  "openai/gpt-4.1": () => openai("gpt-4.1"),
  "openai/gpt-4.1-mini": () => openai("gpt-4.1-mini"),
  "anthropic/claude-sonnet-4-5": () => anthropic("claude-sonnet-4-5-20250514"),
  "anthropic/claude-haiku-4-5": () => anthropic("claude-haiku-4-5-20251001"),
} as const;

export type ModelId = keyof typeof MODEL_MAP;

const DEFAULT_MODEL: ModelId = "openai/gpt-4o-mini";

export function getModel(modelId?: string) {
  const id = (modelId ?? process.env.DEFAULT_MODEL ?? DEFAULT_MODEL) as ModelId;

  const factory = MODEL_MAP[id];
  if (!factory) {
    throw new Error(
      `Unknown model: ${id}. Available: ${Object.keys(MODEL_MAP).join(", ")}`
    );
  }

  return factory();
}

export function getModelId(): string {
  return process.env.DEFAULT_MODEL ?? DEFAULT_MODEL;
}
