# ai-cost-compare -- Specification

## 1. Overview

`ai-cost-compare` is a programmatic cross-model cost comparison library for LLM API calls. Given a prompt (or structured messages array) and a set of target models, it counts tokens per model, estimates the cost on each, ranks the models by cost, and returns a structured comparison result -- all with a single function call: `compare(prompt, models)`. The result includes per-model cost breakdowns, a ranked list from cheapest to most expensive, absolute and percentage savings between any two models, and convenience accessors for the cheapest model that meets caller-specified constraints (minimum context window, maximum cost budget). It answers the question "which model is cheapest for this prompt?" programmatically, enabling cost-aware model routing, migration cost analysis, and budget optimization in code, scripts, and CI pipelines.

The gap this package fills is specific and well-defined. Price differences between LLM models are enormous -- the same prompt that costs $0.001 on GPT-4o-mini costs $0.05 on Claude Opus 4, a 50x difference. Web-based calculators exist (Helicone Calculator, LLMPriceCheck, llm-price.com) but are browser-only, require manual input, and cannot be integrated into code. `prompt-price` (this monorepo) estimates the cost of a single prompt on a single model, but developers choosing between models need to compare costs across many models simultaneously, account for per-model token count differences (different tokenizers produce different token counts from the same text), rank results, and quantify savings. No npm package provides this programmatic multi-model comparison capability.

`ai-cost-compare` composes `prompt-price` for per-model cost estimation and `model-price-registry` for pricing data and model discovery, adding the comparison, ranking, savings calculation, and model selection logic that neither upstream package provides. It offers both a TypeScript/JavaScript API for programmatic use and a CLI for terminal-based comparisons. The API returns structured `ComparisonResult` objects with ranked cost breakdowns. The CLI prints human-readable tables or JSON output. Both interfaces support configurable output token estimation, model filtering, budget constraints, and baseline comparisons.

---

## 2. Goals and Non-Goals

### Goals

- Provide a `compare(prompt, models, options?)` function that estimates the cost of a prompt on each specified model, ranks them by total cost, and returns a structured `ComparisonResult` with per-model breakdowns, cheapest/most expensive accessors, and savings calculations.
- Support comparing against all known models in `model-price-registry` when no explicit model list is provided, enabling "what's the cheapest model for this prompt?" across the entire ecosystem.
- Support both plain-text prompt strings and structured messages arrays as input, matching the input formats accepted by `prompt-price`.
- Count input tokens per model using `prompt-price`'s per-provider token counting (exact via `js-tiktoken` for OpenAI, heuristic for others), so comparisons reflect actual per-tokenizer differences.
- Estimate output tokens using the same configurable strategies as `prompt-price`: explicit count, ratio, max tokens, or per-model category defaults.
- Provide `cheapest(prompt, models?, options?)` as a convenience function that returns the single cheapest model's cost data without the full ranked list.
- Provide `cheapestAbove(prompt, minContextWindow, models?, options?)` to find the cheapest model that meets a minimum context window requirement.
- Provide `budgetFilter(prompt, maxCost, models?, options?)` to return all models whose estimated cost falls within a budget threshold.
- Provide `savings(prompt, fromModel, toModel, options?)` to quantify the cost difference between two specific models in absolute dollars, percentage, and projected monthly savings at a given request volume.
- Provide a `createComparator(config)` factory for creating pre-configured comparator instances with default models, output estimation, and token counting preferences.
- Provide a CLI (`ai-cost-compare`) for terminal-based cost comparison with human-readable table output, JSON output, and deterministic exit codes.
- Zero direct runtime dependencies beyond peer dependencies on `prompt-price` and `model-price-registry`.
- Target Node.js 18+. Use only built-in modules for non-tokenizer functionality.

### Non-Goals

- **Not a cost tracker.** This package compares estimated costs before API calls. It does not intercept API responses, parse usage headers, or track actual spend. For post-hoc cost tracking, use `ai-chargeback` or `ai-spend-forecast` from this monorepo.
- **Not a quality evaluator.** This package compares cost only. It does not benchmark model output quality, accuracy, or latency. Choosing the cheapest model is only half the decision; quality assessment requires domain-specific evaluation outside this package's scope.
- **Not a routing engine.** This package provides cost data to inform routing decisions. It does not intercept API calls, select models at runtime, or route requests. For cost-aware routing, use `prompt-flags` from this monorepo, which can consume `ai-cost-compare` as a data source.
- **Not a tokenizer.** This package delegates token counting to `prompt-price`. It does not expose tokenizer APIs or implement tokenization logic.
- **Not a billing system.** Estimates use published list prices from `model-price-registry`. They do not model batch discounts, committed use agreements, volume tiers, or enterprise pricing. Actual costs may differ.
- **Not a spend forecaster.** This package compares per-request costs. For projecting total monthly or annual spend based on usage patterns, use `ai-spend-forecast` from this monorepo.

---

## 3. Target Users and Use Cases

### Cost-Conscious AI Application Developers

Developers building applications that call LLM APIs and want to choose the cheapest model that meets their quality requirements. A developer starting a new project evaluates GPT-4o ($2.50/$10.00 per MTok), Claude Sonnet 4.5 ($3.00/$15.00), Gemini 2.5 Pro ($1.25/$10.00), and their cheaper alternatives. Running `compare()` on a representative prompt with expected output length gives an instant cost ranking, replacing manual arithmetic on pricing pages. For a 5,000-token prompt with 1,000-token output, the cost difference between Claude Opus 4 ($0.15) and GPT-4.1-nano ($0.0009) is over 150x -- a difference that compounds to thousands of dollars per month at scale.

### Platform / FinOps Engineers

Engineers managing LLM costs across an organization. They need to answer questions like "if we migrate our summarization pipeline from GPT-4o to Gemini 2.5 Flash, how much do we save per month at 500K requests?" The `savings()` function computes the per-request savings and projects it at a given volume. This feeds into migration cost-benefit analyses and quarterly spend reviews.

### Model Migration Engineers

Engineers planning model migrations -- moving from an older, more expensive model to a newer, cheaper one. When OpenAI releases GPT-4.1 at $2.00/$8.00 vs. GPT-4o at $2.50/$10.00, engineers need to quantify the savings across their workload. `compare()` on representative prompts gives precise per-request savings, and `savings()` projects the monthly impact.

### CI/CD Pipeline Operators

Engineers who want to gate deployments on cost constraints. A CI step runs `ai-cost-compare` on representative prompts to verify that the configured model stays within the per-request budget. If a code change switches from GPT-4o-mini to GPT-4o without justification, the CI check flags the 16x cost increase. The CLI's deterministic exit codes (0 for within budget, 1 for exceeded) enable scripted gatekeeping.

### Prompt Engineers

Engineers iterating on prompts who want to understand the cost impact of their prompt changes across the models they are evaluating. Adding a 2,000-word system prompt might be negligible on GPT-4.1-nano ($0.10/MTok input) but significant on Claude Opus 4 ($15.00/MTok input). The CLI provides instant multi-model cost feedback during prompt development.

### AI Infrastructure Teams

Teams building internal LLM routing layers that select models based on cost, quality, and latency constraints. `ai-cost-compare` provides the cost dimension: given a request, which models fit within the per-request budget? The `budgetFilter()` function returns the set of affordable models, and the routing layer can then apply quality and latency criteria to select from that set.

---

## 4. Core Concepts

### Cost Comparison

A cost comparison takes a single prompt and evaluates its estimated cost on multiple models simultaneously. The result is a ranked list of models ordered by total estimated cost (ascending), with per-model breakdowns of input tokens, output tokens, input cost, output cost, and total cost. The comparison accounts for per-model token count differences: the same text produces different token counts on different tokenizers (OpenAI's BPE tokenizer, Anthropic's tokenizer, Google's SentencePiece tokenizer), so input token counts vary across models even for identical input text.

### Model Identification

Models are identified by a `provider/model` string (e.g., `'openai/gpt-4o'`, `'anthropic/claude-sonnet-4-5'`), matching the convention used by `prompt-price`. When the caller omits a specific model list, the comparison runs against all non-deprecated models in `model-price-registry`, discovered via `listModels({ includeDeprecated: false })`.

### Token Count Variation

Different models use different tokenizers. The same English sentence might produce 10 tokens on OpenAI's `o200k_base` encoding, 11 tokens on Anthropic's tokenizer, and 9 tokens on Google's SentencePiece. These differences are small for short prompts but compound for large inputs. A 100K-character document might be 25,000 tokens on one model and 28,500 on another -- an 14% difference that directly affects cost. `ai-cost-compare` counts tokens per model (delegating to `prompt-price`), so the comparison reflects actual per-tokenizer costs, not a single token count applied uniformly.

### Output Token Estimation

Input tokens can be counted exactly (or approximately) from the prompt text, but output tokens depend on the model's response, which is unknowable before the API call. `ai-cost-compare` inherits `prompt-price`'s output estimation strategies:

1. **Fixed count**: The caller specifies a single expected output token count, applied uniformly across all models. This is the simplest and most common strategy for comparison, since it isolates the input cost difference.
2. **Ratio**: Output tokens are estimated as a fraction of input tokens (e.g., `outputRatio: 0.5` means output is half of input). Since input tokens vary per model, output estimates also vary slightly per model.
3. **Per-model category default**: When no output estimation is provided, `prompt-price` uses default ratios by model category (0.25 for flagship, 0.15 for fast, 0.50 for reasoning, etc.). This means reasoning models like o3 get higher output estimates than fast models like GPT-4o-mini, reflecting that reasoning models generate internal chain-of-thought tokens billed as output.

For fair comparison, using a fixed output token count is recommended. Per-model defaults are informative but make direct comparison less straightforward since the output token count varies.

### Ranking

Models are ranked by `totalCost` ascending (cheapest first). Each `ModelCost` entry in the ranked list includes a `rank` field (1-indexed). Ties are broken by provider name (alphabetical), then model name (alphabetical), ensuring deterministic ordering.

### Savings Calculation

Savings quantify the cost difference between two models:

- **Absolute savings**: `fromModel.totalCost - toModel.totalCost`, in USD per request. Positive means `toModel` is cheaper.
- **Percentage savings**: `(absolute / fromModel.totalCost) * 100`, expressing how much cheaper `toModel` is relative to `fromModel`.
- **Projected savings**: `absolute * monthlyVolume`, estimating total monthly savings at a given request volume.

Savings can be calculated between any two models: the most expensive vs. the cheapest, the current model vs. a candidate replacement, or any arbitrary pair.

### Baseline

A baseline is a reference model against which all other models' costs are compared. By default, the baseline is the most expensive model in the comparison. Callers can specify a baseline explicitly (e.g., their currently deployed model). When a baseline is set, each `ModelCost` entry includes a `savingsVsBaseline` field showing absolute and percentage savings relative to the baseline.

---

## 5. Comparison Pipeline

When `compare()` is called, it executes the following pipeline:

### Step 1: Resolve Models

If the caller provides a list of models (e.g., `['openai/gpt-4o', 'anthropic/claude-sonnet-4-5']`), use that list. If no list is provided, query `model-price-registry`'s `listModels({ includeDeprecated: false })` to get all available non-deprecated models and construct `provider/model` strings. If a `category` filter is provided in options, restrict to models matching that category (e.g., `'fast'` to compare only fast/cheap models).

### Step 2: Estimate Cost Per Model

For each target model, call `prompt-price`'s `estimate()` (or `estimatePrompt()` for plain-text input) with the prompt and the model identifier. This internally:
- Counts input tokens using the model's provider-specific tokenizer (exact for OpenAI with `js-tiktoken`, approximate for others).
- Adds message format overhead per provider.
- Estimates output tokens per the caller's configuration.
- Looks up pricing from `model-price-registry`.
- Calculates input cost, output cost, and total cost.

Failed estimations (unknown model, missing pricing) are captured as errors in the result rather than aborting the entire comparison. The comparison continues with remaining models.

### Step 3: Build ModelCost Entries

Transform each successful `Estimate` from `prompt-price` into a `ModelCost` entry containing:
- `provider`: The provider identifier.
- `model`: The canonical model identifier.
- `displayName`: Human-readable model name (from `model-price-registry`).
- `inputTokens`: Token count for this model's tokenizer.
- `outputTokens`: Estimated output tokens for this model.
- `inputCost`: Input cost in USD.
- `outputCost`: Estimated output cost in USD.
- `totalCost`: Total estimated cost in USD.
- `contextWindow`: The model's maximum context window.
- `category`: The model's category (flagship, balanced, fast, reasoning, etc.).
- `confidence`: Whether the token count is exact or approximate.

### Step 4: Rank by Cost

Sort the `ModelCost` entries by `totalCost` ascending. Assign `rank` (1-indexed) to each entry. Break ties deterministically by provider name, then model name (both alphabetical).

### Step 5: Identify Cheapest and Most Expensive

Set `cheapest` to the first entry (rank 1) and `mostExpensive` to the last entry.

### Step 6: Calculate Savings vs Baseline

If a baseline model is specified in options, find that model's `ModelCost` entry. If no baseline is specified, use the most expensive model. For each entry, compute:
- `savingsVsBaseline.absolute`: `baseline.totalCost - entry.totalCost`
- `savingsVsBaseline.percentage`: `(absolute / baseline.totalCost) * 100`
- `savingsVsBaseline.multiplier`: `baseline.totalCost / entry.totalCost` (how many times cheaper)

### Step 7: Return ComparisonResult

Return the structured `ComparisonResult` containing the ranked list, cheapest/most expensive accessors, baseline reference, errors for any failed models, and metadata (prompt length, output estimation method, timestamp).

---

## 6. Token Counting

### Per-Model Token Counting

`ai-cost-compare` does not implement token counting directly. It delegates entirely to `prompt-price`, which handles per-provider tokenizer selection:

| Provider | Method | Accuracy |
|---|---|---|
| OpenAI (with `js-tiktoken`) | Native BPE tokenization | Exact |
| OpenAI (without `js-tiktoken`) | Heuristic (3.9-4.0 chars/token) | ~5% error |
| Anthropic | Heuristic (3.5 chars/token) | ~10% error |
| Google | Heuristic (4.0 chars/token) | ~10% error |
| Mistral | Heuristic (3.8 chars/token) | ~8% error |
| Cohere | Heuristic (4.0 chars/token) | ~10% error |
| Meta | Heuristic (3.7 chars/token) | ~10% error |

### Why Per-Model Counting Matters

A 10,000-character prompt produces approximately:

| Model | Tokenizer | Approx. Tokens | Input Cost ($2.50/MTok) |
|---|---|---|---|
| GPT-4o | o200k_base | 2,500 | $0.006250 |
| Claude Sonnet 4.5 | Anthropic BPE | 2,857 | $0.008571 |
| Gemini 2.5 Pro | SentencePiece | 2,500 | $0.003125 |

The 14% token count difference between Claude and the others translates directly to a 14% cost difference beyond what pricing alone would suggest. Applying a single token count to all models (as a naive comparison would do) introduces systematic error. `ai-cost-compare` avoids this by running `prompt-price`'s per-provider counting for each model.

### Approximate Mode

For speed-sensitive use cases (comparing 50+ models in a hot path), callers can opt into a uniform approximate token count via `options.uniformTokenCount: true`. This counts tokens once using a generic heuristic (4.0 chars/token) and applies the same count to all models, trading accuracy for speed. The `ComparisonResult` includes a `tokenCountMode` field (`'per-model'` or `'uniform'`) so callers know which mode was used.

---

## 7. Cost Calculation

### Cost Formula

Each model's cost is calculated using the same formula as `prompt-price` and `model-price-registry`:

```
inputCost  = inputTokens  / 1_000_000 * inputPerMTok
outputCost = outputTokens / 1_000_000 * outputPerMTok
totalCost  = inputCost + outputCost
```

All costs are in USD. Results are rounded to 6 decimal places using `Math.round(value * 1_000_000) / 1_000_000` to avoid floating-point artifacts.

### Tiered Pricing

Models with long-context pricing tiers (Gemini 2.5 Pro at 2x above 200K tokens, Claude Sonnet 4.5 at 2x above 200K tokens) apply the tiered rate when input tokens exceed the threshold. The tiered rate applies to the entire input, matching provider billing behavior. This is handled by `prompt-price` internally, so `ai-cost-compare` receives the correct cost regardless of tier.

### Cached Input Tokens

If the caller specifies `cachedInputTokens` in options, models that support prompt caching (OpenAI, Anthropic, Google) get a cost reduction on those tokens. This flows through `prompt-price`'s estimation. Models that do not support caching bill cached tokens at the full input rate.

---

## 8. Output Token Estimation

### Estimation Strategies

Output token estimation is configured once and applied across all models in the comparison:

| Strategy | Option | Behavior |
|---|---|---|
| Fixed count | `estimatedOutputTokens: 500` | All models use 500 output tokens. Simplest for fair comparison. |
| Ratio | `outputRatio: 0.25` | Output = inputTokens * 0.25. Since input tokens vary per model, output varies slightly per model. |
| Max tokens | `maxOutputTokens: 4096` | Uses 4096 as worst-case output for all models. |
| Per-model default | (no option) | `prompt-price` uses category-based defaults: 0.25 for flagship, 0.20 for balanced, 0.15 for fast, 0.50 for reasoning. Output varies significantly per model category. |

### Recommendation for Fair Comparison

For comparing costs across models, using `estimatedOutputTokens` with a fixed count is recommended. This isolates the comparison to input tokenization differences and pricing differences, making the results directly comparable. Per-model category defaults are useful for "what will this actually cost on each model?" but make ranking less straightforward since reasoning models get penalized with higher output estimates.

---

## 9. API Surface

### Installation

```bash
npm install ai-cost-compare prompt-price model-price-registry
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "prompt-price": "^0.1.0",
    "model-price-registry": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "prompt-price": { "optional": false },
    "model-price-registry": { "optional": false }
  }
}
```

`prompt-price` provides per-model cost estimation (token counting + pricing). `model-price-registry` provides model discovery and pricing data. Both are required.

### `compare`

The primary function. Compares the cost of a prompt across multiple models.

```typescript
import { compare } from 'ai-cost-compare';

const result = await compare(
  'Explain quantum computing in simple terms.',
  ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'anthropic/claude-haiku-3-5'],
  { estimatedOutputTokens: 500 },
);

console.log(`Cheapest: ${result.cheapest.provider}/${result.cheapest.model} at $${result.cheapest.totalCost.toFixed(6)}`);
for (const m of result.ranked) {
  console.log(`  #${m.rank} ${m.provider}/${m.model}: $${m.totalCost.toFixed(6)}`);
}
```

**Signatures:**

```typescript
// Compare a plain-text prompt across specified models
function compare(
  prompt: string,
  models: string[],
  options?: CompareOptions,
): Promise<ComparisonResult>;

// Compare a plain-text prompt across ALL known non-deprecated models
function compare(
  prompt: string,
  options?: CompareOptions,
): Promise<ComparisonResult>;

// Compare a structured messages array across specified models
function compareMessages(
  messages: Message[],
  models: string[],
  options?: CompareOptions,
): Promise<ComparisonResult>;

// Compare a structured messages array across ALL known non-deprecated models
function compareMessages(
  messages: Message[],
  options?: CompareOptions,
): Promise<ComparisonResult>;
```

When `models` is omitted, the function queries `model-price-registry` for all non-deprecated models and compares against every one of them. This enables global "cheapest model" discovery.

**Behavior:**

- Each model is estimated independently via `prompt-price`.
- Models that fail estimation (unknown model, missing pricing, unsupported provider) are captured in `result.errors` and excluded from the ranked list. The comparison does not abort on individual model failures.
- Results are sorted by `totalCost` ascending (cheapest first).
- The function is async because `prompt-price`'s `estimate()` is async (WASM initialization for `js-tiktoken`).

### `cheapest`

Convenience function that returns the single cheapest model.

```typescript
import { cheapest } from 'ai-cost-compare';

const best = await cheapest(
  'Summarize this document...',
  ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-haiku-3-5', 'google/gemini-2.5-flash'],
  { estimatedOutputTokens: 1000 },
);

console.log(`Use ${best.provider}/${best.model} at $${best.totalCost.toFixed(6)}`);
```

**Signatures:**

```typescript
function cheapest(
  prompt: string,
  models?: string[],
  options?: CompareOptions,
): Promise<ModelCost>;

function cheapest(
  prompt: string,
  options?: CompareOptions,
): Promise<ModelCost>;
```

Internally calls `compare()` and returns `result.cheapest`. When `models` is omitted, compares against all known models.

### `cheapestAbove`

Returns the cheapest model with a context window at or above the specified minimum.

```typescript
import { cheapestAbove } from 'ai-cost-compare';

// Cheapest model with at least 200K context window
const best = await cheapestAbove(
  longDocument,
  200_000,
  { estimatedOutputTokens: 2000 },
);

console.log(`${best.provider}/${best.model}: ${best.contextWindow} context, $${best.totalCost.toFixed(6)}`);
```

**Signature:**

```typescript
function cheapestAbove(
  prompt: string,
  minContextWindow: number,
  models?: string[],
  options?: CompareOptions,
): Promise<ModelCost | undefined>;
```

Returns `undefined` if no model meets the context window requirement. Internally calls `compare()` and filters/sorts the result.

### `budgetFilter`

Returns all models whose estimated cost falls within a budget.

```typescript
import { budgetFilter } from 'ai-cost-compare';

const affordable = await budgetFilter(
  'Analyze this dataset...',
  0.01,  // max $0.01 per request
  ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-haiku-3-5', 'google/gemini-2.5-flash'],
  { estimatedOutputTokens: 500 },
);

for (const m of affordable) {
  console.log(`${m.provider}/${m.model}: $${m.totalCost.toFixed(6)} (within budget)`);
}
```

**Signature:**

```typescript
function budgetFilter(
  prompt: string,
  maxCost: number,
  models?: string[],
  options?: CompareOptions,
): Promise<ModelCost[]>;
```

Returns models sorted by `totalCost` ascending, filtered to those where `totalCost <= maxCost`. Returns an empty array if no model fits the budget.

### `savings`

Quantifies the cost difference between two specific models.

```typescript
import { savings } from 'ai-cost-compare';

const result = await savings(
  'Translate this paragraph to French.',
  'openai/gpt-4o',        // from (current model)
  'openai/gpt-4o-mini',   // to (candidate replacement)
  {
    estimatedOutputTokens: 200,
    monthlyVolume: 500_000,
  },
);

console.log(`Per-request savings: $${result.absoluteSavings.toFixed(6)}`);
console.log(`Percentage cheaper: ${result.percentageSavings.toFixed(1)}%`);
console.log(`Monthly savings at 500K requests: $${result.projectedMonthlySavings.toFixed(2)}`);
```

**Signature:**

```typescript
function savings(
  prompt: string,
  fromModel: string,
  toModel: string,
  options?: SavingsOptions,
): Promise<SavingsResult>;
```

**Behavior:**

- Estimates cost on both models via `prompt-price`.
- Computes absolute, percentage, and projected savings.
- Positive `absoluteSavings` means `toModel` is cheaper.
- Negative `absoluteSavings` means `toModel` is more expensive (a cost increase, not savings).

### `createComparator`

Factory function for creating a pre-configured comparator instance.

```typescript
import { createComparator } from 'ai-cost-compare';

const comparator = createComparator({
  models: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5', 'anthropic/claude-haiku-3-5'],
  estimatedOutputTokens: 1000,
  baseline: 'openai/gpt-4o',
});

// All calls use the pre-configured models, output tokens, and baseline
const result1 = await comparator.compare('First prompt...');
const result2 = await comparator.compare('Second prompt...');
const cheap = await comparator.cheapest('Third prompt...');
```

**Signature:**

```typescript
function createComparator(config: ComparatorConfig): CostComparator;

interface CostComparator {
  compare(prompt: string, options?: CompareOptions): Promise<ComparisonResult>;
  compareMessages(messages: Message[], options?: CompareOptions): Promise<ComparisonResult>;
  cheapest(prompt: string, options?: CompareOptions): Promise<ModelCost>;
  cheapestAbove(prompt: string, minContextWindow: number, options?: CompareOptions): Promise<ModelCost | undefined>;
  budgetFilter(prompt: string, maxCost: number, options?: CompareOptions): Promise<ModelCost[]>;
  savings(prompt: string, fromModel: string, toModel: string, options?: SavingsOptions): Promise<SavingsResult>;
}
```

Per-call options override the instance defaults.

### Type Definitions

```typescript
// -- Input Types -------------------------------------------------------

/** Chat message in OpenAI/Anthropic format. Re-exported from prompt-price. */
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// -- Compare Options ---------------------------------------------------

interface CompareOptions {
  /** Explicit expected output token count. Applied uniformly or per-model (see outputRatio). */
  estimatedOutputTokens?: number;

  /** Output-to-input ratio (e.g., 0.25). Used when estimatedOutputTokens is not provided. */
  outputRatio?: number;

  /** Max tokens parameter. Used as worst-case output when no other output estimation is given. */
  maxOutputTokens?: number;

  /** Tool definitions included in the request. Token cost counted per model. */
  tools?: ToolDefinition[];

  /** Baseline model for savings calculation. Default: most expensive model in comparison. */
  baseline?: string;

  /** Filter models by category. Only used when models list is omitted. */
  category?: ModelCategory;

  /** Use a single approximate token count for all models instead of per-model counting.
   *  Faster but less accurate. Default: false. */
  uniformTokenCount?: boolean;

  /** Number of cached input tokens. Reduces cost for models supporting prompt caching. */
  cachedInputTokens?: number;

  /** Custom token counter function. Overrides all built-in tokenizers. */
  tokenCounter?: (text: string) => number;

  /** Image detail level for OpenAI models. Default: 'auto'. */
  imageDetail?: 'low' | 'high' | 'auto';

  /** Default image dimensions for images without explicit size info.
   *  Default: { width: 1024, height: 1024 }. */
  defaultImageSize?: { width: number; height: number };

  /** Include deprecated models in comparison. Default: false. */
  includeDeprecated?: boolean;
}

interface SavingsOptions extends CompareOptions {
  /** Monthly request volume for projected savings calculation. Default: undefined (not computed). */
  monthlyVolume?: number;
}

interface ComparatorConfig extends CompareOptions {
  /** Default set of models to compare. */
  models?: string[];
}

type ModelCategory = 'flagship' | 'balanced' | 'fast' | 'reasoning' | 'code' | 'embedding' | 'legacy';

// -- Result Types ------------------------------------------------------

interface ComparisonResult {
  /** Models ranked by totalCost ascending (cheapest first). */
  ranked: ModelCost[];

  /** The cheapest model (rank 1). Same reference as ranked[0]. */
  cheapest: ModelCost;

  /** The most expensive model (last rank). Same reference as ranked[ranked.length - 1]. */
  mostExpensive: ModelCost;

  /** The baseline model used for savings calculations. */
  baseline: ModelCost;

  /** Models that failed estimation (unknown model, missing pricing, etc.). */
  errors: ComparisonError[];

  /** How output tokens were estimated. */
  outputEstimationMethod: 'explicit' | 'ratio' | 'maxTokens' | 'categoryDefault';

  /** Whether per-model or uniform token counting was used. */
  tokenCountMode: 'per-model' | 'uniform';

  /** Number of models successfully compared. */
  modelCount: number;

  /** ISO 8601 timestamp of when the comparison was computed. */
  timestamp: string;
}

interface ModelCost {
  /** Provider identifier (e.g., 'openai'). */
  provider: string;

  /** Canonical model identifier (e.g., 'gpt-4o'). */
  model: string;

  /** Human-readable model name (e.g., 'GPT-4o'). */
  displayName: string;

  /** Number of input tokens for this model's tokenizer. */
  inputTokens: number;

  /** Estimated output tokens for this model. */
  outputTokens: number;

  /** Input cost in USD. */
  inputCost: number;

  /** Estimated output cost in USD. */
  outputCost: number;

  /** Total estimated cost in USD (inputCost + outputCost). */
  totalCost: number;

  /** Maximum context window in tokens. */
  contextWindow: number;

  /** Model category. */
  category: ModelCategory;

  /** Whether the token count is exact or approximate. */
  confidence: 'exact' | 'approximate';

  /** 1-indexed rank by totalCost ascending. */
  rank: number;

  /** Input price per million tokens used in the calculation. */
  inputPerMTok: number;

  /** Output price per million tokens used in the calculation. */
  outputPerMTok: number;

  /** Savings relative to the baseline model. Present when a baseline is set. */
  savingsVsBaseline?: {
    /** Absolute savings in USD per request. Positive = cheaper than baseline. */
    absolute: number;

    /** Percentage savings relative to baseline cost. */
    percentage: number;

    /** How many times cheaper than the baseline (baseline.totalCost / this.totalCost). */
    multiplier: number;
  };
}

interface SavingsResult {
  /** Cost estimate for the "from" model. */
  from: ModelCost;

  /** Cost estimate for the "to" model. */
  to: ModelCost;

  /** Per-request savings in USD. Positive = toModel is cheaper. */
  absoluteSavings: number;

  /** Percentage savings. Positive = toModel is cheaper. */
  percentageSavings: number;

  /** Cost multiplier: fromModel.totalCost / toModel.totalCost. >1 means toModel is cheaper. */
  multiplier: number;

  /** Projected monthly savings at the given volume. Undefined if monthlyVolume not specified. */
  projectedMonthlySavings?: number;

  /** The monthly volume used for projection, if specified. */
  monthlyVolume?: number;
}

interface ComparisonError {
  /** The model string that failed. */
  model: string;

  /** Human-readable error message. */
  message: string;

  /** The underlying error, if available. */
  cause?: Error;
}
```

### Type Exports

```typescript
export type {
  Message,
  CompareOptions,
  SavingsOptions,
  ComparatorConfig,
  ComparisonResult,
  ModelCost,
  SavingsResult,
  ComparisonError,
  ModelCategory,
  CostComparator,
};
```

---

## 10. Model Selection Helpers

### `cheapest`

Returns the single cheapest model from a comparison. This is the most common use case: "what's the cheapest way to run this prompt?"

```typescript
const best = await cheapest('Explain recursion.', { estimatedOutputTokens: 300 });
// Compares against ALL non-deprecated models, returns the cheapest one
```

### `cheapestAbove`

Returns the cheapest model with at least the specified context window size. Useful when the prompt requires a large context window (e.g., processing a 100K-token document requires at least 128K context).

```typescript
const best = await cheapestAbove(longDoc, 500_000, { estimatedOutputTokens: 2000 });
// Returns the cheapest model with >= 500K context window
// e.g., gemini-2.5-flash (1M context) at $0.0004 rather than gpt-4o (128K context, too small)
```

### `budgetFilter`

Returns all models that fit within a per-request budget, ranked by cost. Useful for routing layers that need a set of affordable models to choose from based on quality or latency criteria.

```typescript
const affordable = await budgetFilter('Quick question.', 0.001);
// Returns: [gpt-4.1-nano, gpt-4o-mini, gemini-2.0-flash, ...] — all under $0.001
```

---

## 11. Savings Calculation

### Per-Request Savings

The `savings()` function quantifies the cost impact of switching from one model to another:

```typescript
const result = await savings(
  representativePrompt,
  'anthropic/claude-opus-4',    // from: current model ($15.00/$75.00 per MTok)
  'anthropic/claude-haiku-3-5', // to: candidate ($0.80/$4.00 per MTok)
  { estimatedOutputTokens: 1000, monthlyVolume: 100_000 },
);

// result.absoluteSavings:          $0.068200 per request
// result.percentageSavings:        94.7%
// result.multiplier:               18.9x
// result.projectedMonthlySavings:  $6,820.00 per month
```

### Savings vs Baseline in Comparisons

When `compare()` includes a `baseline` option, every model in the ranked list includes `savingsVsBaseline`:

```typescript
const result = await compare(prompt, models, {
  estimatedOutputTokens: 500,
  baseline: 'openai/gpt-4o', // compare all models against GPT-4o
});

for (const m of result.ranked) {
  const s = m.savingsVsBaseline;
  console.log(
    `${m.provider}/${m.model}: $${m.totalCost.toFixed(6)} ` +
    `(${s.percentage > 0 ? '-' : '+'}${Math.abs(s.percentage).toFixed(1)}% vs GPT-4o)`
  );
}
```

### Negative Savings

When `toModel` is more expensive than `fromModel`, all savings values are negative. This is not an error -- it represents a cost increase. The `SavingsResult` does not force positive values; callers can interpret negative savings as "this migration would cost more."

---

## 12. Configuration

### No Configuration Required

`ai-cost-compare` has no configuration files, environment variables, or initialization steps for programmatic use. Import and call:

```typescript
import { compare } from 'ai-cost-compare';
const result = await compare('Hello', ['openai/gpt-4o', 'openai/gpt-4o-mini']);
// Works immediately. No setup.
```

All behavior is controlled via function parameters and options. Pricing data comes from `model-price-registry` via `prompt-price`, both zero-configuration.

### Pre-Configured Instances

For applications that repeatedly compare the same set of models with the same options, `createComparator()` avoids repeating configuration:

```typescript
const comparator = createComparator({
  models: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4-5'],
  estimatedOutputTokens: 500,
  baseline: 'openai/gpt-4o',
});

// Every call uses the configured defaults
const r1 = await comparator.compare(prompt1);
const r2 = await comparator.compare(prompt2);
```

### Environment Variables (CLI Only)

The CLI supports environment variable configuration. Explicit flags override environment variables.

| Environment Variable | CLI Flag | Description |
|---|---|---|
| `AI_COST_COMPARE_FORMAT` | `--format` | Output format: `table` (default), `json` |
| `AI_COST_COMPARE_MODELS` | `--models` | Comma-separated default model list |
| `AI_COST_COMPARE_OUTPUT_TOKENS` | `--output-tokens` | Default estimated output token count |

---

## 13. CLI Design

### Installation and Invocation

```bash
# Global install
npm install -g ai-cost-compare
ai-cost-compare --file prompt.md --output-tokens 500

# npx (no install)
npx ai-cost-compare --text "Explain quantum computing" --output-tokens 500

# Pipe from stdin
echo "Explain quantum computing" | npx ai-cost-compare --output-tokens 500
```

### CLI Binary Name

`ai-cost-compare`

### Commands

#### `ai-cost-compare [options]`

Compares cost across models (default command, no subcommand needed).

**Input sources (exactly one required):**
- `--file <path>`: Read prompt from a file (plain text or JSON messages array).
- `--text <string>`: Inline prompt text.
- `stdin`: If no `--file` or `--text` is provided, reads from stdin.

**Flags:**

```
Input:
  --file <path>              Read prompt from a file (text or JSON messages array)
  --text <string>            Inline prompt text
  --tools <path>             JSON file containing tool definitions
  --system <string>          System prompt text

Models:
  --models <list>            Comma-separated model list (e.g., openai/gpt-4o,anthropic/claude-haiku-3-5)
                             Default: all non-deprecated models
  --category <cat>           Filter to models of this category (flagship, balanced, fast, reasoning)
  --include-deprecated       Include deprecated models in comparison

Output estimation:
  --output-tokens <n>        Expected output token count (recommended for fair comparison)
  --output-ratio <ratio>     Output-to-input ratio (e.g., 0.25)
  --max-output-tokens <n>    Max tokens parameter (worst-case output estimate)

Comparison:
  --baseline <model>         Baseline model for savings calculation (default: most expensive)
  --budget <usd>             Maximum cost threshold. Models above this are flagged.
  --top <n>                  Show only the top N cheapest models (default: all)

Output format:
  --format <format>          Output format: table (default) | json
  --quiet                    Print only the cheapest model and its cost

Meta:
  --version                  Print version and exit
  --help                     Print help and exit
```

**Human-Readable Table Output Example:**

```
$ ai-cost-compare --text "Explain quantum computing in simple terms." --output-tokens 500 \
    --models openai/gpt-4o,openai/gpt-4o-mini,anthropic/claude-sonnet-4-5,anthropic/claude-haiku-3-5,google/gemini-2.5-flash

  ai-cost-compare v0.1.0

  Prompt: 43 characters | Output: 500 tokens (explicit)

  Rank  Model                          Input Tok   Output Tok   Total Cost    vs Most Expensive
  ────  ─────────────────────────────  ─────────   ──────────   ──────────    ─────────────────
  1     openai/gpt-4o-mini                    17          500   $0.000303     -97.8%
  2     google/gemini-2.5-flash               15          500   $0.000302     -97.8%
  3     anthropic/claude-haiku-3-5            18          500   $0.002014     -85.4%
  4     openai/gpt-4o                         17          500   $0.005043     -63.4%
  5     anthropic/claude-sonnet-4-5           18          500   $0.007554     baseline

  Cheapest: google/gemini-2.5-flash at $0.000302 (25.0x cheaper than baseline)
```

**JSON Output Example:**

```
$ ai-cost-compare --text "Hello" --output-tokens 100 --models openai/gpt-4o,openai/gpt-4o-mini --format json
```

Outputs the `ComparisonResult` object as a JSON string to stdout.

**Budget Check Mode:**

```
$ ai-cost-compare --file prompt.md --output-tokens 1000 --models openai/gpt-4o --budget 0.001

  ai-cost-compare v0.1.0

  ...
  1     openai/gpt-4o                       1258         1000   $0.013145

  BUDGET EXCEEDED: $0.013145 > $0.001000
```

Exit code 1 when the cheapest model exceeds the budget, 0 otherwise.

#### `ai-cost-compare savings <from-model> <to-model> [options]`

Computes savings between two specific models.

```
$ ai-cost-compare savings openai/gpt-4o openai/gpt-4o-mini \
    --text "Summarize this document" --output-tokens 500 --volume 500000

  ai-cost-compare v0.1.0

  From:  openai/gpt-4o        $0.005043 / request
  To:    openai/gpt-4o-mini   $0.000303 / request

  Savings per request:  $0.004740 (93.9%)
  Multiplier:           16.6x cheaper
  Monthly savings:      $2,370.00 (at 500,000 requests/month)
```

**Additional flag:**
- `--volume <n>`: Monthly request volume for projected savings.

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success. Comparison computed. If `--budget` is set, cheapest model is within budget. |
| `1` | Budget exceeded (`--budget` set and all models exceed threshold). Also used for model/provider not found errors. |
| `2` | Configuration error (invalid flags, missing required input, unreadable file). |

---

## 14. Integration with Monorepo Packages

### Integration with `model-price-registry`

`model-price-registry` is the pricing data source. `ai-cost-compare` uses it indirectly via `prompt-price` for per-model pricing lookup, and directly for model discovery (`listModels()`) when no explicit model list is provided:

```typescript
import { listModels } from 'model-price-registry';

// Internal: discover all models when caller omits model list
const allModels = listModels({ includeDeprecated: false });
const modelStrings = allModels.map(m => `${m.provider}/${m.modelId}`);
```

### Integration with `prompt-price`

`prompt-price` is the per-model estimation engine. `ai-cost-compare` calls `estimate()` or `estimatePrompt()` for each model in the comparison, receiving token counts, cost breakdowns, and confidence levels:

```typescript
import { estimate, estimatePrompt } from 'prompt-price';

// Internal: estimate cost for each model
for (const model of models) {
  const est = await estimatePrompt(promptText, model, { estimatedOutputTokens: 500 });
  // Transform est into ModelCost and add to ranked list
}
```

### Integration with `prompt-flags`

`prompt-flags` (this monorepo) provides cost-aware routing for LLM requests. It can use `ai-cost-compare`'s `budgetFilter()` to determine which models fit within a per-request budget before applying quality and latency routing criteria:

```typescript
import { budgetFilter } from 'ai-cost-compare';

// In a routing layer: find affordable models, then pick by quality
const affordable = await budgetFilter(prompt, maxCostPerRequest);
const selected = applyQualityRouting(affordable);
```

### Integration with `ai-keyring`

`ai-keyring` (this monorepo) manages API keys for multiple providers. `ai-cost-compare` does not directly interact with `ai-keyring`, but routing layers that use both packages can first compare costs, then retrieve the correct API key for the selected model's provider.

### Integration with `ai-spend-forecast`

`ai-spend-forecast` (this monorepo) projects future LLM spend. It can use `ai-cost-compare`'s `savings()` output to model the cost impact of model migrations in spend forecasts:

```typescript
import { savings } from 'ai-cost-compare';

const migrationSavings = await savings(
  representativePrompt,
  currentModel,
  candidateModel,
  { estimatedOutputTokens: avgOutputTokens, monthlyVolume: currentVolume },
);
forecast.applyMigration(migrationDate, migrationSavings.projectedMonthlySavings);
```

### Integration with `llm-cost-per-test`

`llm-cost-per-test` (this monorepo) tracks per-test LLM costs. Test infrastructure teams can use `ai-cost-compare` to evaluate whether switching to a cheaper model for test suites would maintain acceptable quality while reducing test infrastructure costs.

---

## 15. Testing Strategy

### Unit Tests

**Compare function tests:**
- Returns a valid `ComparisonResult` for two or more models.
- Ranks models by `totalCost` ascending.
- `cheapest` refers to the same object as `ranked[0]`.
- `mostExpensive` refers to the same object as `ranked[ranked.length - 1]`.
- `rank` values are 1-indexed and sequential.
- Ties are broken deterministically by provider name, then model name.
- With `estimatedOutputTokens: 0`, comparison reflects input cost only.
- With `estimatedOutputTokens` specified, output cost is calculated correctly per model.
- With `outputRatio`, output tokens vary per model (since input tokens vary).
- With `uniformTokenCount: true`, all models have the same `inputTokens` value.
- Without `uniformTokenCount`, different providers have different `inputTokens` values.
- Unknown models appear in `errors`, not in `ranked`.
- All models unknown returns empty `ranked` and all entries in `errors`.
- `baseline` option sets the correct baseline model for savings calculation.
- Default baseline is the most expensive model.
- `savingsVsBaseline` values are mathematically correct.
- `category` filter restricts comparison to models of that category.
- `includeDeprecated: true` includes deprecated models.
- `modelCount` matches `ranked.length`.
- `timestamp` is a valid ISO 8601 string.

**Cheapest function tests:**
- Returns the cheapest model from a comparison.
- Works with all models (no explicit model list).
- Works with a specified model list.

**CheapestAbove function tests:**
- Returns the cheapest model with context window >= minContextWindow.
- Returns `undefined` when no model meets the minimum.
- Correctly selects a model with a larger context window even if it's not the globally cheapest.

**BudgetFilter function tests:**
- Returns models within budget, sorted by cost.
- Returns empty array when no model fits the budget.
- Returns all models when budget is very high.
- Boundary: model at exactly `maxCost` is included.

**Savings function tests:**
- Positive savings when `toModel` is cheaper.
- Negative savings when `toModel` is more expensive.
- Zero savings when both models are the same.
- `percentageSavings` is mathematically correct: `(absolute / from.totalCost) * 100`.
- `multiplier` is `from.totalCost / to.totalCost`.
- `projectedMonthlySavings` is `absoluteSavings * monthlyVolume`.
- `projectedMonthlySavings` is undefined when `monthlyVolume` is not specified.

**CreateComparator tests:**
- Created comparator uses configured models by default.
- Created comparator uses configured options by default.
- Per-call options override instance defaults.
- Multiple comparators are independent.

**Cost calculation tests:**
- Costs match `prompt-price`'s estimates for each model.
- Costs round to 6 decimal places.
- Tiered pricing is applied correctly (delegated to `prompt-price`).
- Cached input tokens reduce cost for supporting models.

### CLI Tests

- `ai-cost-compare --text "Hello" --output-tokens 100 --models openai/gpt-4o,openai/gpt-4o-mini` exits with code 0 and outputs a table.
- `ai-cost-compare --text "Hello" --output-tokens 100 --format json` outputs valid JSON.
- `ai-cost-compare --file prompt.md --output-tokens 500` reads file and compares.
- `ai-cost-compare --text "Hello" --budget 0.001 --models openai/gpt-4o-mini` exits with code 0 (within budget).
- `ai-cost-compare --text "Hello" --budget 0.000001 --models openai/gpt-4o` exits with code 1 (over budget).
- `ai-cost-compare savings openai/gpt-4o openai/gpt-4o-mini --text "Hello" --output-tokens 100` outputs savings.
- `ai-cost-compare savings openai/gpt-4o openai/gpt-4o-mini --text "Hello" --volume 100000` outputs projected monthly savings.
- Stdin input works when piped.
- `--top 3` limits output to 3 models.
- `--quiet` outputs only the cheapest model and cost.
- `--help` and `--version` flags work.
- Invalid model exits with code 2.
- Missing input exits with code 2.

### Edge Cases to Test

- Comparison with a single model (valid, but ranking is trivial).
- Comparison with zero models (returns empty result, not error).
- All models fail estimation (empty `ranked`, all in `errors`).
- Prompt with empty string content.
- Very long prompt (100K+ characters).
- Models with tiered pricing at exactly the tier threshold.
- `baseline` model not in the comparison list (error).
- `estimatedOutputTokens: 0` (input-only comparison).
- Models from the same provider with different token counts (e.g., `gpt-4o` vs `gpt-4.1` using different encodings).
- Savings between the same model (zero savings).

### Test Framework

Tests use Vitest, matching the project's existing configuration. `prompt-price` and `model-price-registry` are mocked in unit tests to isolate `ai-cost-compare`'s comparison, ranking, and savings logic from upstream dependencies. Integration tests use real upstream packages.

---

## 16. Performance

### Comparison Latency

The comparison bottleneck is token counting, not pricing lookup or arithmetic. For each model, `prompt-price` counts tokens (either via `js-tiktoken` or heuristic) and looks up pricing (sub-millisecond). The comparison then performs sorting and savings arithmetic (negligible).

| Scenario | Models | Token Counting | Estimated Latency |
|---|---|---|---|
| 4 models, heuristic counting | 4 | Heuristic for all | < 1ms |
| 4 models, mixed counting | 4 | Tiktoken for OpenAI, heuristic for others | ~2ms (tiktoken overhead) |
| All models (~40), heuristic | 40 | Heuristic for all | < 5ms |
| All models (~40), mixed | 40 | Tiktoken for OpenAI, heuristic for others | ~5ms |

First call incurs a one-time ~50-100ms overhead for `js-tiktoken` WASM initialization (if installed). Subsequent calls reuse cached encoders.

### Uniform Token Count Mode

When `uniformTokenCount: true` is set, tokens are counted once using a generic heuristic and the same count is applied to all models. This reduces comparison latency to a single token count operation regardless of model count, at the cost of ~5-15% accuracy loss in per-model cost estimates.

### Memory Footprint

`ai-cost-compare` itself is stateless -- pure functions with no persistent state. Memory usage is dominated by upstream dependencies: `model-price-registry` data (~100-200 KB) and `js-tiktoken` encoder (~2-4 MB per encoding, if installed). The comparison result object is proportional to the number of models compared (~500 bytes per `ModelCost` entry).

### Parallelism

Per-model estimations are independent and could be run in parallel via `Promise.all()`. For heuristic counting (synchronous), parallelism provides no benefit. For `js-tiktoken` counting (async WASM), all estimations share the same cached encoder, so parallelism is limited by the single-threaded encoder. In practice, the sequential approach is fast enough that parallelism is not needed for v1.

---

## 17. Dependencies

### Runtime Dependencies

None. Zero direct runtime dependencies.

### Peer Dependencies

| Dependency | Type | Purpose | Why Peer |
|---|---|---|---|
| `prompt-price` | peer (required) | Per-model cost estimation: token counting, pricing lookup, cost calculation. | Callers may use `prompt-price` directly for single-model estimates. Sharing the dependency avoids version conflicts and duplicate `model-price-registry` data. |
| `model-price-registry` | peer (required) | Model discovery (`listModels`) and pricing data. | Same data source used by `prompt-price`. Must be a single version to ensure pricing consistency. |

### Optional Dependencies

| Dependency | Type | Purpose |
|---|---|---|
| `js-tiktoken` | optional peer (via `prompt-price`) | Exact token counting for OpenAI models. When absent, heuristic counting is used. Not a direct dependency of `ai-cost-compare` -- flows through `prompt-price`. |

### No Other Runtime Dependencies

CLI argument parsing uses Node.js built-in `util.parseArgs` (Node.js 18+). Table formatting uses a minimal inline implementation (no `cli-table3` or similar). No HTTP client, no utility library.

### Dev Dependencies

| Dependency | Purpose |
|---|---|
| `typescript` | TypeScript compiler. |
| `vitest` | Test runner. |
| `eslint` | Linter. |
| `prompt-price` | Dev dependency for testing (also a peer dependency). |
| `model-price-registry` | Dev dependency for testing (also a peer dependency). |

---

## 18. File Structure

```
ai-cost-compare/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── compare.ts                # compare(), compareMessages() implementation
│   ├── cheapest.ts               # cheapest(), cheapestAbove(), budgetFilter()
│   ├── savings.ts                # savings() implementation
│   ├── comparator.ts             # createComparator() factory, CostComparator class
│   ├── ranking.ts                # Sorting, rank assignment, tie-breaking logic
│   ├── baseline.ts               # Baseline resolution, savingsVsBaseline calculation
│   ├── model-discovery.ts        # Model list resolution: explicit list or listModels() discovery
│   ├── types.ts                  # All TypeScript interfaces and types
│   ├── cli.ts                    # CLI entry point, argument parsing, table formatting
│   └── __tests__/
│       ├── compare.test.ts       # compare() and compareMessages() tests
│       ├── cheapest.test.ts      # cheapest(), cheapestAbove(), budgetFilter() tests
│       ├── savings.test.ts       # savings() tests
│       ├── comparator.test.ts    # createComparator() tests
│       ├── ranking.test.ts       # Sorting and tie-breaking tests
│       ├── baseline.test.ts      # Baseline and savingsVsBaseline tests
│       └── cli.test.ts           # CLI integration tests
├── package.json
├── tsconfig.json
└── SPEC.md
```

### Module Responsibilities

1. **`index.ts`** -- Re-exports all public API functions and types. The single entry point for consumers.

2. **`compare.ts`** -- Implements `compare()` and `compareMessages()`. Orchestrates the comparison pipeline: resolve models, estimate per model, build `ModelCost` entries, delegate to ranking and baseline modules, assemble `ComparisonResult`.

3. **`cheapest.ts`** -- Implements `cheapest()`, `cheapestAbove()`, and `budgetFilter()`. Thin wrappers around `compare()` that extract or filter specific results.

4. **`savings.ts`** -- Implements `savings()`. Estimates cost on two models via `prompt-price`, computes absolute/percentage/projected savings.

5. **`comparator.ts`** -- Implements `createComparator()`. Stores configuration and delegates to the top-level functions with merged options.

6. **`ranking.ts`** -- Sorts `ModelCost` entries by `totalCost`, assigns `rank` values, breaks ties deterministically. Pure logic, no I/O.

7. **`baseline.ts`** -- Resolves the baseline model (explicit or most expensive), computes `savingsVsBaseline` for each entry. Pure logic, no I/O.

8. **`model-discovery.ts`** -- Resolves the model list: if explicit, use it; if omitted, call `listModels()` from `model-price-registry` and construct `provider/model` strings. Handles `category` and `includeDeprecated` filtering.

9. **`types.ts`** -- All TypeScript interfaces, types, and enums. No runtime code.

10. **`cli.ts`** -- CLI entry point. Parses arguments with `util.parseArgs`, reads input from file/stdin/text, calls `compare()` or `savings()`, formats output as table or JSON, and exits with the appropriate code.

---

## 19. Implementation Roadmap

### Phase 1: Core Comparison (v0.1.0)

The minimum viable package, covering the primary use case of comparing costs across a specified list of models.

- `compare(prompt, models, options?)` with `estimatedOutputTokens`.
- `compareMessages(messages, models, options?)`.
- `ComparisonResult` with `ranked`, `cheapest`, `mostExpensive`.
- `ModelCost` with full cost breakdown and `rank`.
- Per-model token counting via `prompt-price`.
- Ranking by `totalCost` ascending.
- Basic CLI: `--text`, `--file`, `--models`, `--output-tokens`, `--format`.
- Unit tests for comparison, ranking, and CLI.
- Type exports.

### Phase 2: Savings and Selection (v0.2.0)

Adds savings calculation, model selection helpers, and baseline comparison.

- `savings(prompt, fromModel, toModel, options?)` with projected monthly savings.
- `cheapest(prompt, models?, options?)` -- compare against all models when models omitted.
- `cheapestAbove(prompt, minContextWindow, models?, options?)`.
- `budgetFilter(prompt, maxCost, models?, options?)`.
- `baseline` option in `CompareOptions`.
- `savingsVsBaseline` in `ModelCost`.
- CLI `savings` subcommand.
- CLI `--budget`, `--top`, `--baseline`, `--quiet` flags.

### Phase 3: Configurability and Polish (v0.3.0)

Adds pre-configured instances, uniform token count mode, and advanced options.

- `createComparator(config)` factory.
- `uniformTokenCount` option for fast approximate comparison.
- `category` filter for model discovery.
- `includeDeprecated` option.
- `cachedInputTokens` option.
- `tools` option for tool definition token cost.
- Environment variable support for CLI.
- CLI `--category`, `--include-deprecated` flags.

### Future Considerations

The following features are explicitly out of scope for the initial versions but may be added later:

- **Quality-weighted comparison**: Integrate with a quality benchmark to provide cost-per-quality-unit metrics (e.g., dollars per MMLU point). This requires a quality data source that does not currently exist in the monorepo.
- **Latency comparison**: Add latency estimates (time-to-first-token, tokens-per-second) alongside cost. This requires latency data that varies by deployment, region, and load -- significantly more complex than static pricing data.
- **Batch pricing**: Model batch API discounts (OpenAI/Anthropic 50% off) for workloads that can tolerate delayed responses.
- **Historical cost comparison**: Compare costs using pricing from different dates (e.g., "how did the cost ranking change after OpenAI's price cut in April 2025?") using `model-price-registry`'s `asOf` option.
- **Workload simulation**: Given a distribution of prompt sizes and a request volume, simulate the total cost across models. More sophisticated than single-prompt comparison, useful for capacity planning.

---

## 20. Examples

### Example: Quick Model Selection for a New Project

```typescript
import { compare } from 'ai-cost-compare';

const samplePrompt = `You are a customer support assistant. The user has a question about their order.
Please provide a helpful, concise response based on the order details provided.

Order #12345:
- Product: Widget Pro
- Status: Shipped
- Tracking: 1Z999AA10123456784
- Estimated delivery: March 22, 2026

User question: Where is my order?`;

const result = await compare(samplePrompt, [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4.1',
  'openai/gpt-4.1-nano',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-3-5',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
], { estimatedOutputTokens: 200 });

console.log('Cost ranking for customer support prompt (200 token response):');
for (const m of result.ranked) {
  console.log(`  #${m.rank} ${m.provider}/${m.model}: $${m.totalCost.toFixed(6)}`);
}
console.log(`\nRecommendation: ${result.cheapest.provider}/${result.cheapest.model}`);
```

### Example: Migration Cost Analysis

```typescript
import { savings } from 'ai-cost-compare';

// Evaluating migration from GPT-4o to GPT-4.1
const result = await savings(
  typicalPrompt,
  'openai/gpt-4o',
  'openai/gpt-4.1',
  {
    estimatedOutputTokens: 1000,
    monthlyVolume: 2_000_000,
  },
);

console.log(`Migration: GPT-4o -> GPT-4.1`);
console.log(`Per-request: $${result.from.totalCost.toFixed(6)} -> $${result.to.totalCost.toFixed(6)}`);
console.log(`Savings: ${result.percentageSavings.toFixed(1)}% ($${result.projectedMonthlySavings?.toFixed(2)}/month)`);
```

### Example: Budget-Constrained Model Selection

```typescript
import { budgetFilter } from 'ai-cost-compare';

// Find all models that cost less than $0.01 per request
const affordable = await budgetFilter(
  longDocument,
  0.01,
  undefined, // compare against ALL models
  { estimatedOutputTokens: 500 },
);

if (affordable.length === 0) {
  console.log('No model fits within $0.01 budget for this prompt');
} else {
  console.log(`${affordable.length} models within budget:`);
  for (const m of affordable) {
    console.log(`  ${m.provider}/${m.model}: $${m.totalCost.toFixed(6)} (${m.contextWindow / 1000}K context)`);
  }
}
```

### Example: Cost-Aware Routing Layer

```typescript
import { createComparator } from 'ai-cost-compare';

const comparator = createComparator({
  models: [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-sonnet-4-5',
    'anthropic/claude-haiku-3-5',
    'google/gemini-2.5-flash',
  ],
  estimatedOutputTokens: 500,
});

async function selectModelForRequest(prompt: string, maxBudget: number): Promise<string> {
  const affordable = await comparator.budgetFilter(prompt, maxBudget);
  if (affordable.length === 0) {
    throw new Error(`No model within $${maxBudget} budget`);
  }
  // Return cheapest model that fits budget
  return `${affordable[0].provider}/${affordable[0].model}`;
}

const model = await selectModelForRequest(userPrompt, 0.005);
// Use `model` for the API call
```

### Example: CI Cost Gate

```typescript
import { compare } from 'ai-cost-compare';
import { readFileSync } from 'node:fs';

// In a CI script: verify the configured model is cost-effective
const systemPrompt = readFileSync('prompts/system.md', 'utf-8');
const configuredModel = 'openai/gpt-4o';
const maxAllowedCost = 0.05;

const result = await compare(systemPrompt, [configuredModel], {
  estimatedOutputTokens: 2000,
});

const cost = result.ranked[0];
if (cost.totalCost > maxAllowedCost) {
  console.error(
    `COST CHECK FAILED: ${configuredModel} costs $${cost.totalCost.toFixed(4)} per request, ` +
    `exceeding the $${maxAllowedCost.toFixed(4)} budget.`
  );
  process.exit(1);
}
console.log(`COST CHECK PASSED: ${configuredModel} at $${cost.totalCost.toFixed(4)} per request.`);
```

### Example: CLI Usage

```bash
# Compare all models for a prompt
$ ai-cost-compare --text "Summarize this article" --output-tokens 500

# Compare specific models with JSON output
$ ai-cost-compare --text "Hello" --output-tokens 100 \
    --models openai/gpt-4o,openai/gpt-4o-mini,anthropic/claude-haiku-3-5 \
    --format json

# Read prompt from file, show top 5 cheapest
$ ai-cost-compare --file system-prompt.md --output-tokens 1000 --top 5

# Compare only fast/cheap models
$ ai-cost-compare --text "Classify this text" --output-tokens 50 --category fast

# Calculate savings for a migration
$ ai-cost-compare savings openai/gpt-4o openai/gpt-4.1 \
    --file prompt.md --output-tokens 1000 --volume 1000000

# Budget check in CI
$ ai-cost-compare --file prompt.md --output-tokens 2000 \
    --models openai/gpt-4o --budget 0.05 --quiet
$ echo $?  # 0 if within budget, 1 if exceeded

# Pipe from stdin
$ cat prompt.md | ai-cost-compare --output-tokens 500 --models openai/gpt-4o,anthropic/claude-sonnet-4-5
```
