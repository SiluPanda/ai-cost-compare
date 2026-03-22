import type { ModelPricing } from './types';
/**
 * Look up pricing for a model by name.
 *
 * @param model - Model identifier (e.g., 'gpt-4o', 'claude-3.5-sonnet').
 * @returns The pricing data, or undefined if the model is not known.
 */
export declare function getModelPricing(model: string): ModelPricing | undefined;
/**
 * List all known model identifiers in the registry.
 *
 * @returns An array of model name strings, sorted alphabetically.
 */
export declare function listModels(): string[];
/**
 * Register a custom model with pricing data.
 *
 * If the model already exists, its pricing is overwritten.
 *
 * @param name - Model identifier.
 * @param pricing - Pricing data for the model.
 */
export declare function registerModel(name: string, pricing: ModelPricing): void;
//# sourceMappingURL=pricing.d.ts.map