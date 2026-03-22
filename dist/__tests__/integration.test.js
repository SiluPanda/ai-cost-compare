"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
(0, vitest_1.describe)('integration: public API exports', () => {
    (0, vitest_1.it)('exports compare function', () => {
        (0, vitest_1.expect)(typeof index_1.compare).toBe('function');
    });
    (0, vitest_1.it)('exports compareSavings function', () => {
        (0, vitest_1.expect)(typeof index_1.compareSavings).toBe('function');
    });
    (0, vitest_1.it)('exports getModelPricing function', () => {
        (0, vitest_1.expect)(typeof index_1.getModelPricing).toBe('function');
    });
    (0, vitest_1.it)('exports listModels function', () => {
        (0, vitest_1.expect)(typeof index_1.listModels).toBe('function');
    });
    (0, vitest_1.it)('exports registerModel function', () => {
        (0, vitest_1.expect)(typeof index_1.registerModel).toBe('function');
    });
    (0, vitest_1.it)('exports estimateTokens function', () => {
        (0, vitest_1.expect)(typeof index_1.estimateTokens).toBe('function');
    });
    (0, vitest_1.it)('exports estimatePromptTokens function', () => {
        (0, vitest_1.expect)(typeof index_1.estimatePromptTokens).toBe('function');
    });
});
(0, vitest_1.describe)('integration: end-to-end cost comparison workflow', () => {
    (0, vitest_1.it)('compares OpenAI models for a simple prompt', () => {
        const result = (0, index_1.compare)('Explain quantum computing in simple terms.', {
            models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
            estimatedOutputTokens: 500,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(3);
        (0, vitest_1.expect)(result.cheapest.model).toBe('gpt-4o-mini');
        (0, vitest_1.expect)(result.mostExpensive.model).toBe('gpt-4-turbo');
        (0, vitest_1.expect)(result.savings).toBeDefined();
        (0, vitest_1.expect)(result.savings.absolute).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('compares Anthropic models for a prompt', () => {
        const result = (0, index_1.compare)('Write a poem about the sea.', {
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5-sonnet', 'claude-3.5-haiku'],
            estimatedOutputTokens: 200,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(5);
        (0, vitest_1.expect)(result.cheapest.model).toBe('claude-3-haiku');
        (0, vitest_1.expect)(result.mostExpensive.model).toBe('claude-3-opus');
    });
    (0, vitest_1.it)('compares across all providers', () => {
        const result = (0, index_1.compare)('Translate this to French: Hello, how are you?', {
            models: [
                'gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro',
                'command-r-plus', 'mistral-large',
            ],
            estimatedOutputTokens: 50,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(5);
        const providers = result.ranked.map(r => r.provider);
        (0, vitest_1.expect)(new Set(providers).size).toBe(5);
    });
    (0, vitest_1.it)('full workflow: estimate tokens, look up pricing, compare, get savings', () => {
        const prompt = 'Summarize the following article about machine learning...';
        const tokens = (0, index_1.estimateTokens)(prompt);
        (0, vitest_1.expect)(tokens).toBeGreaterThan(0);
        const pricing = (0, index_1.getModelPricing)('gpt-4o');
        (0, vitest_1.expect)(pricing).toBeDefined();
        const result = (0, index_1.compare)(prompt, {
            models: ['gpt-4o', 'gpt-4o-mini'],
            estimatedOutputTokens: 200,
        });
        (0, vitest_1.expect)(result.cheapest.model).toBe('gpt-4o-mini');
        const savings = (0, index_1.compareSavings)('gpt-4o', 'gpt-4o-mini', prompt, 200);
        (0, vitest_1.expect)(savings).toBeDefined();
        (0, vitest_1.expect)(savings.absolute).toBeGreaterThan(0);
        (0, vitest_1.expect)(savings.from.model).toBe('gpt-4o');
        (0, vitest_1.expect)(savings.to.model).toBe('gpt-4o-mini');
    });
});
(0, vitest_1.describe)('integration: custom model registration and comparison', () => {
    (0, vitest_1.it)('registers a custom model and includes it in comparison', () => {
        (0, index_1.registerModel)('my-custom-llm', {
            inputCostPerMillion: 0.01,
            outputCostPerMillion: 0.02,
            contextWindow: 32_000,
            provider: 'custom-provider',
        });
        const result = (0, index_1.compare)('Test prompt', {
            models: ['gpt-4o', 'my-custom-llm'],
            estimatedOutputTokens: 100,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(2);
        (0, vitest_1.expect)(result.cheapest.model).toBe('my-custom-llm');
        (0, vitest_1.expect)(result.cheapest.provider).toBe('custom-provider');
    });
    (0, vitest_1.it)('custom model appears in listModels', () => {
        (0, index_1.registerModel)('integration-test-model', {
            inputCostPerMillion: 1.00,
            outputCostPerMillion: 2.00,
            contextWindow: 64_000,
            provider: 'test',
        });
        (0, vitest_1.expect)((0, index_1.listModels)()).toContain('integration-test-model');
    });
});
(0, vitest_1.describe)('integration: constraint-based model selection', () => {
    (0, vitest_1.it)('finds cheapest model with large context window', () => {
        const result = (0, index_1.compare)('Long document prompt...', {
            estimatedOutputTokens: 1000,
            constraints: { minContextWindow: 500_000 },
        });
        for (const entry of result.ranked) {
            (0, vitest_1.expect)(entry.contextWindow).toBeGreaterThanOrEqual(500_000);
        }
        // Only Google models have >= 500K context
        (0, vitest_1.expect)(result.cheapest.provider).toBe('google');
    });
    (0, vitest_1.it)('finds models within a budget', () => {
        const result = (0, index_1.compare)('Short prompt', {
            models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-opus'],
            estimatedOutputTokens: 100,
            constraints: { maxCostPerCall: 0.001 },
        });
        for (const entry of result.ranked) {
            (0, vitest_1.expect)(entry.totalCost).toBeLessThanOrEqual(0.001);
        }
    });
    (0, vitest_1.it)('selects models from specific provider', () => {
        const result = (0, index_1.compare)('Test', {
            estimatedOutputTokens: 100,
            constraints: { providers: ['anthropic'] },
        });
        (0, vitest_1.expect)(result.ranked.length).toBeGreaterThan(0);
        for (const entry of result.ranked) {
            (0, vitest_1.expect)(entry.provider).toBe('anthropic');
        }
    });
});
(0, vitest_1.describe)('integration: realistic cost comparison scenarios', () => {
    (0, vitest_1.it)('short prompt: mini/flash models are cheapest', () => {
        const prompt = 'What is 2+2?';
        const result = (0, index_1.compare)(prompt, {
            models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
            estimatedOutputTokens: 10,
        });
        // All mini/flash/haiku models should be cheaper than gpt-4o
        const cheapModel = result.cheapest.model;
        (0, vitest_1.expect)(['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash']).toContain(cheapModel);
    });
    (0, vitest_1.it)('long prompt: context window matters', () => {
        // Simulate a 100K token prompt (400K chars)
        const longPrompt = 'a'.repeat(400_000);
        const result = (0, index_1.compare)(longPrompt, {
            models: ['gpt-3.5-turbo', 'gpt-4o', 'gemini-1.5-pro'],
            estimatedOutputTokens: 100,
        });
        // gpt-3.5-turbo should not fit (16K context)
        const gpt35 = result.ranked.find(r => r.model === 'gpt-3.5-turbo');
        if (gpt35) {
            (0, vitest_1.expect)(gpt35.fitsContext).toBe(false);
        }
        // gemini-1.5-pro should fit (2M context)
        const gemini = result.ranked.find(r => r.model === 'gemini-1.5-pro');
        if (gemini) {
            (0, vitest_1.expect)(gemini.fitsContext).toBe(true);
        }
    });
    (0, vitest_1.it)('high output volume: output cost dominates', () => {
        const prompt = 'Write a long essay.';
        const result = (0, index_1.compare)(prompt, {
            models: ['gpt-4o', 'gpt-4o-mini'],
            estimatedOutputTokens: 10_000,
        });
        // With 10K output tokens, output cost should dwarf input cost
        for (const entry of result.ranked) {
            (0, vitest_1.expect)(entry.outputCost).toBeGreaterThan(entry.inputCost);
        }
    });
    (0, vitest_1.it)('zero output tokens: only input cost matters', () => {
        const prompt = 'a'.repeat(4000); // ~1000 tokens
        const result = (0, index_1.compare)(prompt, {
            models: ['gpt-4o', 'claude-3-opus'],
            estimatedOutputTokens: 0,
        });
        for (const entry of result.ranked) {
            (0, vitest_1.expect)(entry.outputCost).toBe(0);
            (0, vitest_1.expect)(entry.totalCost).toBe(entry.inputCost);
        }
    });
});
(0, vitest_1.describe)('integration: savings calculations', () => {
    (0, vitest_1.it)('gpt-4o to gpt-4o-mini shows significant savings', () => {
        const prompt = 'a'.repeat(4000); // ~1000 tokens
        const result = (0, index_1.compareSavings)('gpt-4o', 'gpt-4o-mini', prompt, 1000);
        (0, vitest_1.expect)(result).toBeDefined();
        // gpt-4o is ~16x more expensive than gpt-4o-mini
        (0, vitest_1.expect)(result.percentage).toBeGreaterThan(90);
    });
    (0, vitest_1.it)('claude-3-opus to claude-3-haiku shows huge savings', () => {
        const prompt = 'Summarize this text.';
        const result = (0, index_1.compareSavings)('claude-3-opus', 'claude-3-haiku', prompt, 500);
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.absolute).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.percentage).toBeGreaterThan(90);
    });
    (0, vitest_1.it)('same model returns zero savings', () => {
        const result = (0, index_1.compareSavings)('gpt-4o', 'gpt-4o', 'Test', 100);
        (0, vitest_1.expect)(result.absolute).toBe(0);
        (0, vitest_1.expect)(result.percentage).toBe(0);
    });
});
(0, vitest_1.describe)('integration: message array prompts', () => {
    (0, vitest_1.it)('compares costs for a conversation with system prompt', () => {
        const messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'What is machine learning?' },
        ];
        const result = (0, index_1.compare)(messages, {
            models: ['gpt-4o', 'gpt-4o-mini'],
            estimatedOutputTokens: 300,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(2);
        (0, vitest_1.expect)(result.cheapest.model).toBe('gpt-4o-mini');
    });
    (0, vitest_1.it)('message array produces more tokens than plain content due to overhead', () => {
        const content = 'Hello, world!';
        const plainTokens = (0, index_1.estimatePromptTokens)(content);
        const messageTokens = (0, index_1.estimatePromptTokens)([{ role: 'user', content }]);
        // Message array should have more tokens due to per-message overhead + priming
        (0, vitest_1.expect)(messageTokens).toBeGreaterThan(plainTokens);
    });
});
(0, vitest_1.describe)('integration: edge cases', () => {
    (0, vitest_1.it)('handles empty prompt with output tokens', () => {
        const result = (0, index_1.compare)('', {
            models: ['gpt-4o'],
            estimatedOutputTokens: 1000,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(1);
        (0, vitest_1.expect)(result.ranked[0].inputCost).toBe(0);
        (0, vitest_1.expect)(result.ranked[0].outputCost).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('handles single model comparison', () => {
        const result = (0, index_1.compare)('Test', {
            models: ['gpt-4o'],
            estimatedOutputTokens: 100,
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(1);
        (0, vitest_1.expect)(result.cheapest.model).toBe('gpt-4o');
        (0, vitest_1.expect)(result.mostExpensive.model).toBe('gpt-4o');
        (0, vitest_1.expect)(result.savings).toBeUndefined();
    });
    (0, vitest_1.it)('handles comparison with only unknown models', () => {
        const result = (0, index_1.compare)('Test', {
            models: ['fake-model-a', 'fake-model-b'],
        });
        (0, vitest_1.expect)(result.ranked.length).toBe(0);
        (0, vitest_1.expect)(result.cheapest).toBeUndefined();
        (0, vitest_1.expect)(result.mostExpensive).toBeUndefined();
        (0, vitest_1.expect)(result.savings).toBeUndefined();
    });
    (0, vitest_1.it)('handles very large output token count', () => {
        const result = (0, index_1.compare)('Short', {
            models: ['gpt-4o'],
            estimatedOutputTokens: 1_000_000,
        });
        (0, vitest_1.expect)(result.ranked[0].outputCost).toBe(10.0);
        (0, vitest_1.expect)(result.ranked[0].totalCost).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=integration.test.js.map