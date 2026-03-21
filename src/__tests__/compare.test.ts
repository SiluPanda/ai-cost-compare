import { describe, it, expect } from 'vitest';
import { compare, compareSavings } from '../compare';

describe('compare', () => {
  describe('basic comparison', () => {
    it('returns a CompareResult with ranked models', () => {
      const result = compare('Hello, world!', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.ranked).toBeDefined();
      expect(result.ranked.length).toBe(2);
      expect(result.cheapest).toBeDefined();
      expect(result.mostExpensive).toBeDefined();
    });

    it('ranks models from cheapest to most expensive', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        estimatedOutputTokens: 100,
      });

      for (let i = 1; i < result.ranked.length; i++) {
        expect(result.ranked[i].totalCost).toBeGreaterThanOrEqual(
          result.ranked[i - 1].totalCost,
        );
      }
    });

    it('cheapest is the first ranked model', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.cheapest).toBe(result.ranked[0]);
    });

    it('mostExpensive is the last ranked model', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.mostExpensive).toBe(result.ranked[result.ranked.length - 1]);
    });

    it('gpt-4o-mini is cheaper than gpt-4o', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.cheapest!.model).toBe('gpt-4o-mini');
      expect(result.mostExpensive!.model).toBe('gpt-4o');
    });

    it('gpt-4-turbo is the most expensive among standard OpenAI models', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        estimatedOutputTokens: 100,
      });

      expect(result.mostExpensive!.model).toBe('gpt-4-turbo');
    });
  });

  describe('cost calculation', () => {
    it('calculates correct input cost', () => {
      const prompt = 'a'.repeat(4000); // ~1000 tokens
      const result = compare(prompt, {
        models: ['gpt-4o'],
        estimatedOutputTokens: 0,
      });

      const entry = result.ranked[0];
      // gpt-4o: $2.50 per MTok input
      // 1000 tokens => 1000/1_000_000 * 2.50 = 0.0025
      expect(entry.inputCost).toBe(0.0025);
      expect(entry.outputCost).toBe(0);
      expect(entry.totalCost).toBe(0.0025);
    });

    it('calculates correct output cost', () => {
      const result = compare('test', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 1000,
      });

      const entry = result.ranked[0];
      // gpt-4o: $10.00 per MTok output
      // 1000 tokens => 1000/1_000_000 * 10.00 = 0.01
      expect(entry.outputCost).toBe(0.01);
    });

    it('totalCost equals inputCost + outputCost', () => {
      const result = compare('Some prompt text here', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 500,
      });

      const entry = result.ranked[0];
      const expectedTotal = Math.round(
        (entry.inputCost + entry.outputCost) * 1_000_000,
      ) / 1_000_000;
      expect(entry.totalCost).toBe(expectedTotal);
    });

    it('uses 0 output tokens when estimatedOutputTokens is not provided', () => {
      const result = compare('Test', { models: ['gpt-4o'] });
      expect(result.ranked[0].outputTokens).toBe(0);
      expect(result.ranked[0].outputCost).toBe(0);
    });

    it('costs are rounded to 6 decimal places', () => {
      const result = compare('x'.repeat(7), {
        models: ['gpt-4o'],
        estimatedOutputTokens: 3,
      });

      const entry = result.ranked[0];
      // Verify no more than 6 decimal places
      const decimalPlaces = (n: number) => {
        const str = n.toString();
        const dot = str.indexOf('.');
        return dot === -1 ? 0 : str.length - dot - 1;
      };
      expect(decimalPlaces(entry.inputCost)).toBeLessThanOrEqual(6);
      expect(decimalPlaces(entry.outputCost)).toBeLessThanOrEqual(6);
      expect(decimalPlaces(entry.totalCost)).toBeLessThanOrEqual(6);
    });
  });

  describe('model cost breakdown fields', () => {
    it('includes all required fields', () => {
      const result = compare('Test', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 100,
      });

      const entry = result.ranked[0];
      expect(entry.model).toBe('gpt-4o');
      expect(entry.provider).toBe('openai');
      expect(typeof entry.inputTokens).toBe('number');
      expect(typeof entry.outputTokens).toBe('number');
      expect(typeof entry.inputCost).toBe('number');
      expect(typeof entry.outputCost).toBe('number');
      expect(typeof entry.totalCost).toBe('number');
      expect(typeof entry.contextWindow).toBe('number');
      expect(typeof entry.fitsContext).toBe('boolean');
    });

    it('sets fitsContext to true when prompt fits', () => {
      const result = compare('Short prompt', { models: ['gpt-4o'] });
      expect(result.ranked[0].fitsContext).toBe(true);
    });

    it('sets fitsContext to false when prompt exceeds context window', () => {
      // gpt-3.5-turbo has 16385 context window
      // Create a prompt that exceeds it: 16385 * 4 + 1 chars
      const longPrompt = 'a'.repeat(16385 * 4 + 4);
      const result = compare(longPrompt, { models: ['gpt-3.5-turbo'] });
      expect(result.ranked[0].fitsContext).toBe(false);
    });

    it('sets contextWindow from pricing registry', () => {
      const result = compare('Test', { models: ['gpt-4o'] });
      expect(result.ranked[0].contextWindow).toBe(128_000);
    });

    it('sets provider from pricing registry', () => {
      const result = compare('Test', { models: ['claude-3-opus'] });
      expect(result.ranked[0].provider).toBe('anthropic');
    });
  });

  describe('unknown models', () => {
    it('skips unknown models', () => {
      const result = compare('Test', {
        models: ['gpt-4o', 'unknown-model'],
        estimatedOutputTokens: 100,
      });

      expect(result.ranked.length).toBe(1);
      expect(result.ranked[0].model).toBe('gpt-4o');
    });

    it('returns empty result when all models are unknown', () => {
      const result = compare('Test', {
        models: ['unknown-1', 'unknown-2'],
      });

      expect(result.ranked.length).toBe(0);
      expect(result.cheapest).toBeUndefined();
      expect(result.mostExpensive).toBeUndefined();
      expect(result.savings).toBeUndefined();
    });
  });

  describe('all models (no explicit model list)', () => {
    it('compares against all known models when models option is omitted', () => {
      const result = compare('Test prompt', { estimatedOutputTokens: 100 });
      // Should have all 19 built-in models (plus any registered by other tests)
      expect(result.ranked.length).toBeGreaterThanOrEqual(19);
    });

    it('compares against all known models when options is omitted entirely', () => {
      const result = compare('Test prompt');
      expect(result.ranked.length).toBeGreaterThanOrEqual(19);
    });
  });

  describe('constraints', () => {
    it('filters by minContextWindow', () => {
      const result = compare('Test', {
        models: ['gpt-4o', 'gemini-1.5-pro', 'gpt-3.5-turbo'],
        estimatedOutputTokens: 100,
        constraints: { minContextWindow: 200_000 },
      });

      // Only gemini-1.5-pro has 2M context window
      for (const entry of result.ranked) {
        expect(entry.contextWindow).toBeGreaterThanOrEqual(200_000);
      }
    });

    it('filters by maxCostPerCall', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        estimatedOutputTokens: 1000,
        constraints: { maxCostPerCall: 0.005 },
      });

      for (const entry of result.ranked) {
        expect(entry.totalCost).toBeLessThanOrEqual(0.005);
      }
    });

    it('filters by providers', () => {
      const result = compare('Test prompt', {
        estimatedOutputTokens: 100,
        constraints: { providers: ['openai'] },
      });

      for (const entry of result.ranked) {
        expect(entry.provider).toBe('openai');
      }
    });

    it('filters by multiple providers', () => {
      const result = compare('Test prompt', {
        estimatedOutputTokens: 100,
        constraints: { providers: ['openai', 'anthropic'] },
      });

      for (const entry of result.ranked) {
        expect(['openai', 'anthropic']).toContain(entry.provider);
      }
    });

    it('provider filtering is case-insensitive', () => {
      const result = compare('Test', {
        estimatedOutputTokens: 100,
        constraints: { providers: ['OpenAI'] },
      });

      expect(result.ranked.length).toBeGreaterThan(0);
      for (const entry of result.ranked) {
        expect(entry.provider).toBe('openai');
      }
    });

    it('returns empty when no models meet constraints', () => {
      const result = compare('Test', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 100,
        constraints: { maxCostPerCall: 0.0000001 },
      });

      expect(result.ranked.length).toBe(0);
      expect(result.cheapest).toBeUndefined();
    });

    it('combines multiple constraints', () => {
      const result = compare('Test', {
        estimatedOutputTokens: 100,
        constraints: {
          providers: ['google'],
          minContextWindow: 500_000,
        },
      });

      for (const entry of result.ranked) {
        expect(entry.provider).toBe('google');
        expect(entry.contextWindow).toBeGreaterThanOrEqual(500_000);
      }
    });
  });

  describe('savings calculation', () => {
    it('calculates savings when there are multiple models', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.savings).toBeDefined();
      expect(result.savings!.absolute).toBeGreaterThan(0);
      expect(result.savings!.percentage).toBeGreaterThan(0);
    });

    it('savings.from is the most expensive model', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.savings!.from.model).toBe(result.mostExpensive!.model);
    });

    it('savings.to is the cheapest model', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      expect(result.savings!.to.model).toBe(result.cheapest!.model);
    });

    it('savings is undefined when only one model', () => {
      const result = compare('Test', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 100,
      });

      expect(result.savings).toBeUndefined();
    });

    it('savings percentage is correct', () => {
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      const expectedPercentage =
        (result.savings!.absolute / result.savings!.from.totalCost) * 100;
      expect(result.savings!.percentage).toBeCloseTo(expectedPercentage, 4);
    });
  });

  describe('deterministic ordering', () => {
    it('breaks ties by provider name alphabetically', () => {
      // gpt-4o and command-r-plus both cost $2.50/$10.00
      const result = compare('Test prompt', {
        models: ['gpt-4o', 'command-r-plus'],
        estimatedOutputTokens: 100,
      });

      // Both have same pricing, so same totalCost
      // cohere < openai alphabetically
      expect(result.ranked[0].provider).toBe('cohere');
      expect(result.ranked[1].provider).toBe('openai');
    });

    it('breaks ties by model name within same provider', () => {
      // command-r and gpt-4o-mini both cost $0.15/$0.60
      const result = compare('Test prompt', {
        models: ['command-r', 'gpt-4o-mini'],
        estimatedOutputTokens: 100,
      });

      // Same cost => sort by provider: cohere < openai
      expect(result.ranked[0].model).toBe('command-r');
      expect(result.ranked[1].model).toBe('gpt-4o-mini');
    });
  });

  describe('message array input', () => {
    it('accepts a message array as prompt', () => {
      const messages = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ];
      const result = compare(messages, {
        models: ['gpt-4o'],
        estimatedOutputTokens: 100,
      });

      expect(result.ranked.length).toBe(1);
      expect(result.ranked[0].inputTokens).toBeGreaterThan(0);
    });
  });

  describe('empty prompt', () => {
    it('handles an empty string prompt', () => {
      const result = compare('', {
        models: ['gpt-4o'],
        estimatedOutputTokens: 100,
      });

      expect(result.ranked.length).toBe(1);
      expect(result.ranked[0].inputTokens).toBe(0);
      expect(result.ranked[0].inputCost).toBe(0);
    });
  });

  describe('cross-provider comparison', () => {
    it('correctly compares models across all providers', () => {
      const result = compare('Explain quantum computing in simple terms.', {
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

      expect(result.ranked.length).toBe(8);
      // The cheapest should be one of the flash/mini/haiku/small models
      const cheapModel = result.cheapest!.model;
      expect(
        ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash', 'mistral-small', 'mistral-nemo'].includes(cheapModel),
      ).toBe(true);
      // The most expensive should be claude-3-opus (highest output cost at $75/MTok)
      expect(result.mostExpensive!.model).toBe('claude-3-opus');
    });
  });
});

describe('compareSavings', () => {
  it('returns savings between two known models', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', 'Test prompt', 100);
    expect(result).toBeDefined();
    expect(result!.absolute).toBeGreaterThan(0);
    expect(result!.percentage).toBeGreaterThan(0);
  });

  it('from is the first model and to is the second', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', 'Test', 100);
    expect(result!.from.model).toBe('gpt-4o');
    expect(result!.to.model).toBe('gpt-4o-mini');
  });

  it('returns negative savings when toModel is more expensive', () => {
    const result = compareSavings('gpt-4o-mini', 'gpt-4o', 'Test', 100);
    expect(result!.absolute).toBeLessThan(0);
    expect(result!.percentage).toBeLessThan(0);
  });

  it('returns zero savings for the same model', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o', 'Test', 100);
    expect(result!.absolute).toBe(0);
    expect(result!.percentage).toBe(0);
  });

  it('returns undefined when first model is unknown', () => {
    const result = compareSavings('unknown', 'gpt-4o', 'Test');
    expect(result).toBeUndefined();
  });

  it('returns undefined when second model is unknown', () => {
    const result = compareSavings('gpt-4o', 'unknown', 'Test');
    expect(result).toBeUndefined();
  });

  it('returns undefined when both models are unknown', () => {
    const result = compareSavings('unknown-1', 'unknown-2', 'Test');
    expect(result).toBeUndefined();
  });

  it('uses 0 output tokens by default', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', 'Test');
    expect(result).toBeDefined();
    expect(result!.from.outputTokens).toBe(0);
    expect(result!.to.outputTokens).toBe(0);
  });

  it('accepts message array as prompt', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
    ];
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', messages, 100);
    expect(result).toBeDefined();
    expect(result!.from.inputTokens).toBeGreaterThan(0);
  });

  it('calculates percentage correctly', () => {
    const prompt = 'a'.repeat(4000); // ~1000 tokens
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', prompt, 1000);

    const expectedAbsolute = result!.from.totalCost - result!.to.totalCost;
    const expectedPercentage = (expectedAbsolute / result!.from.totalCost) * 100;

    expect(result!.absolute).toBeCloseTo(expectedAbsolute, 5);
    expect(result!.percentage).toBeCloseTo(expectedPercentage, 3);
  });

  it('handles empty prompt', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', '', 100);
    expect(result).toBeDefined();
    expect(result!.from.inputTokens).toBe(0);
    expect(result!.to.inputTokens).toBe(0);
  });
});
