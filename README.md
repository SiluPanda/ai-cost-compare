# ai-cost-compare

**Cross-model cost comparison for LLM API calls.**

[![npm version](https://img.shields.io/npm/v/ai-cost-compare)](https://www.npmjs.com/package/ai-cost-compare)
[![npm downloads](https://img.shields.io/npm/dt/ai-cost-compare.svg)](https://www.npmjs.com/package/ai-cost-compare)
[![license](https://img.shields.io/npm/l/ai-cost-compare)](https://opensource.org/licenses/MIT)
[![node](https://img.shields.io/node/v/ai-cost-compare)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

`ai-cost-compare` estimates the cost of running a prompt across multiple LLM models and providers, ranks them by total cost, and quantifies savings between any two models. It accepts plain-text prompts or structured chat message arrays, supports 19 built-in models from 5 providers, and lets you register custom models with your own pricing data. All comparisons are local, synchronous, and require zero API keys.

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

console.log(`Cheapest: ${result.cheapest!.model} at $${result.cheapest!.totalCost.toFixed(6)}`);

for (const entry of result.ranked) {
  console.log(`  ${entry.model} (${entry.provider}): $${entry.totalCost.toFixed(6)}`);
}

// Calculate savings switching from one model to another
const savings = compareSavings('gpt-4o', 'gpt-4o-mini', 'Translate this to French.', 200);

if (savings) {
  console.log(`Savings: $${savings.absolute.toFixed(6)} (${savings.percentage.toFixed(1)}%)`);
}
```

## Features

- **Multi-model comparison** -- Compare cost across any combination of models with a single function call.
- **19 built-in models** -- Pre-loaded pricing for OpenAI, Anthropic, Google, Cohere, and Mistral models.
- **Constraint filtering** -- Filter by provider, minimum context window, or maximum cost per call.
- **Savings calculation** -- Quantify absolute and percentage savings between any two models.
- **Custom model registration** -- Add your own models with custom pricing data at runtime.
- **Chat message support** -- Accept both plain strings and `{ role, content }` message arrays.
- **Context window awareness** -- Each result indicates whether the prompt fits within the model's context window.
- **Deterministic ordering** -- Ties are broken by provider name, then model name, for reproducible results.
- **Zero runtime dependencies** -- No external packages required.
- **TypeScript-first** -- Full type definitions with strict mode. All interfaces are exported.

## API Reference

### `compare(prompt, options?)`

Compare the cost of a prompt across multiple models. Returns a ranked list of models sorted by total cost ascending.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string \| ChatMessage[]` | -- | The prompt text or array of chat messages. |
| `options.models` | `string[]` | All known models | Model identifiers to compare. |
| `options.estimatedOutputTokens` | `number` | `0` | Expected output token count, applied uniformly to all models. |
| `options.constraints` | `CompareConstraints` | -- | Constraints to filter the result set. |
| `options.constraints.minContextWindow` | `number` | -- | Exclude models with a context window smaller than this value (in tokens). |
| `options.constraints.maxCostPerCall` | `number` | -- | Exclude models whose total cost exceeds this value (in USD). |
| `options.constraints.providers` | `string[]` | -- | Only include models from these providers. Case-insensitive. |

**Returns:** `CompareResult`

```typescript
interface CompareResult {
  ranked: ModelCostBreakdown[];          // Models sorted by totalCost ascending
  cheapest: ModelCostBreakdown | undefined;      // Rank 1 model, or undefined if no models matched
  mostExpensive: ModelCostBreakdown | undefined;  // Last-ranked model, or undefined if no models matched
  savings: SavingsResult | undefined;             // Savings from most expensive to cheapest (requires >= 2 models)
}
```

**Example -- compare all known models:**

```typescript
const result = compare('Summarize this article.', {
  estimatedOutputTokens: 300,
});

console.log(`${result.ranked.length} models compared`);
console.log(`Cheapest: ${result.cheapest!.model} ($${result.cheapest!.totalCost.toFixed(6)})`);
```

**Example -- filter by provider and context window:**

```typescript
const result = compare('Process this long document...', {
  estimatedOutputTokens: 1000,
  constraints: {
    providers: ['google'],
    minContextWindow: 500_000,
  },
});

// Only Google models with >= 500K context window are included
```

---

### `compareSavings(modelA, modelB, prompt, estimatedOutputTokens?)`

Calculate savings when switching from one model to another for a given prompt.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `modelA` | `string` | -- | The "from" model (e.g., the current or more expensive model). |
| `modelB` | `string` | -- | The "to" model (e.g., the candidate or cheaper model). |
| `prompt` | `string \| ChatMessage[]` | -- | The prompt text or array of chat messages. |
| `estimatedOutputTokens` | `number` | `0` | Expected output token count. |

**Returns:** `SavingsResult | undefined` -- Returns `undefined` if either model is not found in the registry.

```typescript
interface SavingsResult {
  absolute: number;           // USD saved per request (positive = 'to' is cheaper)
  percentage: number;         // Percentage savings relative to 'from' model
  from: ModelCostBreakdown;   // Full cost breakdown for modelA
  to: ModelCostBreakdown;     // Full cost breakdown for modelB
}
```

**Example:**

```typescript
const savings = compareSavings('claude-3-opus', 'claude-3-haiku', 'Summarize this.', 500);

if (savings) {
  console.log(`Save $${savings.absolute.toFixed(6)} per request`);
  console.log(`${savings.percentage.toFixed(1)}% cheaper`);
  console.log(`From: ${savings.from.model} ($${savings.from.totalCost.toFixed(6)})`);
  console.log(`To:   ${savings.to.model} ($${savings.to.totalCost.toFixed(6)})`);
}
```

When the "to" model is more expensive, `absolute` and `percentage` are negative:

```typescript
const result = compareSavings('gpt-4o-mini', 'gpt-4o', 'Test', 100);
// result.absolute < 0 (switching to gpt-4o costs more)
```

---

### `getModelPricing(model)`

Look up pricing for a specific model by name.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `model` | `string` | Model identifier (e.g., `'gpt-4o'`, `'claude-3.5-sonnet'`). Case-sensitive. |

**Returns:** `ModelPricing | undefined`

```typescript
interface ModelPricing {
  inputCostPerMillion: number;   // USD per 1M input tokens
  outputCostPerMillion: number;  // USD per 1M output tokens
  contextWindow: number;         // Maximum context window in tokens
  provider: string;              // Provider name (e.g., 'openai', 'anthropic')
}
```

**Example:**

```typescript
const pricing = getModelPricing('gpt-4o');

if (pricing) {
  console.log(`Input:  $${pricing.inputCostPerMillion}/MTok`);
  console.log(`Output: $${pricing.outputCostPerMillion}/MTok`);
  console.log(`Context: ${pricing.contextWindow.toLocaleString()} tokens`);
  console.log(`Provider: ${pricing.provider}`);
}
```

---

### `listModels()`

List all known model identifiers in the registry, sorted alphabetically. Includes both built-in and custom-registered models.

**Returns:** `string[]`

**Example:**

```typescript
const models = listModels();
console.log(`${models.length} models available: ${models.join(', ')}`);
```

---

### `registerModel(name, pricing)`

Register a custom model with pricing data. If the model already exists, its pricing is overwritten. The pricing object is defensively copied, so mutations to the original object after registration have no effect.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Model identifier. Must be a non-empty string. |
| `pricing` | `ModelPricing` | Pricing data for the model. |

**Returns:** `void`

**Throws:**

- `Error` if `name` is empty.
- `Error` if `inputCostPerMillion` or `outputCostPerMillion` is negative.
- `Error` if `contextWindow` is zero or negative.
- `Error` if `provider` is empty.

**Example:**

```typescript
registerModel('my-fine-tuned-model', {
  inputCostPerMillion: 1.50,
  outputCostPerMillion: 4.00,
  contextWindow: 32_000,
  provider: 'custom',
});

// Now usable in comparisons
const result = compare('Test prompt', {
  models: ['gpt-4o', 'my-fine-tuned-model'],
  estimatedOutputTokens: 200,
});
```

Zero-cost models are valid (e.g., free-tier or self-hosted):

```typescript
registerModel('local-llama', {
  inputCostPerMillion: 0,
  outputCostPerMillion: 0,
  contextWindow: 8_000,
  provider: 'local',
});
```

---

### `estimateTokens(text)`

Estimate the number of tokens in a text string using a heuristic of ~4 characters per token.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `text` | `string` | The text to estimate tokens for. |

**Returns:** `number` -- Estimated token count (minimum 0). Uses `Math.ceil(text.length / 4)`.

**Example:**

```typescript
const tokens = estimateTokens('Hello, world!');
// 4 => Math.ceil(13 / 4) = 4
```

---

### `estimatePromptTokens(prompt)`

Estimate the token count for a prompt that may be a plain string or an array of chat messages. For message arrays, each message incurs a 4-token overhead for role/formatting metadata, plus a 2-token overhead for assistant reply priming.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `prompt` | `string \| ChatMessage[]` | A plain string or array of `{ role: string; content: string }` objects. |

**Returns:** `number`

**Example:**

```typescript
// Plain string
estimatePromptTokens('Hello');
// => Math.ceil(5 / 4) = 2

// Message array
estimatePromptTokens([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello' },
]);
// => (4 + 7) + (4 + 2) + 2 = 19
```

## Configuration

### Constraint Filtering

Constraints narrow the comparison result set without affecting cost calculations. Models are first priced, then filtered by constraints, then ranked.

```typescript
const result = compare('Analyze this dataset...', {
  estimatedOutputTokens: 2000,
  constraints: {
    providers: ['openai', 'anthropic'],   // Only these providers
    minContextWindow: 128_000,            // At least 128K context
    maxCostPerCall: 0.05,                 // No more than $0.05 per call
  },
});
```

Constraints can be combined freely. When no models satisfy all constraints, the result contains an empty `ranked` array and `cheapest`/`mostExpensive`/`savings` are all `undefined`.

### Token Estimation

Token counts are estimated using a 4-characters-per-token heuristic, which is a reasonable average across English text for most LLM tokenizers. For chat message arrays, each message adds a 4-token overhead for role and formatting metadata, plus a global 2-token overhead for assistant reply priming.

This heuristic is intentionally simple and deterministic. The same prompt always produces the same token count regardless of the target model, making cross-model cost comparisons fair and reproducible.

## Error Handling

**Unknown models are silently skipped.** When a model name in the `models` array does not match any entry in the registry, it is excluded from the result without throwing an error.

```typescript
const result = compare('Test', {
  models: ['gpt-4o', 'nonexistent-model'],
  estimatedOutputTokens: 100,
});

// result.ranked.length === 1 (only gpt-4o)
```

**All unknown models produce an empty result.** When every model in the list is unknown, the result contains an empty `ranked` array.

```typescript
const result = compare('Test', { models: ['fake-a', 'fake-b'] });

result.ranked.length;     // 0
result.cheapest;          // undefined
result.mostExpensive;     // undefined
result.savings;           // undefined
```

**`compareSavings` returns `undefined` for unknown models.** If either model is not in the registry, the function returns `undefined` rather than throwing.

```typescript
const savings = compareSavings('gpt-4o', 'unknown-model', 'Test');
// savings === undefined
```

**`registerModel` throws on invalid input.** Validation errors are thrown synchronously:

```typescript
registerModel('', pricing);              // Error: Model name must be a non-empty string
registerModel('m', { ...p, inputCostPerMillion: -1 });  // Error: Cost per million tokens must not be negative
registerModel('m', { ...p, contextWindow: 0 });         // Error: Context window must be a positive number
registerModel('m', { ...p, provider: '' });              // Error: Provider must be a non-empty string
```

## Advanced Usage

### Cross-Provider Cost Analysis

Compare models from every provider to find the cheapest option for a workload:

```typescript
const result = compare('Translate the following document to Spanish...', {
  models: [
    'gpt-4o', 'gpt-4o-mini',
    'claude-3.5-sonnet', 'claude-3-haiku',
    'gemini-1.5-pro', 'gemini-1.5-flash',
    'mistral-large', 'mistral-small',
    'command-r-plus', 'command-r',
  ],
  estimatedOutputTokens: 500,
});

for (const entry of result.ranked) {
  console.log(
    `#${result.ranked.indexOf(entry) + 1} ${entry.model} (${entry.provider}): ` +
    `$${entry.totalCost.toFixed(6)} | ` +
    `in: ${entry.inputTokens} tok ($${entry.inputCost.toFixed(6)}) | ` +
    `out: ${entry.outputTokens} tok ($${entry.outputCost.toFixed(6)}) | ` +
    `ctx: ${entry.contextWindow.toLocaleString()} | fits: ${entry.fitsContext}`
  );
}
```

### Budget-Constrained Model Selection

Find the cheapest model that fits within a per-request budget:

```typescript
const result = compare('Generate a detailed report...', {
  estimatedOutputTokens: 5000,
  constraints: { maxCostPerCall: 0.01 },
});

if (result.cheapest) {
  console.log(`Use ${result.cheapest.model} at $${result.cheapest.totalCost.toFixed(6)}/request`);
} else {
  console.log('No model fits within the $0.01 budget for this workload');
}
```

### Migration Cost Analysis

Quantify savings before migrating from an expensive model to a cheaper one:

```typescript
const prompt = 'Your representative production prompt here...';
const outputTokens = 1000;

const savings = compareSavings('gpt-4o', 'gpt-4o-mini', prompt, outputTokens);

if (savings) {
  const monthlyRequests = 500_000;
  const monthlySavings = savings.absolute * monthlyRequests;

  console.log(`Per-request savings: $${savings.absolute.toFixed(6)} (${savings.percentage.toFixed(1)}%)`);
  console.log(`Projected monthly savings at ${monthlyRequests.toLocaleString()} requests: $${monthlySavings.toFixed(2)}`);
}
```

### Context Window Validation

Identify which models can handle long-context workloads:

```typescript
const longDocument = fs.readFileSync('large-document.txt', 'utf-8');

const result = compare(longDocument, {
  estimatedOutputTokens: 1000,
});

const fits = result.ranked.filter(e => e.fitsContext);
const tooSmall = result.ranked.filter(e => !e.fitsContext);

console.log(`Models that fit: ${fits.map(e => e.model).join(', ')}`);
console.log(`Models too small: ${tooSmall.map(e => e.model).join(', ')}`);
```

## TypeScript

All types are exported from the package entry point:

```typescript
import type {
  ModelPricing,
  CompareOptions,
  CompareConstraints,
  CompareResult,
  ModelCostBreakdown,
  SavingsResult,
  ChatMessage,
} from 'ai-cost-compare';
```

### `ModelCostBreakdown`

Per-model cost breakdown returned in comparison results:

```typescript
interface ModelCostBreakdown {
  model: string;           // Model identifier
  provider: string;        // Provider name
  inputTokens: number;     // Input token count
  outputTokens: number;    // Estimated output token count
  inputCost: number;       // Input cost in USD
  outputCost: number;      // Output cost in USD
  totalCost: number;       // Total cost in USD (inputCost + outputCost)
  contextWindow: number;   // Maximum context window in tokens
  fitsContext: boolean;     // Whether the prompt fits within the context window
}
```

### `ChatMessage`

Message format for structured chat inputs:

```typescript
interface ChatMessage {
  role: string;
  content: string;
}
```

All USD cost values are rounded to 6 decimal places using `Math.round(value * 1_000_000) / 1_000_000` to avoid floating-point artifacts.

## Built-in Models

| Provider | Model | Input ($/MTok) | Output ($/MTok) | Context Window |
|---|---|---:|---:|---:|
| OpenAI | `gpt-4o` | 2.50 | 10.00 | 128,000 |
| OpenAI | `gpt-4o-mini` | 0.15 | 0.60 | 128,000 |
| OpenAI | `gpt-4-turbo` | 10.00 | 30.00 | 128,000 |
| OpenAI | `gpt-3.5-turbo` | 0.50 | 1.50 | 16,385 |
| OpenAI | `o1` | 15.00 | 60.00 | 200,000 |
| OpenAI | `o1-mini` | 3.00 | 12.00 | 128,000 |
| Anthropic | `claude-3-opus` | 15.00 | 75.00 | 200,000 |
| Anthropic | `claude-3-sonnet` | 3.00 | 15.00 | 200,000 |
| Anthropic | `claude-3-haiku` | 0.25 | 1.25 | 200,000 |
| Anthropic | `claude-3.5-sonnet` | 3.00 | 15.00 | 200,000 |
| Anthropic | `claude-3.5-haiku` | 0.80 | 4.00 | 200,000 |
| Google | `gemini-1.5-pro` | 1.25 | 5.00 | 2,000,000 |
| Google | `gemini-1.5-flash` | 0.075 | 0.30 | 1,000,000 |
| Google | `gemini-2.0-flash` | 0.10 | 0.40 | 1,000,000 |
| Cohere | `command-r-plus` | 2.50 | 10.00 | 128,000 |
| Cohere | `command-r` | 0.15 | 0.60 | 128,000 |
| Mistral | `mistral-large` | 2.00 | 6.00 | 128,000 |
| Mistral | `mistral-small` | 0.20 | 0.60 | 128,000 |
| Mistral | `mistral-nemo` | 0.15 | 0.15 | 128,000 |

## License

MIT
