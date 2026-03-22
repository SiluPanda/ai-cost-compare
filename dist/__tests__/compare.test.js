"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const compare_1 = require("../compare");
(0, vitest_1.describe)('compare', () => {
    (0, vitest_1.describe)('basic comparison', () => {
        (0, vitest_1.it)('returns a CompareResult with ranked models', () => {
            const result = (0, compare_1.compare)('Hello, world!', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.ranked).toBeDefined();
            (0, vitest_1.expect)(result.ranked.length).toBe(2);
            (0, vitest_1.expect)(result.cheapest).toBeDefined();
            (0, vitest_1.expect)(result.mostExpensive).toBeDefined();
        });
        (0, vitest_1.it)('ranks models from cheapest to most expensive', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                estimatedOutputTokens: 100,
            });
            for (let i = 1; i < result.ranked.length; i++) {
                (0, vitest_1.expect)(result.ranked[i].totalCost).toBeGreaterThanOrEqual(result.ranked[i - 1].totalCost);
            }
        });
        (0, vitest_1.it)('cheapest is the first ranked model', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.cheapest).toBe(result.ranked[0]);
        });
        (0, vitest_1.it)('mostExpensive is the last ranked model', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.mostExpensive).toBe(result.ranked[result.ranked.length - 1]);
        });
        (0, vitest_1.it)('gpt-4o-mini is cheaper than gpt-4o', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.cheapest.model).toBe('gpt-4o-mini');
            (0, vitest_1.expect)(result.mostExpensive.model).toBe('gpt-4o');
        });
        (0, vitest_1.it)('gpt-4-turbo is the most expensive among standard OpenAI models', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.mostExpensive.model).toBe('gpt-4-turbo');
        });
    });
    (0, vitest_1.describe)('cost calculation', () => {
        (0, vitest_1.it)('calculates correct input cost', () => {
            const prompt = 'a'.repeat(4000); // ~1000 tokens
            const result = (0, compare_1.compare)(prompt, {
                models: ['gpt-4o'],
                estimatedOutputTokens: 0,
            });
            const entry = result.ranked[0];
            // gpt-4o: $2.50 per MTok input
            // 1000 tokens => 1000/1_000_000 * 2.50 = 0.0025
            (0, vitest_1.expect)(entry.inputCost).toBe(0.0025);
            (0, vitest_1.expect)(entry.outputCost).toBe(0);
            (0, vitest_1.expect)(entry.totalCost).toBe(0.0025);
        });
        (0, vitest_1.it)('calculates correct output cost', () => {
            const result = (0, compare_1.compare)('test', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 1000,
            });
            const entry = result.ranked[0];
            // gpt-4o: $10.00 per MTok output
            // 1000 tokens => 1000/1_000_000 * 10.00 = 0.01
            (0, vitest_1.expect)(entry.outputCost).toBe(0.01);
        });
        (0, vitest_1.it)('totalCost equals inputCost + outputCost', () => {
            const result = (0, compare_1.compare)('Some prompt text here', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 500,
            });
            const entry = result.ranked[0];
            const expectedTotal = Math.round((entry.inputCost + entry.outputCost) * 1_000_000) / 1_000_000;
            (0, vitest_1.expect)(entry.totalCost).toBe(expectedTotal);
        });
        (0, vitest_1.it)('uses 0 output tokens when estimatedOutputTokens is not provided', () => {
            const result = (0, compare_1.compare)('Test', { models: ['gpt-4o'] });
            (0, vitest_1.expect)(result.ranked[0].outputTokens).toBe(0);
            (0, vitest_1.expect)(result.ranked[0].outputCost).toBe(0);
        });
        (0, vitest_1.it)('costs are rounded to 6 decimal places', () => {
            const result = (0, compare_1.compare)('x'.repeat(7), {
                models: ['gpt-4o'],
                estimatedOutputTokens: 3,
            });
            const entry = result.ranked[0];
            // Verify no more than 6 decimal places
            const decimalPlaces = (n) => {
                const str = n.toString();
                const dot = str.indexOf('.');
                return dot === -1 ? 0 : str.length - dot - 1;
            };
            (0, vitest_1.expect)(decimalPlaces(entry.inputCost)).toBeLessThanOrEqual(6);
            (0, vitest_1.expect)(decimalPlaces(entry.outputCost)).toBeLessThanOrEqual(6);
            (0, vitest_1.expect)(decimalPlaces(entry.totalCost)).toBeLessThanOrEqual(6);
        });
    });
    (0, vitest_1.describe)('model cost breakdown fields', () => {
        (0, vitest_1.it)('includes all required fields', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 100,
            });
            const entry = result.ranked[0];
            (0, vitest_1.expect)(entry.model).toBe('gpt-4o');
            (0, vitest_1.expect)(entry.provider).toBe('openai');
            (0, vitest_1.expect)(typeof entry.inputTokens).toBe('number');
            (0, vitest_1.expect)(typeof entry.outputTokens).toBe('number');
            (0, vitest_1.expect)(typeof entry.inputCost).toBe('number');
            (0, vitest_1.expect)(typeof entry.outputCost).toBe('number');
            (0, vitest_1.expect)(typeof entry.totalCost).toBe('number');
            (0, vitest_1.expect)(typeof entry.contextWindow).toBe('number');
            (0, vitest_1.expect)(typeof entry.fitsContext).toBe('boolean');
        });
        (0, vitest_1.it)('sets fitsContext to true when prompt fits', () => {
            const result = (0, compare_1.compare)('Short prompt', { models: ['gpt-4o'] });
            (0, vitest_1.expect)(result.ranked[0].fitsContext).toBe(true);
        });
        (0, vitest_1.it)('sets fitsContext to false when prompt exceeds context window', () => {
            // gpt-3.5-turbo has 16385 context window
            // Create a prompt that exceeds it: 16385 * 4 + 1 chars
            const longPrompt = 'a'.repeat(16385 * 4 + 4);
            const result = (0, compare_1.compare)(longPrompt, { models: ['gpt-3.5-turbo'] });
            (0, vitest_1.expect)(result.ranked[0].fitsContext).toBe(false);
        });
        (0, vitest_1.it)('sets contextWindow from pricing registry', () => {
            const result = (0, compare_1.compare)('Test', { models: ['gpt-4o'] });
            (0, vitest_1.expect)(result.ranked[0].contextWindow).toBe(128_000);
        });
        (0, vitest_1.it)('sets provider from pricing registry', () => {
            const result = (0, compare_1.compare)('Test', { models: ['claude-3-opus'] });
            (0, vitest_1.expect)(result.ranked[0].provider).toBe('anthropic');
        });
    });
    (0, vitest_1.describe)('unknown models', () => {
        (0, vitest_1.it)('skips unknown models', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['gpt-4o', 'unknown-model'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(1);
            (0, vitest_1.expect)(result.ranked[0].model).toBe('gpt-4o');
        });
        (0, vitest_1.it)('returns empty result when all models are unknown', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['unknown-1', 'unknown-2'],
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(0);
            (0, vitest_1.expect)(result.cheapest).toBeUndefined();
            (0, vitest_1.expect)(result.mostExpensive).toBeUndefined();
            (0, vitest_1.expect)(result.savings).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('all models (no explicit model list)', () => {
        (0, vitest_1.it)('compares against all known models when models option is omitted', () => {
            const result = (0, compare_1.compare)('Test prompt', { estimatedOutputTokens: 100 });
            // Should have all 19 built-in models (plus any registered by other tests)
            (0, vitest_1.expect)(result.ranked.length).toBeGreaterThanOrEqual(19);
        });
        (0, vitest_1.it)('compares against all known models when options is omitted entirely', () => {
            const result = (0, compare_1.compare)('Test prompt');
            (0, vitest_1.expect)(result.ranked.length).toBeGreaterThanOrEqual(19);
        });
    });
    (0, vitest_1.describe)('constraints', () => {
        (0, vitest_1.it)('filters by minContextWindow', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['gpt-4o', 'gemini-1.5-pro', 'gpt-3.5-turbo'],
                estimatedOutputTokens: 100,
                constraints: { minContextWindow: 200_000 },
            });
            // Only gemini-1.5-pro has 2M context window
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(entry.contextWindow).toBeGreaterThanOrEqual(200_000);
            }
        });
        (0, vitest_1.it)('filters by maxCostPerCall', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                estimatedOutputTokens: 1000,
                constraints: { maxCostPerCall: 0.005 },
            });
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(entry.totalCost).toBeLessThanOrEqual(0.005);
            }
        });
        (0, vitest_1.it)('filters by providers', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                estimatedOutputTokens: 100,
                constraints: { providers: ['openai'] },
            });
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(entry.provider).toBe('openai');
            }
        });
        (0, vitest_1.it)('filters by multiple providers', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                estimatedOutputTokens: 100,
                constraints: { providers: ['openai', 'anthropic'] },
            });
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(['openai', 'anthropic']).toContain(entry.provider);
            }
        });
        (0, vitest_1.it)('provider filtering is case-insensitive', () => {
            const result = (0, compare_1.compare)('Test', {
                estimatedOutputTokens: 100,
                constraints: { providers: ['OpenAI'] },
            });
            (0, vitest_1.expect)(result.ranked.length).toBeGreaterThan(0);
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(entry.provider).toBe('openai');
            }
        });
        (0, vitest_1.it)('returns empty when no models meet constraints', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 100,
                constraints: { maxCostPerCall: 0.0000001 },
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(0);
            (0, vitest_1.expect)(result.cheapest).toBeUndefined();
        });
        (0, vitest_1.it)('combines multiple constraints', () => {
            const result = (0, compare_1.compare)('Test', {
                estimatedOutputTokens: 100,
                constraints: {
                    providers: ['google'],
                    minContextWindow: 500_000,
                },
            });
            for (const entry of result.ranked) {
                (0, vitest_1.expect)(entry.provider).toBe('google');
                (0, vitest_1.expect)(entry.contextWindow).toBeGreaterThanOrEqual(500_000);
            }
        });
    });
    (0, vitest_1.describe)('savings calculation', () => {
        (0, vitest_1.it)('calculates savings when there are multiple models', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.savings).toBeDefined();
            (0, vitest_1.expect)(result.savings.absolute).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.savings.percentage).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('savings.from is the most expensive model', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.savings.from.model).toBe(result.mostExpensive.model);
        });
        (0, vitest_1.it)('savings.to is the cheapest model', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.savings.to.model).toBe(result.cheapest.model);
        });
        (0, vitest_1.it)('savings is undefined when only one model', () => {
            const result = (0, compare_1.compare)('Test', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.savings).toBeUndefined();
        });
        (0, vitest_1.it)('savings percentage is correct', () => {
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            const expectedPercentage = (result.savings.absolute / result.savings.from.totalCost) * 100;
            (0, vitest_1.expect)(result.savings.percentage).toBeCloseTo(expectedPercentage, 4);
        });
    });
    (0, vitest_1.describe)('deterministic ordering', () => {
        (0, vitest_1.it)('breaks ties by provider name alphabetically', () => {
            // gpt-4o and command-r-plus both cost $2.50/$10.00
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['gpt-4o', 'command-r-plus'],
                estimatedOutputTokens: 100,
            });
            // Both have same pricing, so same totalCost
            // cohere < openai alphabetically
            (0, vitest_1.expect)(result.ranked[0].provider).toBe('cohere');
            (0, vitest_1.expect)(result.ranked[1].provider).toBe('openai');
        });
        (0, vitest_1.it)('breaks ties by model name within same provider', () => {
            // command-r and gpt-4o-mini both cost $0.15/$0.60
            const result = (0, compare_1.compare)('Test prompt', {
                models: ['command-r', 'gpt-4o-mini'],
                estimatedOutputTokens: 100,
            });
            // Same cost => sort by provider: cohere < openai
            (0, vitest_1.expect)(result.ranked[0].model).toBe('command-r');
            (0, vitest_1.expect)(result.ranked[1].model).toBe('gpt-4o-mini');
        });
    });
    (0, vitest_1.describe)('message array input', () => {
        (0, vitest_1.it)('accepts a message array as prompt', () => {
            const messages = [
                { role: 'system', content: 'You are helpful.' },
                { role: 'user', content: 'Hello' },
            ];
            const result = (0, compare_1.compare)(messages, {
                models: ['gpt-4o'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(1);
            (0, vitest_1.expect)(result.ranked[0].inputTokens).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('empty prompt', () => {
        (0, vitest_1.it)('handles an empty string prompt', () => {
            const result = (0, compare_1.compare)('', {
                models: ['gpt-4o'],
                estimatedOutputTokens: 100,
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(1);
            (0, vitest_1.expect)(result.ranked[0].inputTokens).toBe(0);
            (0, vitest_1.expect)(result.ranked[0].inputCost).toBe(0);
        });
    });
    (0, vitest_1.describe)('cross-provider comparison', () => {
        (0, vitest_1.it)('correctly compares models across all providers', () => {
            const result = (0, compare_1.compare)('Explain quantum computing in simple terms.', {
                models: [
                    'gpt-4o',
                    'gpt-4o-mini',
                    'claude-3-opus',
                    'claude-3-haiku',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'mistral-large',
                    'mistral-small',
                ],
                estimatedOutputTokens: 500,
            });
            (0, vitest_1.expect)(result.ranked.length).toBe(8);
            // The cheapest should be one of the flash/mini/haiku/small models
            const cheapModel = result.cheapest.model;
            (0, vitest_1.expect)(['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash', 'mistral-small', 'mistral-nemo'].includes(cheapModel)).toBe(true);
            // The most expensive should be claude-3-opus (highest output cost at $75/MTok)
            (0, vitest_1.expect)(result.mostExpensive.model).toBe('claude-3-opus');
        });
    });
});
(0, vitest_1.describe)('compareSavings', () => {
    (0, vitest_1.it)('returns savings between two known models', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', 'Test prompt', 100);
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.absolute).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.percentage).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('from is the first model and to is the second', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', 'Test', 100);
        (0, vitest_1.expect)(result.from.model).toBe('gpt-4o');
        (0, vitest_1.expect)(result.to.model).toBe('gpt-4o-mini');
    });
    (0, vitest_1.it)('returns negative savings when toModel is more expensive', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o-mini', 'gpt-4o', 'Test', 100);
        (0, vitest_1.expect)(result.absolute).toBeLessThan(0);
        (0, vitest_1.expect)(result.percentage).toBeLessThan(0);
    });
    (0, vitest_1.it)('returns zero savings for the same model', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o', 'Test', 100);
        (0, vitest_1.expect)(result.absolute).toBe(0);
        (0, vitest_1.expect)(result.percentage).toBe(0);
    });
    (0, vitest_1.it)('returns undefined when first model is unknown', () => {
        const result = (0, compare_1.compareSavings)('unknown', 'gpt-4o', 'Test');
        (0, vitest_1.expect)(result).toBeUndefined();
    });
    (0, vitest_1.it)('returns undefined when second model is unknown', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'unknown', 'Test');
        (0, vitest_1.expect)(result).toBeUndefined();
    });
    (0, vitest_1.it)('returns undefined when both models are unknown', () => {
        const result = (0, compare_1.compareSavings)('unknown-1', 'unknown-2', 'Test');
        (0, vitest_1.expect)(result).toBeUndefined();
    });
    (0, vitest_1.it)('uses 0 output tokens by default', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', 'Test');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.from.outputTokens).toBe(0);
        (0, vitest_1.expect)(result.to.outputTokens).toBe(0);
    });
    (0, vitest_1.it)('accepts message array as prompt', () => {
        const messages = [
            { role: 'user', content: 'Hello' },
        ];
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', messages, 100);
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.from.inputTokens).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('calculates percentage correctly', () => {
        const prompt = 'a'.repeat(4000); // ~1000 tokens
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', prompt, 1000);
        const expectedAbsolute = result.from.totalCost - result.to.totalCost;
        const expectedPercentage = (expectedAbsolute / result.from.totalCost) * 100;
        (0, vitest_1.expect)(result.absolute).toBeCloseTo(expectedAbsolute, 5);
        (0, vitest_1.expect)(result.percentage).toBeCloseTo(expectedPercentage, 3);
    });
    (0, vitest_1.it)('handles empty prompt', () => {
        const result = (0, compare_1.compareSavings)('gpt-4o', 'gpt-4o-mini', '', 100);
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.from.inputTokens).toBe(0);
        (0, vitest_1.expect)(result.to.inputTokens).toBe(0);
    });
});
//# sourceMappingURL=compare.test.js.map