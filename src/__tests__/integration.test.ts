import { describe, it, expect } from 'vitest';
import {
  compare,
  compareSavings,
  getModelPricing,
  listModels,
  registerModel,
  estimateTokens,
  estimatePromptTokens,
} from '../index';

describe('integration: public API exports', () => {
  it('exports compare function', () => {
    expect(typeof compare).toBe('function');
  });

  it('exports compareSavings function', () => {
    expect(typeof compareSavings).toBe('function');
  });

  it('exports getModelPricing function', () => {
    expect(typeof getModelPricing).toBe('function');
  });

  it('exports listModels function', () => {
    expect(typeof listModels).toBe('function');
  });

  it('exports registerModel function', () => {
    expect(typeof registerModel).toBe('function');
  });

  it('exports estimateTokens function', () => {
    expect(typeof estimateTokens).toBe('function');
  });

  it('exports estimatePromptTokens function', () => {
    expect(typeof estimatePromptTokens).toBe('function');
  });
});

describe('integration: end-to-end cost comparison workflow', () => {
  it('compares OpenAI models for a simple prompt', () => {
    const result = compare('Explain quantum computing in simple terms.', {
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      estimatedOutputTokens: 500,
    });

    expect(result.ranked.length).toBe(3);
    expect(result.cheapest!.model).toBe('gpt-4o-mini');
    expect(result.mostExpensive!.model).toBe('gpt-4-turbo');
    expect(result.savings).toBeDefined();
    expect(result.savings!.absolute).toBeGreaterThan(0);
  });

  it('compares Anthropic models for a prompt', () => {
    const result = compare('Write a poem about the sea.', {
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-3.5-sonnet', 'claude-3.5-haiku'],
      estimatedOutputTokens: 200,
    });

    expect(result.ranked.length).toBe(5);
    expect(result.cheapest!.model).toBe('claude-3-haiku');
    expect(result.mostExpensive!.model).toBe('claude-3-opus');
  });

  it('compares across all providers', () => {
    const result = compare('Translate this to French: Hello, how are you?', {
      models: [
        'gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro',
        'command-r-plus', 'mistral-large',
      ],
      estimatedOutputTokens: 50,
    });

    expect(result.ranked.length).toBe(5);
    const providers = result.ranked.map(r => r.provider);
    expect(new Set(providers).size).toBe(5);
  });

  it('full workflow: estimate tokens, look up pricing, compare, get savings', () => {
    const prompt = 'Summarize the following article about machine learning...';
    const tokens = estimateTokens(prompt);
    expect(tokens).toBeGreaterThan(0);

    const pricing = getModelPricing('gpt-4o');
    expect(pricing).toBeDefined();

    const result = compare(prompt, {
      models: ['gpt-4o', 'gpt-4o-mini'],
      estimatedOutputTokens: 200,
    });
    expect(result.cheapest!.model).toBe('gpt-4o-mini');

    const savings = compareSavings('gpt-4o', 'gpt-4o-mini', prompt, 200);
    expect(savings).toBeDefined();
    expect(savings!.absolute).toBeGreaterThan(0);
    expect(savings!.from.model).toBe('gpt-4o');
    expect(savings!.to.model).toBe('gpt-4o-mini');
  });
});

describe('integration: custom model registration and comparison', () => {
  it('registers a custom model and includes it in comparison', () => {
    registerModel('my-custom-llm', {
      inputCostPerMillion: 0.01,
      outputCostPerMillion: 0.02,
      contextWindow: 32_000,
      provider: 'custom-provider',
    });

    const result = compare('Test prompt', {
      models: ['gpt-4o', 'my-custom-llm'],
      estimatedOutputTokens: 100,
    });

    expect(result.ranked.length).toBe(2);
    expect(result.cheapest!.model).toBe('my-custom-llm');
    expect(result.cheapest!.provider).toBe('custom-provider');
  });

  it('custom model appears in listModels', () => {
    registerModel('integration-test-model', {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      contextWindow: 64_000,
      provider: 'test',
    });

    expect(listModels()).toContain('integration-test-model');
  });
});

describe('integration: constraint-based model selection', () => {
  it('finds cheapest model with large context window', () => {
    const result = compare('Long document prompt...', {
      estimatedOutputTokens: 1000,
      constraints: { minContextWindow: 500_000 },
    });

    for (const entry of result.ranked) {
      expect(entry.contextWindow).toBeGreaterThanOrEqual(500_000);
    }
    // Only Google models have >= 500K context
    expect(result.cheapest!.provider).toBe('google');
  });

  it('finds models within a budget', () => {
    const result = compare('Short prompt', {
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-opus'],
      estimatedOutputTokens: 100,
      constraints: { maxCostPerCall: 0.001 },
    });

    for (const entry of result.ranked) {
      expect(entry.totalCost).toBeLessThanOrEqual(0.001);
    }
  });

  it('selects models from specific provider', () => {
    const result = compare('Test', {
      estimatedOutputTokens: 100,
      constraints: { providers: ['anthropic'] },
    });

    expect(result.ranked.length).toBeGreaterThan(0);
    for (const entry of result.ranked) {
      expect(entry.provider).toBe('anthropic');
    }
  });
});

describe('integration: realistic cost comparison scenarios', () => {
  it('short prompt: mini/flash models are cheapest', () => {
    const prompt = 'What is 2+2?';
    const result = compare(prompt, {
      models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
      estimatedOutputTokens: 10,
    });

    // All mini/flash/haiku models should be cheaper than gpt-4o
    const cheapModel = result.cheapest!.model;
    expect(['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash']).toContain(cheapModel);
  });

  it('long prompt: context window matters', () => {
    // Simulate a 100K token prompt (400K chars)
    const longPrompt = 'a'.repeat(400_000);
    const result = compare(longPrompt, {
      models: ['gpt-3.5-turbo', 'gpt-4o', 'gemini-1.5-pro'],
      estimatedOutputTokens: 100,
    });

    // gpt-3.5-turbo should not fit (16K context)
    const gpt35 = result.ranked.find(r => r.model === 'gpt-3.5-turbo');
    if (gpt35) {
      expect(gpt35.fitsContext).toBe(false);
    }

    // gemini-1.5-pro should fit (2M context)
    const gemini = result.ranked.find(r => r.model === 'gemini-1.5-pro');
    if (gemini) {
      expect(gemini.fitsContext).toBe(true);
    }
  });

  it('high output volume: output cost dominates', () => {
    const prompt = 'Write a long essay.';
    const result = compare(prompt, {
      models: ['gpt-4o', 'gpt-4o-mini'],
      estimatedOutputTokens: 10_000,
    });

    // With 10K output tokens, output cost should dwarf input cost
    for (const entry of result.ranked) {
      expect(entry.outputCost).toBeGreaterThan(entry.inputCost);
    }
  });

  it('zero output tokens: only input cost matters', () => {
    const prompt = 'a'.repeat(4000); // ~1000 tokens
    const result = compare(prompt, {
      models: ['gpt-4o', 'claude-3-opus'],
      estimatedOutputTokens: 0,
    });

    for (const entry of result.ranked) {
      expect(entry.outputCost).toBe(0);
      expect(entry.totalCost).toBe(entry.inputCost);
    }
  });
});

describe('integration: savings calculations', () => {
  it('gpt-4o to gpt-4o-mini shows significant savings', () => {
    const prompt = 'a'.repeat(4000); // ~1000 tokens
    const result = compareSavings('gpt-4o', 'gpt-4o-mini', prompt, 1000);

    expect(result).toBeDefined();
    // gpt-4o is ~16x more expensive than gpt-4o-mini
    expect(result!.percentage).toBeGreaterThan(90);
  });

  it('claude-3-opus to claude-3-haiku shows huge savings', () => {
    const prompt = 'Summarize this text.';
    const result = compareSavings('claude-3-opus', 'claude-3-haiku', prompt, 500);

    expect(result).toBeDefined();
    expect(result!.absolute).toBeGreaterThan(0);
    expect(result!.percentage).toBeGreaterThan(90);
  });

  it('same model returns zero savings', () => {
    const result = compareSavings('gpt-4o', 'gpt-4o', 'Test', 100);
    expect(result!.absolute).toBe(0);
    expect(result!.percentage).toBe(0);
  });
});

describe('integration: message array prompts', () => {
  it('compares costs for a conversation with system prompt', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is machine learning?' },
    ];

    const result = compare(messages, {
      models: ['gpt-4o', 'gpt-4o-mini'],
      estimatedOutputTokens: 300,
    });

    expect(result.ranked.length).toBe(2);
    expect(result.cheapest!.model).toBe('gpt-4o-mini');
  });

  it('message array produces more tokens than plain content due to overhead', () => {
    const content = 'Hello, world!';
    const plainTokens = estimatePromptTokens(content);
    const messageTokens = estimatePromptTokens([{ role: 'user', content }]);

    // Message array should have more tokens due to per-message overhead + priming
    expect(messageTokens).toBeGreaterThan(plainTokens);
  });
});

describe('integration: edge cases', () => {
  it('handles empty prompt with output tokens', () => {
    const result = compare('', {
      models: ['gpt-4o'],
      estimatedOutputTokens: 1000,
    });

    expect(result.ranked.length).toBe(1);
    expect(result.ranked[0].inputCost).toBe(0);
    expect(result.ranked[0].outputCost).toBeGreaterThan(0);
  });

  it('handles single model comparison', () => {
    const result = compare('Test', {
      models: ['gpt-4o'],
      estimatedOutputTokens: 100,
    });

    expect(result.ranked.length).toBe(1);
    expect(result.cheapest!.model).toBe('gpt-4o');
    expect(result.mostExpensive!.model).toBe('gpt-4o');
    expect(result.savings).toBeUndefined();
  });

  it('handles comparison with only unknown models', () => {
    const result = compare('Test', {
      models: ['fake-model-a', 'fake-model-b'],
    });

    expect(result.ranked.length).toBe(0);
    expect(result.cheapest).toBeUndefined();
    expect(result.mostExpensive).toBeUndefined();
    expect(result.savings).toBeUndefined();
  });

  it('handles very large output token count', () => {
    const result = compare('Short', {
      models: ['gpt-4o'],
      estimatedOutputTokens: 1_000_000,
    });

    expect(result.ranked[0].outputCost).toBe(10.0);
    expect(result.ranked[0].totalCost).toBeGreaterThan(0);
  });
});
