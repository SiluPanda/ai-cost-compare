import { describe, it, expect } from 'vitest';
import { getModelPricing, listModels, registerModel } from '../pricing';
import type { ModelPricing } from '../types';

describe('getModelPricing', () => {
  it('returns pricing for gpt-4o', () => {
    const pricing = getModelPricing('gpt-4o');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
    expect(pricing!.inputCostPerMillion).toBe(2.50);
    expect(pricing!.outputCostPerMillion).toBe(10.00);
    expect(pricing!.contextWindow).toBe(128_000);
  });

  it('returns pricing for gpt-4o-mini', () => {
    const pricing = getModelPricing('gpt-4o-mini');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
    expect(pricing!.inputCostPerMillion).toBe(0.15);
    expect(pricing!.outputCostPerMillion).toBe(0.60);
  });

  it('returns pricing for gpt-4-turbo', () => {
    const pricing = getModelPricing('gpt-4-turbo');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
    expect(pricing!.inputCostPerMillion).toBe(10.00);
    expect(pricing!.outputCostPerMillion).toBe(30.00);
  });

  it('returns pricing for gpt-3.5-turbo', () => {
    const pricing = getModelPricing('gpt-3.5-turbo');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
  });

  it('returns pricing for o1', () => {
    const pricing = getModelPricing('o1');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
    expect(pricing!.inputCostPerMillion).toBe(15.00);
    expect(pricing!.outputCostPerMillion).toBe(60.00);
    expect(pricing!.contextWindow).toBe(200_000);
  });

  it('returns pricing for o1-mini', () => {
    const pricing = getModelPricing('o1-mini');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('openai');
  });

  it('returns pricing for claude-3-opus', () => {
    const pricing = getModelPricing('claude-3-opus');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('anthropic');
    expect(pricing!.inputCostPerMillion).toBe(15.00);
    expect(pricing!.outputCostPerMillion).toBe(75.00);
  });

  it('returns pricing for claude-3-sonnet', () => {
    const pricing = getModelPricing('claude-3-sonnet');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('anthropic');
  });

  it('returns pricing for claude-3-haiku', () => {
    const pricing = getModelPricing('claude-3-haiku');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('anthropic');
    expect(pricing!.inputCostPerMillion).toBe(0.25);
    expect(pricing!.outputCostPerMillion).toBe(1.25);
  });

  it('returns pricing for claude-3.5-sonnet', () => {
    const pricing = getModelPricing('claude-3.5-sonnet');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('anthropic');
    expect(pricing!.inputCostPerMillion).toBe(3.00);
    expect(pricing!.outputCostPerMillion).toBe(15.00);
  });

  it('returns pricing for claude-3.5-haiku', () => {
    const pricing = getModelPricing('claude-3.5-haiku');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('anthropic');
  });

  it('returns pricing for gemini-1.5-pro', () => {
    const pricing = getModelPricing('gemini-1.5-pro');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('google');
    expect(pricing!.contextWindow).toBe(2_000_000);
  });

  it('returns pricing for gemini-1.5-flash', () => {
    const pricing = getModelPricing('gemini-1.5-flash');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('google');
    expect(pricing!.contextWindow).toBe(1_000_000);
  });

  it('returns pricing for gemini-2.0-flash', () => {
    const pricing = getModelPricing('gemini-2.0-flash');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('google');
  });

  it('returns pricing for command-r-plus', () => {
    const pricing = getModelPricing('command-r-plus');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('cohere');
  });

  it('returns pricing for command-r', () => {
    const pricing = getModelPricing('command-r');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('cohere');
  });

  it('returns pricing for mistral-large', () => {
    const pricing = getModelPricing('mistral-large');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('mistral');
  });

  it('returns pricing for mistral-small', () => {
    const pricing = getModelPricing('mistral-small');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('mistral');
  });

  it('returns pricing for mistral-nemo', () => {
    const pricing = getModelPricing('mistral-nemo');
    expect(pricing).toBeDefined();
    expect(pricing!.provider).toBe('mistral');
  });

  it('returns undefined for an unknown model', () => {
    expect(getModelPricing('nonexistent-model')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getModelPricing('')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getModelPricing('GPT-4O')).toBeUndefined();
    expect(getModelPricing('gpt-4o')).toBeDefined();
  });
});

describe('listModels', () => {
  it('returns an array of model names', () => {
    const models = listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThanOrEqual(19);
  });

  it('includes all OpenAI models', () => {
    const models = listModels();
    expect(models).toContain('gpt-4o');
    expect(models).toContain('gpt-4o-mini');
    expect(models).toContain('gpt-4-turbo');
    expect(models).toContain('gpt-3.5-turbo');
    expect(models).toContain('o1');
    expect(models).toContain('o1-mini');
  });

  it('includes all Anthropic models', () => {
    const models = listModels();
    expect(models).toContain('claude-3-opus');
    expect(models).toContain('claude-3-sonnet');
    expect(models).toContain('claude-3-haiku');
    expect(models).toContain('claude-3.5-sonnet');
    expect(models).toContain('claude-3.5-haiku');
  });

  it('includes all Google models', () => {
    const models = listModels();
    expect(models).toContain('gemini-1.5-pro');
    expect(models).toContain('gemini-1.5-flash');
    expect(models).toContain('gemini-2.0-flash');
  });

  it('includes Cohere models', () => {
    const models = listModels();
    expect(models).toContain('command-r-plus');
    expect(models).toContain('command-r');
  });

  it('includes Mistral models', () => {
    const models = listModels();
    expect(models).toContain('mistral-large');
    expect(models).toContain('mistral-small');
    expect(models).toContain('mistral-nemo');
  });

  it('returns models sorted alphabetically', () => {
    const models = listModels();
    const sorted = [...models].sort();
    expect(models).toEqual(sorted);
  });
});

describe('registerModel', () => {
  it('adds a new model to the registry', () => {
    const pricing: ModelPricing = {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      contextWindow: 64_000,
      provider: 'custom',
    };
    registerModel('custom-model-1', pricing);

    const result = getModelPricing('custom-model-1');
    expect(result).toBeDefined();
    expect(result!.inputCostPerMillion).toBe(1.00);
    expect(result!.outputCostPerMillion).toBe(2.00);
    expect(result!.contextWindow).toBe(64_000);
    expect(result!.provider).toBe('custom');
  });

  it('overwrites an existing model', () => {
    const pricing: ModelPricing = {
      inputCostPerMillion: 5.00,
      outputCostPerMillion: 10.00,
      contextWindow: 32_000,
      provider: 'custom',
    };
    registerModel('custom-overwrite', pricing);

    const updated: ModelPricing = {
      inputCostPerMillion: 3.00,
      outputCostPerMillion: 6.00,
      contextWindow: 64_000,
      provider: 'custom-v2',
    };
    registerModel('custom-overwrite', updated);

    const result = getModelPricing('custom-overwrite');
    expect(result!.inputCostPerMillion).toBe(3.00);
    expect(result!.provider).toBe('custom-v2');
  });

  it('appears in listModels after registration', () => {
    const pricing: ModelPricing = {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      contextWindow: 64_000,
      provider: 'test',
    };
    registerModel('listed-custom-model', pricing);
    expect(listModels()).toContain('listed-custom-model');
  });

  it('makes a defensive copy of the pricing data', () => {
    const pricing: ModelPricing = {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      contextWindow: 64_000,
      provider: 'test',
    };
    registerModel('copy-test-model', pricing);

    // Mutate the original
    pricing.inputCostPerMillion = 999;

    const result = getModelPricing('copy-test-model');
    expect(result!.inputCostPerMillion).toBe(1.00);
  });

  it('throws on empty model name', () => {
    const pricing: ModelPricing = {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 2.00,
      contextWindow: 64_000,
      provider: 'test',
    };
    expect(() => registerModel('', pricing)).toThrow('non-empty string');
  });

  it('throws on negative input cost', () => {
    expect(() =>
      registerModel('bad-model', {
        inputCostPerMillion: -1,
        outputCostPerMillion: 2.00,
        contextWindow: 64_000,
        provider: 'test',
      }),
    ).toThrow('must not be negative');
  });

  it('throws on negative output cost', () => {
    expect(() =>
      registerModel('bad-model', {
        inputCostPerMillion: 1.00,
        outputCostPerMillion: -2.00,
        contextWindow: 64_000,
        provider: 'test',
      }),
    ).toThrow('must not be negative');
  });

  it('throws on zero context window', () => {
    expect(() =>
      registerModel('bad-model', {
        inputCostPerMillion: 1.00,
        outputCostPerMillion: 2.00,
        contextWindow: 0,
        provider: 'test',
      }),
    ).toThrow('positive number');
  });

  it('throws on negative context window', () => {
    expect(() =>
      registerModel('bad-model', {
        inputCostPerMillion: 1.00,
        outputCostPerMillion: 2.00,
        contextWindow: -1,
        provider: 'test',
      }),
    ).toThrow('positive number');
  });

  it('throws on empty provider', () => {
    expect(() =>
      registerModel('bad-model', {
        inputCostPerMillion: 1.00,
        outputCostPerMillion: 2.00,
        contextWindow: 64_000,
        provider: '',
      }),
    ).toThrow('non-empty string');
  });

  it('allows zero input cost (free models)', () => {
    registerModel('free-input-model', {
      inputCostPerMillion: 0,
      outputCostPerMillion: 1.00,
      contextWindow: 32_000,
      provider: 'free-tier',
    });
    const result = getModelPricing('free-input-model');
    expect(result!.inputCostPerMillion).toBe(0);
  });

  it('allows zero output cost', () => {
    registerModel('free-output-model', {
      inputCostPerMillion: 1.00,
      outputCostPerMillion: 0,
      contextWindow: 32_000,
      provider: 'free-tier',
    });
    const result = getModelPricing('free-output-model');
    expect(result!.outputCostPerMillion).toBe(0);
  });
});
