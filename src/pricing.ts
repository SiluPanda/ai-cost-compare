import type { ModelPricing } from './types';

/**
 * Built-in pricing registry for popular LLM models.
 *
 * Prices are in USD per million tokens. Context windows are in tokens.
 * Data reflects publicly available pricing as of early 2026.
 */
const registry: Map<string, ModelPricing> = new Map([
  // ── OpenAI ──────────────────────────────────────────────────────────
  ['gpt-4o', {
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128_000,
    provider: 'openai',
  }],
  ['gpt-4o-mini', {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
    provider: 'openai',
  }],
  ['gpt-4-turbo', {
    inputCostPerMillion: 10.00,
    outputCostPerMillion: 30.00,
    contextWindow: 128_000,
    provider: 'openai',
  }],
  ['gpt-3.5-turbo', {
    inputCostPerMillion: 0.50,
    outputCostPerMillion: 1.50,
    contextWindow: 16_385,
    provider: 'openai',
  }],
  ['o1', {
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 60.00,
    contextWindow: 200_000,
    provider: 'openai',
  }],
  ['o1-mini', {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 12.00,
    contextWindow: 128_000,
    provider: 'openai',
  }],

  // ── Anthropic ───────────────────────────────────────────────────────
  ['claude-3-opus', {
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 75.00,
    contextWindow: 200_000,
    provider: 'anthropic',
  }],
  ['claude-3-sonnet', {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
    provider: 'anthropic',
  }],
  ['claude-3-haiku', {
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.25,
    contextWindow: 200_000,
    provider: 'anthropic',
  }],
  ['claude-3.5-sonnet', {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
    provider: 'anthropic',
  }],
  ['claude-3.5-haiku', {
    inputCostPerMillion: 0.80,
    outputCostPerMillion: 4.00,
    contextWindow: 200_000,
    provider: 'anthropic',
  }],

  // ── Google ──────────────────────────────────────────────────────────
  ['gemini-1.5-pro', {
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.00,
    contextWindow: 2_000_000,
    provider: 'google',
  }],
  ['gemini-1.5-flash', {
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1_000_000,
    provider: 'google',
  }],
  ['gemini-2.0-flash', {
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    contextWindow: 1_000_000,
    provider: 'google',
  }],

  // ── Cohere ──────────────────────────────────────────────────────────
  ['command-r-plus', {
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128_000,
    provider: 'cohere',
  }],
  ['command-r', {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
    provider: 'cohere',
  }],

  // ── Mistral ─────────────────────────────────────────────────────────
  ['mistral-large', {
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 128_000,
    provider: 'mistral',
  }],
  ['mistral-small', {
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
    provider: 'mistral',
  }],
  ['mistral-nemo', {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.15,
    contextWindow: 128_000,
    provider: 'mistral',
  }],
]);

/**
 * Look up pricing for a model by name.
 *
 * @param model - Model identifier (e.g., 'gpt-4o', 'claude-3.5-sonnet').
 * @returns The pricing data, or undefined if the model is not known.
 */
export function getModelPricing(model: string): ModelPricing | undefined {
  return registry.get(model);
}

/**
 * List all known model identifiers in the registry.
 *
 * @returns An array of model name strings, sorted alphabetically.
 */
export function listModels(): string[] {
  return Array.from(registry.keys()).sort();
}

/**
 * Register a custom model with pricing data.
 *
 * If the model already exists, its pricing is overwritten.
 *
 * @param name - Model identifier.
 * @param pricing - Pricing data for the model.
 */
export function registerModel(name: string, pricing: ModelPricing): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Model name must be a non-empty string');
  }
  if (pricing.inputCostPerMillion < 0 || pricing.outputCostPerMillion < 0) {
    throw new Error('Cost per million tokens must not be negative');
  }
  if (pricing.contextWindow <= 0) {
    throw new Error('Context window must be a positive number');
  }
  if (!pricing.provider || typeof pricing.provider !== 'string') {
    throw new Error('Provider must be a non-empty string');
  }
  registry.set(name, { ...pricing });
}
