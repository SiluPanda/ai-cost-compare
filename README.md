# ai-cost-compare

Cross-model cost comparison library for LLM API calls. Given a prompt and target models, it counts tokens, estimates cost, ranks models, and returns structured comparison results.

## Installation

```bash
npm install ai-cost-compare
```

## Quick Start

```typescript
import { compare, compareSavings } from 'ai-cost-compare';

// Compare costs across models
const result = compare('Explain quantum computing in simple terms.', {
  models: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-1.5-flash'],
  estimatedOutputTokens: 500,
});

console.log(`Cheapest: ${result.cheapest.model} at $${result.cheapest.totalCost.toFixed(6)}`);
for (const m of result.ranked) {
  console.log(`  ${m.model} (${m.provider}): $${m.totalCost.toFixed(6)}`);
}

// Calculate savings between two models
const savings = compareSavings('gpt-4o', 'gpt-4o-mini', 'Translate this to French.', 200);
if (savings) {
  console.log(`Savings: $${savings.absolute.toFixed(6)} (${savings.percentage.toFixed(1)}%)`);
}
```

## API

### `compare(prompt, options?)`

Compare the cost of a prompt across multiple models.

```typescript
const result = compare('Your prompt here', {
  models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-haiku'],
  estimatedOutputTokens: 500,
  constraints: {
    maxCostPerCall: 0.01,
    minContextWindow: 128_000,
    providers: ['openai', 'anthropic'],
  },
});
```

**Parameters:**
- `prompt` - String or array of `{ role, content }` chat messages
- `options.models` - Array of model names to compare (default: all known models)
- `options.estimatedOutputTokens` - Expected output token count (default: 0)
- `options.constraints.minContextWindow` - Minimum context window required
- `options.constraints.maxCostPerCall` - Maximum acceptable cost per call in USD
- `options.constraints.providers` - Only include models from these providers

**Returns:** `CompareResult` with `ranked`, `cheapest`, `mostExpensive`, and `savings` fields.

### `compareSavings(modelA, modelB, prompt, estimatedOutputTokens?)`

Calculate savings when switching from one model to another.

```typescript
const savings = compareSavings('gpt-4o', 'gpt-4o-mini', 'Your prompt', 500);
// savings.absolute  - USD saved per request
// savings.percentage - percentage savings
// savings.from      - cost breakdown for modelA
// savings.to        - cost breakdown for modelB
```

### `getModelPricing(model)`

Look up pricing for a specific model.

```typescript
const pricing = getModelPricing('gpt-4o');
// pricing.inputCostPerMillion  - USD per 1M input tokens
// pricing.outputCostPerMillion - USD per 1M output tokens
// pricing.contextWindow        - max context window in tokens
// pricing.provider              - provider name
```

### `listModels()`

List all known model identifiers.

### `registerModel(name, pricing)`

Register a custom model with pricing data.

```typescript
registerModel('my-model', {
  inputCostPerMillion: 1.00,
  outputCostPerMillion: 2.00,
  contextWindow: 64_000,
  provider: 'my-provider',
});
```

### `estimateTokens(text)`

Estimate token count for a text string using a chars/4 heuristic.

### `estimatePromptTokens(prompt)`

Estimate token count for a string or chat message array.

## Built-in Models

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o1-mini |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3.5-sonnet, claude-3.5-haiku |
| Google | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash |
| Cohere | command-r-plus, command-r |
| Mistral | mistral-large, mistral-small, mistral-nemo |

## License

MIT
