import type {
  CompareOptions,
  CompareResult,
  ModelCostBreakdown,
  SavingsResult,
} from './types';
import { estimatePromptTokens, type ChatMessage } from './tokenizer';
import { getModelPricing, listModels } from './pricing';

/**
 * Round a USD value to 6 decimal places to avoid floating-point artifacts.
 */
function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Calculate cost breakdown for a single model given token counts.
 */
function calculateModelCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): ModelCostBreakdown | undefined {
  const pricing = getModelPricing(model);
  if (!pricing) {
    return undefined;
  }

  const inputCost = roundCost((inputTokens / 1_000_000) * pricing.inputCostPerMillion);
  const outputCost = roundCost((outputTokens / 1_000_000) * pricing.outputCostPerMillion);
  const totalCost = roundCost(inputCost + outputCost);

  return {
    model,
    provider: pricing.provider,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost,
    contextWindow: pricing.contextWindow,
    fitsContext: inputTokens <= pricing.contextWindow,
  };
}

/**
 * Resolve which models to compare.
 *
 * If explicit models are provided in options, use those.
 * Otherwise, use all known models from the registry.
 */
function resolveModels(options?: CompareOptions): string[] {
  if (options?.models && options.models.length > 0) {
    return options.models;
  }
  return listModels();
}

/**
 * Apply constraints to filter model results.
 */
function applyConstraints(
  breakdowns: ModelCostBreakdown[],
  options?: CompareOptions,
): ModelCostBreakdown[] {
  if (!options?.constraints) {
    return breakdowns;
  }

  let filtered = breakdowns;
  const { minContextWindow, maxCostPerCall, providers } = options.constraints;

  if (minContextWindow !== undefined) {
    filtered = filtered.filter(b => b.contextWindow >= minContextWindow);
  }

  if (maxCostPerCall !== undefined) {
    filtered = filtered.filter(b => b.totalCost <= maxCostPerCall);
  }

  if (providers && providers.length > 0) {
    const providerSet = new Set(providers.map(p => p.toLowerCase()));
    filtered = filtered.filter(b => providerSet.has(b.provider.toLowerCase()));
  }

  return filtered;
}

/**
 * Sort model breakdowns by totalCost ascending, with deterministic
 * tie-breaking by provider (alphabetical) then model (alphabetical).
 */
function rankModels(breakdowns: ModelCostBreakdown[]): ModelCostBreakdown[] {
  return [...breakdowns].sort((a, b) => {
    if (a.totalCost !== b.totalCost) {
      return a.totalCost - b.totalCost;
    }
    if (a.provider !== b.provider) {
      return a.provider.localeCompare(b.provider);
    }
    return a.model.localeCompare(b.model);
  });
}

/**
 * Calculate savings between two model breakdowns.
 */
function calculateSavings(
  from: ModelCostBreakdown,
  to: ModelCostBreakdown,
): SavingsResult {
  const absolute = roundCost(from.totalCost - to.totalCost);
  const percentage = from.totalCost === 0
    ? 0
    : roundCost((absolute / from.totalCost) * 100);

  return { absolute, percentage, from, to };
}

/**
 * Compare the cost of a prompt across multiple models.
 *
 * Given a prompt (string or message array) and options specifying which
 * models to compare, this function:
 * 1. Counts input tokens for the prompt
 * 2. For each model: calculates input cost + output cost
 * 3. Filters by constraints (context window, max cost, providers)
 * 4. Sorts by total cost ascending
 * 5. Calculates savings between cheapest and most expensive
 *
 * @param prompt - The prompt text or array of chat messages.
 * @param options - Comparison options (models, output tokens, constraints).
 * @returns Structured comparison result with ranked models and savings.
 */
export function compare(
  prompt: string | ChatMessage[],
  options?: CompareOptions,
): CompareResult {
  const models = resolveModels(options);
  const inputTokens = estimatePromptTokens(prompt);
  const outputTokens = options?.estimatedOutputTokens ?? 0;

  // Calculate cost for each model
  const breakdowns: ModelCostBreakdown[] = [];
  for (const model of models) {
    const breakdown = calculateModelCost(model, inputTokens, outputTokens);
    if (breakdown) {
      breakdowns.push(breakdown);
    }
  }

  // Apply constraints
  const filtered = applyConstraints(breakdowns, options);

  // Rank by cost
  const ranked = rankModels(filtered);

  // Determine cheapest and most expensive
  const cheapest = ranked.length > 0 ? ranked[0] : undefined;
  const mostExpensive = ranked.length > 0 ? ranked[ranked.length - 1] : undefined;

  // Calculate savings
  let savings: SavingsResult | undefined;
  if (cheapest && mostExpensive && ranked.length >= 2) {
    savings = calculateSavings(mostExpensive, cheapest);
  }

  return {
    ranked,
    cheapest,
    mostExpensive,
    savings,
  };
}

/**
 * Compare savings between two specific models for a given prompt.
 *
 * @param modelA - The "from" model (e.g., the current/expensive model).
 * @param modelB - The "to" model (e.g., the candidate/cheaper model).
 * @param prompt - The prompt text or array of chat messages.
 * @param estimatedOutputTokens - Expected output token count. Default: 0.
 * @returns Savings result, or undefined if either model is unknown.
 */
export function compareSavings(
  modelA: string,
  modelB: string,
  prompt: string | ChatMessage[],
  estimatedOutputTokens: number = 0,
): SavingsResult | undefined {
  const inputTokens = estimatePromptTokens(prompt);

  const breakdownA = calculateModelCost(modelA, inputTokens, estimatedOutputTokens);
  const breakdownB = calculateModelCost(modelB, inputTokens, estimatedOutputTokens);

  if (!breakdownA || !breakdownB) {
    return undefined;
  }

  return calculateSavings(breakdownA, breakdownB);
}
