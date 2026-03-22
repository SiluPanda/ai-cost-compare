/**
 * Pricing data for a single model.
 */
export interface ModelPricing {
    /** Cost per 1 million input tokens in USD. */
    inputCostPerMillion: number;
    /** Cost per 1 million output tokens in USD. */
    outputCostPerMillion: number;
    /** Maximum context window in tokens. */
    contextWindow: number;
    /** Provider name (e.g., 'openai', 'anthropic'). */
    provider: string;
}
/**
 * Options for comparing models.
 */
export interface CompareOptions {
    /** Explicit list of model identifiers to compare. */
    models?: string[];
    /** Estimated output token count applied uniformly across all models. */
    estimatedOutputTokens?: number;
    /** Constraints to filter models. */
    constraints?: CompareConstraints;
    /** Include per-model cost breakdowns in the result. Default: true. */
    includeDetails?: boolean;
}
/**
 * Constraints for filtering models during comparison.
 */
export interface CompareConstraints {
    /** Minimum context window required (in tokens). */
    minContextWindow?: number;
    /** Maximum acceptable cost per call in USD. */
    maxCostPerCall?: number;
    /** Only include models from these providers. */
    providers?: string[];
}
/**
 * Per-model cost breakdown.
 */
export interface ModelCostBreakdown {
    /** Model identifier (e.g., 'gpt-4o'). */
    model: string;
    /** Provider name (e.g., 'openai'). */
    provider: string;
    /** Number of input tokens counted. */
    inputTokens: number;
    /** Estimated number of output tokens. */
    outputTokens: number;
    /** Input cost in USD. */
    inputCost: number;
    /** Output cost in USD. */
    outputCost: number;
    /** Total cost in USD (inputCost + outputCost). */
    totalCost: number;
    /** Maximum context window in tokens. */
    contextWindow: number;
    /** Whether the prompt fits within the model's context window. */
    fitsContext: boolean;
}
/**
 * Savings calculation between two models.
 */
export interface SavingsResult {
    /** Absolute savings in USD (from.totalCost - to.totalCost). Positive = 'to' is cheaper. */
    absolute: number;
    /** Percentage savings ((absolute / from.totalCost) * 100). */
    percentage: number;
    /** The model being migrated from. */
    from: ModelCostBreakdown;
    /** The model being migrated to. */
    to: ModelCostBreakdown;
}
/**
 * Result of a cross-model cost comparison.
 */
export interface CompareResult {
    /** Models ranked by totalCost ascending (cheapest first). */
    ranked: ModelCostBreakdown[];
    /** The cheapest model (rank 1). Undefined if no models matched. */
    cheapest: ModelCostBreakdown | undefined;
    /** The most expensive model. Undefined if no models matched. */
    mostExpensive: ModelCostBreakdown | undefined;
    /** Savings from most expensive to cheapest. Undefined if fewer than 2 models. */
    savings: SavingsResult | undefined;
}
//# sourceMappingURL=types.d.ts.map