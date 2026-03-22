"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pricing_1 = require("../pricing");
(0, vitest_1.describe)('getModelPricing', () => {
    (0, vitest_1.it)('returns pricing for gpt-4o', () => {
        const pricing = (0, pricing_1.getModelPricing)('gpt-4o');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(2.50);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(10.00);
        (0, vitest_1.expect)(pricing.contextWindow).toBe(128_000);
    });
    (0, vitest_1.it)('returns pricing for gpt-4o-mini', () => {
        const pricing = (0, pricing_1.getModelPricing)('gpt-4o-mini');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(0.15);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(0.60);
    });
    (0, vitest_1.it)('returns pricing for gpt-4-turbo', () => {
        const pricing = (0, pricing_1.getModelPricing)('gpt-4-turbo');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(10.00);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(30.00);
    });
    (0, vitest_1.it)('returns pricing for gpt-3.5-turbo', () => {
        const pricing = (0, pricing_1.getModelPricing)('gpt-3.5-turbo');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
    });
    (0, vitest_1.it)('returns pricing for o1', () => {
        const pricing = (0, pricing_1.getModelPricing)('o1');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(15.00);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(60.00);
        (0, vitest_1.expect)(pricing.contextWindow).toBe(200_000);
    });
    (0, vitest_1.it)('returns pricing for o1-mini', () => {
        const pricing = (0, pricing_1.getModelPricing)('o1-mini');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('openai');
    });
    (0, vitest_1.it)('returns pricing for claude-3-opus', () => {
        const pricing = (0, pricing_1.getModelPricing)('claude-3-opus');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('anthropic');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(15.00);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(75.00);
    });
    (0, vitest_1.it)('returns pricing for claude-3-sonnet', () => {
        const pricing = (0, pricing_1.getModelPricing)('claude-3-sonnet');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('anthropic');
    });
    (0, vitest_1.it)('returns pricing for claude-3-haiku', () => {
        const pricing = (0, pricing_1.getModelPricing)('claude-3-haiku');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('anthropic');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(0.25);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(1.25);
    });
    (0, vitest_1.it)('returns pricing for claude-3.5-sonnet', () => {
        const pricing = (0, pricing_1.getModelPricing)('claude-3.5-sonnet');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('anthropic');
        (0, vitest_1.expect)(pricing.inputCostPerMillion).toBe(3.00);
        (0, vitest_1.expect)(pricing.outputCostPerMillion).toBe(15.00);
    });
    (0, vitest_1.it)('returns pricing for claude-3.5-haiku', () => {
        const pricing = (0, pricing_1.getModelPricing)('claude-3.5-haiku');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('anthropic');
    });
    (0, vitest_1.it)('returns pricing for gemini-1.5-pro', () => {
        const pricing = (0, pricing_1.getModelPricing)('gemini-1.5-pro');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('google');
        (0, vitest_1.expect)(pricing.contextWindow).toBe(2_000_000);
    });
    (0, vitest_1.it)('returns pricing for gemini-1.5-flash', () => {
        const pricing = (0, pricing_1.getModelPricing)('gemini-1.5-flash');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('google');
        (0, vitest_1.expect)(pricing.contextWindow).toBe(1_000_000);
    });
    (0, vitest_1.it)('returns pricing for gemini-2.0-flash', () => {
        const pricing = (0, pricing_1.getModelPricing)('gemini-2.0-flash');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('google');
    });
    (0, vitest_1.it)('returns pricing for command-r-plus', () => {
        const pricing = (0, pricing_1.getModelPricing)('command-r-plus');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('cohere');
    });
    (0, vitest_1.it)('returns pricing for command-r', () => {
        const pricing = (0, pricing_1.getModelPricing)('command-r');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('cohere');
    });
    (0, vitest_1.it)('returns pricing for mistral-large', () => {
        const pricing = (0, pricing_1.getModelPricing)('mistral-large');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('mistral');
    });
    (0, vitest_1.it)('returns pricing for mistral-small', () => {
        const pricing = (0, pricing_1.getModelPricing)('mistral-small');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('mistral');
    });
    (0, vitest_1.it)('returns pricing for mistral-nemo', () => {
        const pricing = (0, pricing_1.getModelPricing)('mistral-nemo');
        (0, vitest_1.expect)(pricing).toBeDefined();
        (0, vitest_1.expect)(pricing.provider).toBe('mistral');
    });
    (0, vitest_1.it)('returns undefined for an unknown model', () => {
        (0, vitest_1.expect)((0, pricing_1.getModelPricing)('nonexistent-model')).toBeUndefined();
    });
    (0, vitest_1.it)('returns undefined for an empty string', () => {
        (0, vitest_1.expect)((0, pricing_1.getModelPricing)('')).toBeUndefined();
    });
    (0, vitest_1.it)('is case-sensitive', () => {
        (0, vitest_1.expect)((0, pricing_1.getModelPricing)('GPT-4O')).toBeUndefined();
        (0, vitest_1.expect)((0, pricing_1.getModelPricing)('gpt-4o')).toBeDefined();
    });
});
(0, vitest_1.describe)('listModels', () => {
    (0, vitest_1.it)('returns an array of model names', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(Array.isArray(models)).toBe(true);
        (0, vitest_1.expect)(models.length).toBeGreaterThanOrEqual(19);
    });
    (0, vitest_1.it)('includes all OpenAI models', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(models).toContain('gpt-4o');
        (0, vitest_1.expect)(models).toContain('gpt-4o-mini');
        (0, vitest_1.expect)(models).toContain('gpt-4-turbo');
        (0, vitest_1.expect)(models).toContain('gpt-3.5-turbo');
        (0, vitest_1.expect)(models).toContain('o1');
        (0, vitest_1.expect)(models).toContain('o1-mini');
    });
    (0, vitest_1.it)('includes all Anthropic models', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(models).toContain('claude-3-opus');
        (0, vitest_1.expect)(models).toContain('claude-3-sonnet');
        (0, vitest_1.expect)(models).toContain('claude-3-haiku');
        (0, vitest_1.expect)(models).toContain('claude-3.5-sonnet');
        (0, vitest_1.expect)(models).toContain('claude-3.5-haiku');
    });
    (0, vitest_1.it)('includes all Google models', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(models).toContain('gemini-1.5-pro');
        (0, vitest_1.expect)(models).toContain('gemini-1.5-flash');
        (0, vitest_1.expect)(models).toContain('gemini-2.0-flash');
    });
    (0, vitest_1.it)('includes Cohere models', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(models).toContain('command-r-plus');
        (0, vitest_1.expect)(models).toContain('command-r');
    });
    (0, vitest_1.it)('includes Mistral models', () => {
        const models = (0, pricing_1.listModels)();
        (0, vitest_1.expect)(models).toContain('mistral-large');
        (0, vitest_1.expect)(models).toContain('mistral-small');
        (0, vitest_1.expect)(models).toContain('mistral-nemo');
    });
    (0, vitest_1.it)('returns models sorted alphabetically', () => {
        const models = (0, pricing_1.listModels)();
        const sorted = [...models].sort();
        (0, vitest_1.expect)(models).toEqual(sorted);
    });
});
(0, vitest_1.describe)('registerModel', () => {
    (0, vitest_1.it)('adds a new model to the registry', () => {
        const pricing = {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'custom',
        };
        (0, pricing_1.registerModel)('custom-model-1', pricing);
        const result = (0, pricing_1.getModelPricing)('custom-model-1');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.inputCostPerMillion).toBe(1.00);
        (0, vitest_1.expect)(result.outputCostPerMillion).toBe(2.00);
        (0, vitest_1.expect)(result.contextWindow).toBe(64_000);
        (0, vitest_1.expect)(result.provider).toBe('custom');
    });
    (0, vitest_1.it)('overwrites an existing model', () => {
        const pricing = {
            inputCostPerMillion: 5.00,
            outputCostPerMillion: 10.00,
            contextWindow: 32_000,
            provider: 'custom',
        };
        (0, pricing_1.registerModel)('custom-overwrite', pricing);
        const updated = {
            inputCostPerMillion: 3.00,
            outputCostPerMillion: 6.00,
            contextWindow: 64_000,
            provider: 'custom-v2',
        };
        (0, pricing_1.registerModel)('custom-overwrite', updated);
        const result = (0, pricing_1.getModelPricing)('custom-overwrite');
        (0, vitest_1.expect)(result.inputCostPerMillion).toBe(3.00);
        (0, vitest_1.expect)(result.provider).toBe('custom-v2');
    });
    (0, vitest_1.it)('appears in listModels after registration', () => {
        const pricing = {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'test',
        };
        (0, pricing_1.registerModel)('listed-custom-model', pricing);
        (0, vitest_1.expect)((0, pricing_1.listModels)()).toContain('listed-custom-model');
    });
    (0, vitest_1.it)('makes a defensive copy of the pricing data', () => {
        const pricing = {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'test',
        };
        (0, pricing_1.registerModel)('copy-test-model', pricing);
        // Mutate the original
        pricing.inputCostPerMillion = 999;
        const result = (0, pricing_1.getModelPricing)('copy-test-model');
        (0, vitest_1.expect)(result.inputCostPerMillion).toBe(1.00);
    });
    (0, vitest_1.it)('throws on empty model name', () => {
        const pricing = {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'test',
        };
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('', pricing)).toThrow('non-empty string');
    });
    (0, vitest_1.it)('throws on negative input cost', () => {
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('bad-model', {
            inputCostPerMillion: -1,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'test',
        })).toThrow('must not be negative');
    });
    (0, vitest_1.it)('throws on negative output cost', () => {
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('bad-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: -2.00,
            contextWindow: 64_000,
            provider: 'test',
        })).toThrow('must not be negative');
    });
    (0, vitest_1.it)('throws on zero context window', () => {
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('bad-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 0,
            provider: 'test',
        })).toThrow('positive number');
    });
    (0, vitest_1.it)('throws on negative context window', () => {
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('bad-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: -1,
            provider: 'test',
        })).toThrow('positive number');
    });
    (0, vitest_1.it)('throws on empty provider', () => {
        (0, vitest_1.expect)(() => (0, pricing_1.registerModel)('bad-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: '',
        })).toThrow('non-empty string');
    });
    (0, vitest_1.it)('allows zero input cost (free models)', () => {
        (0, pricing_1.registerModel)('free-input-model', {
            inputCostPerMillion: 0,
            outputCostPerMillion: 1.00,
            contextWindow: 32_000,
            provider: 'free-tier',
        });
        const result = (0, pricing_1.getModelPricing)('free-input-model');
        (0, vitest_1.expect)(result.inputCostPerMillion).toBe(0);
    });
    (0, vitest_1.it)('allows zero output cost', () => {
        (0, pricing_1.registerModel)('free-output-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 0,
            contextWindow: 32_000,
            provider: 'free-tier',
        });
        const result = (0, pricing_1.getModelPricing)('free-output-model');
        (0, vitest_1.expect)(result.outputCostPerMillion).toBe(0);
    });
});
//# sourceMappingURL=pricing.test.js.map