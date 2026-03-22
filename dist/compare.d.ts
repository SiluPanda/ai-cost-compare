import type { CompareOptions, CompareResult, SavingsResult } from './types';
import { type ChatMessage } from './tokenizer';
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
export declare function compare(prompt: string | ChatMessage[], options?: CompareOptions): CompareResult;
/**
 * Compare savings between two specific models for a given prompt.
 *
 * @param modelA - The "from" model (e.g., the current/expensive model).
 * @param modelB - The "to" model (e.g., the candidate/cheaper model).
 * @param prompt - The prompt text or array of chat messages.
 * @param estimatedOutputTokens - Expected output token count. Default: 0.
 * @returns Savings result, or undefined if either model is unknown.
 */
export declare function compareSavings(modelA: string, modelB: string, prompt: string | ChatMessage[], estimatedOutputTokens?: number): SavingsResult | undefined;
//# sourceMappingURL=compare.d.ts.map