import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export type ModelProvider = "openai" | "anthropic" | "openrouter";

// OpenRouter uses the OpenAI-compatible API
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Standard OpenAI
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_MAP: Record<string, () => ReturnType<typeof openai>> = {
  // OpenAI
  "openai/gpt-4o": () => openai("gpt-4o"),
  "openai/gpt-4o-mini": () => openai("gpt-4o-mini"),
  "openai/gpt-4.1": () => openai("gpt-4.1"),
  "openai/gpt-4.1-mini": () => openai("gpt-4.1-mini"),
  // Anthropic
  "anthropic/claude-sonnet-4-5": () => anthropic("claude-sonnet-4-5-20250514") as any,
  "anthropic/claude-haiku-4-5": () => anthropic("claude-haiku-4-5-20251001") as any,
  // OpenRouter (use any model available on OpenRouter)
  "openrouter/google/gemini-2.5-flash": () => openrouter("google/gemini-2.5-flash"),
  "openrouter/anthropic/claude-sonnet-4": () => openrouter("anthropic/claude-sonnet-4"),
  "openrouter/openai/gpt-4o-mini": () => openrouter("openai/gpt-4o-mini"),
  "openrouter/meta-llama/llama-4-maverick": () => openrouter("meta-llama/llama-4-maverick"),
};

const DEFAULT_MODEL = "openrouter/openai/gpt-4o-mini";

export function getModel(modelId?: string) {
  const id = modelId ?? process.env.DEFAULT_MODEL ?? DEFAULT_MODEL;

  // Allow any openrouter/* model dynamically
  if (id.startsWith("openrouter/") && !MODEL_MAP[id]) {
    const modelName = id.replace("openrouter/", "");
    return openrouter(modelName);
  }

  const factory = MODEL_MAP[id];
  if (!factory) {
    throw new Error(
      `Unknown model: ${id}. Available: ${Object.keys(MODEL_MAP).join(", ")}, or any openrouter/<model-id>`
    );
  }

  return factory();
}

export function getModelId(): string {
  return process.env.DEFAULT_MODEL ?? DEFAULT_MODEL;
}
