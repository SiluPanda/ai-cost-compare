# ai-cost-compare -- Task Breakdown

## Phase 1: Project Setup and Scaffolding

- [ ] **Install dev dependencies** -- Add `typescript`, `vitest`, `eslint`, `prompt-price`, and `model-price-registry` as dev dependencies in `package.json`. | Status: not_done
- [ ] **Configure peer dependencies** -- Add `prompt-price` (^0.1.0) and `model-price-registry` (^1.0.0) as required peer dependencies in `package.json`, with `peerDependenciesMeta` marking both as non-optional. | Status: not_done
- [ ] **Add CLI bin entry** -- Add `"bin": { "ai-cost-compare": "dist/cli.js" }` to `package.json` so the CLI is available after global install or via npx. | Status: not_done
- [ ] **Verify tsconfig.json** -- Confirm tsconfig targets ES2022, outputs to `dist/`, roots at `src/`, and has strict mode enabled. Already exists; verify it matches spec requirements. | Status: not_done
- [ ] **Create source file stubs** -- Create empty/skeleton files for all modules defined in the spec: `src/types.ts`, `src/compare.ts`, `src/cheapest.ts`, `src/savings.ts`, `src/comparator.ts`, `src/ranking.ts`, `src/baseline.ts`, `src/model-discovery.ts`, `src/cli.ts`. | Status: not_done
- [ ] **Create test file stubs** -- Create empty test files: `src/__tests__/compare.test.ts`, `src/__tests__/cheapest.test.ts`, `src/__tests__/savings.test.ts`, `src/__tests__/comparator.test.ts`, `src/__tests__/ranking.test.ts`, `src/__tests__/baseline.test.ts`, `src/__tests__/cli.test.ts`. | Status: not_done
- [ ] **Configure ESLint** -- Add a minimal ESLint configuration suitable for TypeScript. Ensure `npm run lint` works against `src/`. | Status: not_done
- [ ] **Verify build pipeline** -- Run `npm run build` and confirm `tsc` compiles successfully with the empty/stub source files. | Status: not_done
- [ ] **Verify test pipeline** -- Run `npm run test` and confirm Vitest discovers and runs (even if no real tests yet). | Status: not_done

---

## Phase 2: Type Definitions (`src/types.ts`)

- [ ] **Define Message interface** -- Define the `Message` interface with `role` (union of 'system' | 'user' | 'assistant' | 'tool'), `content` (string | ContentPart[]), optional `name`, `tool_calls`, and `tool_call_id`. Re-export from prompt-price if possible. | Status: not_done
- [ ] **Define CompareOptions interface** -- Define `CompareOptions` with all fields: `estimatedOutputTokens`, `outputRatio`, `maxOutputTokens`, `tools`, `baseline`, `category`, `uniformTokenCount`, `cachedInputTokens`, `tokenCounter`, `imageDetail`, `defaultImageSize`, `includeDeprecated`. All optional. | Status: not_done
- [ ] **Define SavingsOptions interface** -- Define `SavingsOptions` extending `CompareOptions` with optional `monthlyVolume: number`. | Status: not_done
- [ ] **Define ComparatorConfig interface** -- Define `ComparatorConfig` extending `CompareOptions` with optional `models: string[]`. | Status: not_done
- [ ] **Define ModelCategory type** -- Define `ModelCategory` as a union type: `'flagship' | 'balanced' | 'fast' | 'reasoning' | 'code' | 'embedding' | 'legacy'`. | Status: not_done
- [ ] **Define ModelCost interface** -- Define `ModelCost` with all fields: `provider`, `model`, `displayName`, `inputTokens`, `outputTokens`, `inputCost`, `outputCost`, `totalCost`, `contextWindow`, `category`, `confidence`, `rank`, `inputPerMTok`, `outputPerMTok`, and optional `savingsVsBaseline` (with `absolute`, `percentage`, `multiplier`). | Status: not_done
- [ ] **Define ComparisonResult interface** -- Define `ComparisonResult` with `ranked`, `cheapest`, `mostExpensive`, `baseline`, `errors`, `outputEstimationMethod`, `tokenCountMode`, `modelCount`, `timestamp`. | Status: not_done
- [ ] **Define SavingsResult interface** -- Define `SavingsResult` with `from`, `to`, `absoluteSavings`, `percentageSavings`, `multiplier`, optional `projectedMonthlySavings`, optional `monthlyVolume`. | Status: not_done
- [ ] **Define ComparisonError interface** -- Define `ComparisonError` with `model`, `message`, optional `cause`. | Status: not_done
- [ ] **Define CostComparator interface** -- Define the `CostComparator` interface with methods: `compare`, `compareMessages`, `cheapest`, `cheapestAbove`, `budgetFilter`, `savings`. | Status: not_done
- [ ] **Define ToolDefinition type** -- Define or re-export `ToolDefinition` type for the `tools` option in `CompareOptions`. | Status: not_done

---

## Phase 3: Model Discovery (`src/model-discovery.ts`)

- [ ] **Implement resolveModels with explicit list** -- When the caller provides a `string[]` of models, return that list directly. Validate format is `provider/model`. | Status: not_done
- [ ] **Implement resolveModels with auto-discovery** -- When no model list is provided, call `listModels()` from `model-price-registry` with `{ includeDeprecated: false }` and construct `provider/model` strings. | Status: not_done
- [ ] **Implement category filter** -- When `options.category` is set and no explicit model list is given, filter discovered models to only those matching the specified category. | Status: not_done
- [ ] **Implement includeDeprecated option** -- When `options.includeDeprecated` is true, pass `{ includeDeprecated: true }` to `listModels()`. Default is false. | Status: not_done
- [ ] **Handle empty model list** -- When the resolved model list is empty (no models found or empty explicit list), return an empty array without error. | Status: not_done

---

## Phase 4: Ranking Logic (`src/ranking.ts`)

- [ ] **Implement sortByTotalCost** -- Sort an array of `ModelCost` entries by `totalCost` ascending (cheapest first). | Status: not_done
- [ ] **Implement deterministic tie-breaking** -- When two models have identical `totalCost`, break ties by `provider` alphabetically, then by `model` alphabetically. | Status: not_done
- [ ] **Implement rank assignment** -- After sorting, assign 1-indexed `rank` values to each entry sequentially. | Status: not_done
- [ ] **Handle single-model ranking** -- When only one model is provided, it gets rank 1. | Status: not_done
- [ ] **Handle empty model list ranking** -- When no models are provided (all failed), return an empty ranked array. | Status: not_done

---

## Phase 5: Baseline and Savings-vs-Baseline Logic (`src/baseline.ts`)

- [ ] **Implement default baseline resolution** -- When no `baseline` option is provided, use the most expensive model (last in ranked list) as the baseline. | Status: not_done
- [ ] **Implement explicit baseline resolution** -- When `baseline` option specifies a model string, find that model in the ranked list and use it as the baseline. | Status: not_done
- [ ] **Handle baseline model not found** -- When an explicit baseline model is not in the ranked list (e.g., it failed estimation or was not included), throw a descriptive error or add to errors. | Status: not_done
- [ ] **Calculate savingsVsBaseline for each model** -- For each `ModelCost` entry, compute `savingsVsBaseline.absolute` = `baseline.totalCost - entry.totalCost`, `savingsVsBaseline.percentage` = `(absolute / baseline.totalCost) * 100`, `savingsVsBaseline.multiplier` = `baseline.totalCost / entry.totalCost`. | Status: not_done
- [ ] **Handle baseline model savingsVsBaseline** -- The baseline model itself should have `absolute: 0`, `percentage: 0`, `multiplier: 1`. | Status: not_done

---

## Phase 6: Core Compare Functions (`src/compare.ts`)

- [ ] **Implement compare(prompt, models, options) overload** -- Accept a plain-text prompt string, an explicit model list, and optional `CompareOptions`. Orchestrate the full comparison pipeline. | Status: not_done
- [ ] **Implement compare(prompt, options) overload** -- Accept a plain-text prompt string and optional `CompareOptions` (no model list). Resolve models via auto-discovery. | Status: not_done
- [ ] **Implement compareMessages(messages, models, options) overload** -- Accept a structured `Message[]` array, an explicit model list, and optional `CompareOptions`. | Status: not_done
- [ ] **Implement compareMessages(messages, options) overload** -- Accept a structured `Message[]` array and optional `CompareOptions` (no model list). | Status: not_done
- [ ] **Call prompt-price for each model** -- For each resolved model, call `prompt-price`'s `estimatePrompt()` (for plain text) or `estimate()` (for messages) with the prompt and model identifier, passing through output estimation options. | Status: not_done
- [ ] **Handle per-model estimation failures** -- When `prompt-price` throws for a specific model (unknown model, missing pricing), catch the error, create a `ComparisonError` entry, and continue with remaining models. Do not abort the entire comparison. | Status: not_done
- [ ] **Build ModelCost entries from estimates** -- Transform each successful `prompt-price` `Estimate` into a `ModelCost` object with all required fields: `provider`, `model`, `displayName`, `inputTokens`, `outputTokens`, `inputCost`, `outputCost`, `totalCost`, `contextWindow`, `category`, `confidence`, `inputPerMTok`, `outputPerMTok`. | Status: not_done
- [ ] **Delegate to ranking module** -- Pass the `ModelCost` array to the ranking module for sorting and rank assignment. | Status: not_done
- [ ] **Delegate to baseline module** -- Pass the ranked array and baseline option to the baseline module for baseline resolution and `savingsVsBaseline` calculation. | Status: not_done
- [ ] **Assemble ComparisonResult** -- Build the final `ComparisonResult` with `ranked`, `cheapest` (ranked[0]), `mostExpensive` (ranked[ranked.length-1]), `baseline`, `errors`, `outputEstimationMethod`, `tokenCountMode`, `modelCount`, and `timestamp` (ISO 8601). | Status: not_done
- [ ] **Determine outputEstimationMethod** -- Set to `'explicit'` if `estimatedOutputTokens` is provided, `'ratio'` if `outputRatio` is provided, `'maxTokens'` if `maxOutputTokens` is provided, `'categoryDefault'` if none of the above. | Status: not_done
- [ ] **Determine tokenCountMode** -- Set to `'uniform'` if `uniformTokenCount: true`, otherwise `'per-model'`. | Status: not_done
- [ ] **Implement uniform token count mode** -- When `uniformTokenCount: true`, count tokens once using a generic heuristic (4.0 chars/token) and apply the same count to all models instead of per-model counting. | Status: not_done
- [ ] **Pass through cachedInputTokens** -- Forward `cachedInputTokens` option to `prompt-price` for models supporting prompt caching. | Status: not_done
- [ ] **Pass through tools option** -- Forward `tools` option to `prompt-price` for including tool definition token cost. | Status: not_done
- [ ] **Round costs to 6 decimal places** -- Ensure all USD cost values are rounded using `Math.round(value * 1_000_000) / 1_000_000`. | Status: not_done
- [ ] **Handle all models failing estimation** -- When every model fails, return a `ComparisonResult` with empty `ranked`, undefined `cheapest`/`mostExpensive`/`baseline`, all errors in `errors`. | Status: not_done
- [ ] **Handle empty prompt** -- When prompt is an empty string, still perform the comparison (token count will be 0 or minimal). | Status: not_done

---

## Phase 7: Model Selection Helpers (`src/cheapest.ts`)

- [ ] **Implement cheapest(prompt, models, options)** -- Call `compare()` internally and return `result.cheapest` (the rank-1 model). | Status: not_done
- [ ] **Implement cheapest(prompt, options) overload** -- When models list is omitted, compare against all known models and return the cheapest. | Status: not_done
- [ ] **Implement cheapestAbove(prompt, minContextWindow, models, options)** -- Call `compare()` internally, filter results to models with `contextWindow >= minContextWindow`, and return the cheapest among filtered results. | Status: not_done
- [ ] **cheapestAbove returns undefined** -- When no model meets the minimum context window requirement, return `undefined`. | Status: not_done
- [ ] **Implement budgetFilter(prompt, maxCost, models, options)** -- Call `compare()` internally, filter results to models with `totalCost <= maxCost`, return sorted by cost ascending. | Status: not_done
- [ ] **budgetFilter returns empty array** -- When no model fits within the budget, return an empty array. | Status: not_done
- [ ] **budgetFilter boundary: model at exactly maxCost** -- A model whose `totalCost` equals `maxCost` exactly is included in the result. | Status: not_done

---

## Phase 8: Savings Calculation (`src/savings.ts`)

- [ ] **Implement savings(prompt, fromModel, toModel, options)** -- Estimate cost on both models via `prompt-price`, compute and return a `SavingsResult`. | Status: not_done
- [ ] **Calculate absoluteSavings** -- Compute `from.totalCost - to.totalCost`. Positive means `toModel` is cheaper. | Status: not_done
- [ ] **Calculate percentageSavings** -- Compute `(absoluteSavings / from.totalCost) * 100`. | Status: not_done
- [ ] **Calculate multiplier** -- Compute `from.totalCost / to.totalCost`. Greater than 1 means `toModel` is cheaper. | Status: not_done
- [ ] **Calculate projectedMonthlySavings** -- When `monthlyVolume` is provided, compute `absoluteSavings * monthlyVolume`. | Status: not_done
- [ ] **projectedMonthlySavings undefined when no volume** -- When `monthlyVolume` is not specified, `projectedMonthlySavings` and `monthlyVolume` fields are `undefined`. | Status: not_done
- [ ] **Handle negative savings** -- When `toModel` is more expensive, all savings values are negative. Do not force positive values. | Status: not_done
- [ ] **Handle zero savings** -- When both models have the same cost (or are the same model), `absoluteSavings` is 0, `percentageSavings` is 0, `multiplier` is 1. | Status: not_done
- [ ] **Handle estimation failure** -- When either model fails estimation, throw a descriptive error. | Status: not_done

---

## Phase 9: Comparator Factory (`src/comparator.ts`)

- [ ] **Implement createComparator(config)** -- Accept a `ComparatorConfig` and return a `CostComparator` object that stores the configuration. | Status: not_done
- [ ] **CostComparator.compare** -- Delegates to the top-level `compare()` function, merging stored config with per-call options. Per-call options override instance defaults. | Status: not_done
- [ ] **CostComparator.compareMessages** -- Delegates to the top-level `compareMessages()` function with merged config. | Status: not_done
- [ ] **CostComparator.cheapest** -- Delegates to the top-level `cheapest()` function with merged config and stored models. | Status: not_done
- [ ] **CostComparator.cheapestAbove** -- Delegates to the top-level `cheapestAbove()` function with merged config and stored models. | Status: not_done
- [ ] **CostComparator.budgetFilter** -- Delegates to the top-level `budgetFilter()` function with merged config and stored models. | Status: not_done
- [ ] **CostComparator.savings** -- Delegates to the top-level `savings()` function with merged config. | Status: not_done
- [ ] **Options merging logic** -- Implement merging: per-call `CompareOptions` override `ComparatorConfig` defaults. If a per-call option is undefined, fall back to the stored default. | Status: not_done
- [ ] **Multiple comparators independence** -- Ensure two separate comparator instances do not share or interfere with each other's configuration. | Status: not_done

---

## Phase 10: Public API Exports (`src/index.ts`)

- [ ] **Export all public functions** -- Re-export `compare`, `compareMessages`, `cheapest`, `cheapestAbove`, `budgetFilter`, `savings`, `createComparator` from their respective modules. | Status: not_done
- [ ] **Export all public types** -- Re-export `Message`, `CompareOptions`, `SavingsOptions`, `ComparatorConfig`, `ComparisonResult`, `ModelCost`, `SavingsResult`, `ComparisonError`, `ModelCategory`, `CostComparator` from `types.ts`. | Status: not_done

---

## Phase 11: CLI Implementation (`src/cli.ts`)

- [ ] **Add shebang line** -- Add `#!/usr/bin/env node` at the top of `cli.ts` so it can be executed directly. | Status: not_done
- [ ] **Parse arguments with util.parseArgs** -- Use Node.js built-in `util.parseArgs` (Node 18+) to parse all CLI flags. No external argument parsing library. | Status: not_done
- [ ] **Implement --text flag** -- Accept inline prompt text via `--text <string>`. | Status: not_done
- [ ] **Implement --file flag** -- Accept a file path via `--file <path>`, read the file contents as the prompt. Support both plain text and JSON messages arrays. | Status: not_done
- [ ] **Implement stdin input** -- When neither `--file` nor `--text` is provided, read prompt from stdin. | Status: not_done
- [ ] **Implement --models flag** -- Accept a comma-separated list of model identifiers via `--models`. | Status: not_done
- [ ] **Implement --output-tokens flag** -- Accept expected output token count via `--output-tokens <n>`. | Status: not_done
- [ ] **Implement --output-ratio flag** -- Accept output-to-input ratio via `--output-ratio <ratio>`. | Status: not_done
- [ ] **Implement --max-output-tokens flag** -- Accept max tokens parameter via `--max-output-tokens <n>`. | Status: not_done
- [ ] **Implement --baseline flag** -- Accept a baseline model for savings calculation via `--baseline <model>`. | Status: not_done
- [ ] **Implement --budget flag** -- Accept a maximum cost threshold via `--budget <usd>`. Models above this are flagged. Exit code 1 if all models exceed budget. | Status: not_done
- [ ] **Implement --top flag** -- Accept a number via `--top <n>` to limit output to the top N cheapest models. | Status: not_done
- [ ] **Implement --format flag** -- Accept `table` (default) or `json` via `--format <format>`. | Status: not_done
- [ ] **Implement --quiet flag** -- When set, print only the cheapest model and its cost. | Status: not_done
- [ ] **Implement --category flag** -- Accept a model category filter via `--category <cat>`. | Status: not_done
- [ ] **Implement --include-deprecated flag** -- Boolean flag to include deprecated models in comparison. | Status: not_done
- [ ] **Implement --system flag** -- Accept system prompt text via `--system <string>`. | Status: not_done
- [ ] **Implement --tools flag** -- Accept a JSON file path containing tool definitions via `--tools <path>`. | Status: not_done
- [ ] **Implement --version flag** -- Print the package version from `package.json` and exit. | Status: not_done
- [ ] **Implement --help flag** -- Print usage help text listing all flags and exit. | Status: not_done
- [ ] **Implement table output formatter** -- Format `ComparisonResult` as a human-readable table with columns: Rank, Model, Input Tok, Output Tok, Total Cost, vs Most Expensive. Use inline implementation (no external table library). Match the format shown in the spec. | Status: not_done
- [ ] **Implement JSON output formatter** -- When `--format json`, serialize the `ComparisonResult` as a JSON string to stdout. | Status: not_done
- [ ] **Implement header line** -- Print `ai-cost-compare v<version>` header and prompt summary (character count, output estimation method) before the table. | Status: not_done
- [ ] **Implement cheapest summary line** -- After the table, print a summary line: `Cheapest: <model> at $<cost> (<multiplier>x cheaper than baseline)`. | Status: not_done
- [ ] **Implement budget exceeded message** -- When `--budget` is set and the cheapest model exceeds the budget, print `BUDGET EXCEEDED: $<cost> > $<budget>`. | Status: not_done
- [ ] **Implement savings subcommand** -- Support `ai-cost-compare savings <from-model> <to-model> [options]` for computing savings between two specific models. | Status: not_done
- [ ] **Implement --volume flag for savings subcommand** -- Accept monthly request volume via `--volume <n>` for projected savings calculation. | Status: not_done
- [ ] **Implement savings output format** -- Print formatted savings output: from/to costs, per-request savings (absolute and percentage), multiplier, and monthly savings (if volume provided). Match the format in the spec. | Status: not_done
- [ ] **Implement exit code 0** -- Exit with code 0 on success. If `--budget` is set, exit 0 only when the cheapest model is within budget. | Status: not_done
- [ ] **Implement exit code 1** -- Exit with code 1 when budget is exceeded (all models exceed `--budget`). Also for model/provider not found errors. | Status: not_done
- [ ] **Implement exit code 2** -- Exit with code 2 for configuration errors: invalid flags, missing required input, unreadable file. | Status: not_done
- [ ] **Implement environment variable support** -- Read `AI_COST_COMPARE_FORMAT`, `AI_COST_COMPARE_MODELS`, `AI_COST_COMPARE_OUTPUT_TOKENS` from environment. Explicit CLI flags override environment variables. | Status: not_done
- [ ] **Handle JSON messages file input** -- When `--file` points to a JSON file containing a messages array, parse it and use `compareMessages()` instead of `compare()`. | Status: not_done
- [ ] **Handle missing input error** -- When no input source is provided (no `--file`, `--text`, and no stdin), print an error and exit with code 2. | Status: not_done
- [ ] **Handle unreadable file error** -- When `--file` path does not exist or is unreadable, print an error and exit with code 2. | Status: not_done

---

## Phase 12: Unit Tests -- Ranking (`src/__tests__/ranking.test.ts`)

- [ ] **Test: sorts models by totalCost ascending** -- Given unsorted ModelCost entries, verify they are sorted cheapest first. | Status: not_done
- [ ] **Test: assigns 1-indexed ranks** -- Verify rank values are 1, 2, 3, ... after sorting. | Status: not_done
- [ ] **Test: breaks ties by provider name** -- When two models have the same totalCost, the one with alphabetically earlier provider gets the lower rank. | Status: not_done
- [ ] **Test: breaks ties by model name within same provider** -- When two models from the same provider have the same totalCost, the one with alphabetically earlier model name gets the lower rank. | Status: not_done
- [ ] **Test: single model gets rank 1** -- A single model in the array gets rank 1. | Status: not_done
- [ ] **Test: empty array returns empty** -- An empty input array returns an empty ranked array. | Status: not_done

---

## Phase 13: Unit Tests -- Baseline (`src/__tests__/baseline.test.ts`)

- [ ] **Test: default baseline is most expensive model** -- When no baseline option is set, the most expensive model is used as baseline. | Status: not_done
- [ ] **Test: explicit baseline is used when specified** -- When baseline option names a model in the ranked list, that model is used. | Status: not_done
- [ ] **Test: savingsVsBaseline.absolute is correct** -- Verify `baseline.totalCost - entry.totalCost` for each entry. | Status: not_done
- [ ] **Test: savingsVsBaseline.percentage is correct** -- Verify `(absolute / baseline.totalCost) * 100`. | Status: not_done
- [ ] **Test: savingsVsBaseline.multiplier is correct** -- Verify `baseline.totalCost / entry.totalCost`. | Status: not_done
- [ ] **Test: baseline model has zero savings** -- The baseline model itself has absolute 0, percentage 0, multiplier 1. | Status: not_done
- [ ] **Test: error when explicit baseline not found** -- When the specified baseline model is not in the ranked list, an error is thrown or reported. | Status: not_done

---

## Phase 14: Unit Tests -- Compare (`src/__tests__/compare.test.ts`)

- [ ] **Test: returns valid ComparisonResult for two models** -- Mock prompt-price, call compare with two models, verify the result structure. | Status: not_done
- [ ] **Test: ranked is sorted by totalCost ascending** -- Verify the ranked array is cheapest first. | Status: not_done
- [ ] **Test: cheapest is same reference as ranked[0]** -- Verify object identity. | Status: not_done
- [ ] **Test: mostExpensive is same reference as ranked[ranked.length-1]** -- Verify object identity. | Status: not_done
- [ ] **Test: rank values are 1-indexed and sequential** -- Verify ranks are 1, 2, 3, etc. | Status: not_done
- [ ] **Test: estimatedOutputTokens applies uniformly** -- With `estimatedOutputTokens: 500`, all models use 500 output tokens. | Status: not_done
- [ ] **Test: estimatedOutputTokens 0 means input cost only** -- With `estimatedOutputTokens: 0`, output cost is 0 for all models. | Status: not_done
- [ ] **Test: outputRatio produces variable output per model** -- With `outputRatio`, output tokens differ per model since input tokens differ. | Status: not_done
- [ ] **Test: uniformTokenCount true gives same inputTokens** -- With `uniformTokenCount: true`, all models have the same inputTokens. | Status: not_done
- [ ] **Test: per-model counting gives different inputTokens** -- Without `uniformTokenCount`, different providers have different inputTokens. | Status: not_done
- [ ] **Test: unknown model goes to errors, not ranked** -- A model that fails estimation appears in `errors` and not in `ranked`. | Status: not_done
- [ ] **Test: all models unknown gives empty ranked** -- When every model fails, `ranked` is empty and all are in `errors`. | Status: not_done
- [ ] **Test: baseline option sets correct baseline** -- With explicit `baseline`, verify the baseline model in the result. | Status: not_done
- [ ] **Test: default baseline is most expensive** -- Without explicit baseline, verify the most expensive model is baseline. | Status: not_done
- [ ] **Test: savingsVsBaseline values are correct** -- Verify mathematical correctness for each entry. | Status: not_done
- [ ] **Test: category filter restricts models** -- With `category: 'fast'`, only fast models appear. | Status: not_done
- [ ] **Test: includeDeprecated true includes deprecated** -- Verify deprecated models are included when flag is set. | Status: not_done
- [ ] **Test: modelCount matches ranked.length** -- Verify `modelCount` equals the number of successfully compared models. | Status: not_done
- [ ] **Test: timestamp is valid ISO 8601** -- Verify `timestamp` parses as a valid date. | Status: not_done
- [ ] **Test: outputEstimationMethod is 'explicit'** -- When `estimatedOutputTokens` is set, method is `'explicit'`. | Status: not_done
- [ ] **Test: outputEstimationMethod is 'ratio'** -- When `outputRatio` is set, method is `'ratio'`. | Status: not_done
- [ ] **Test: outputEstimationMethod is 'maxTokens'** -- When `maxOutputTokens` is set, method is `'maxTokens'`. | Status: not_done
- [ ] **Test: outputEstimationMethod is 'categoryDefault'** -- When no output option is set, method is `'categoryDefault'`. | Status: not_done
- [ ] **Test: tokenCountMode is 'per-model'** -- Default mode without `uniformTokenCount`. | Status: not_done
- [ ] **Test: tokenCountMode is 'uniform'** -- When `uniformTokenCount: true`. | Status: not_done
- [ ] **Test: compareMessages works with Message array** -- Verify `compareMessages` accepts and processes a `Message[]` input correctly. | Status: not_done
- [ ] **Test: costs round to 6 decimal places** -- Verify that cost values are rounded using `Math.round(value * 1_000_000) / 1_000_000`. | Status: not_done

---

## Phase 15: Unit Tests -- Cheapest/BudgetFilter (`src/__tests__/cheapest.test.ts`)

- [ ] **Test: cheapest returns the rank-1 model** -- Verify the cheapest function returns the same model as ranked[0]. | Status: not_done
- [ ] **Test: cheapest works with all models (no explicit list)** -- When models omitted, all known models are compared. | Status: not_done
- [ ] **Test: cheapest works with explicit model list** -- When models are specified, only those are compared. | Status: not_done
- [ ] **Test: cheapestAbove returns cheapest model above minContextWindow** -- A model with a large enough context window is returned even if it is not the globally cheapest. | Status: not_done
- [ ] **Test: cheapestAbove returns undefined when no model qualifies** -- When no model has a context window >= minContextWindow. | Status: not_done
- [ ] **Test: budgetFilter returns models within budget sorted by cost** -- Models with totalCost <= maxCost are returned, sorted ascending. | Status: not_done
- [ ] **Test: budgetFilter returns empty when no model fits** -- When all models exceed the budget, return an empty array. | Status: not_done
- [ ] **Test: budgetFilter returns all when budget is very high** -- When the budget exceeds all model costs, all models are returned. | Status: not_done
- [ ] **Test: budgetFilter includes model at exactly maxCost** -- A model with `totalCost === maxCost` is included. | Status: not_done

---

## Phase 16: Unit Tests -- Savings (`src/__tests__/savings.test.ts`)

- [ ] **Test: positive savings when toModel is cheaper** -- Verify absoluteSavings > 0 and percentageSavings > 0. | Status: not_done
- [ ] **Test: negative savings when toModel is more expensive** -- Verify absoluteSavings < 0 and percentageSavings < 0. | Status: not_done
- [ ] **Test: zero savings when both models are the same** -- Verify absoluteSavings = 0, percentageSavings = 0, multiplier = 1. | Status: not_done
- [ ] **Test: percentageSavings formula** -- Verify `(absoluteSavings / from.totalCost) * 100`. | Status: not_done
- [ ] **Test: multiplier formula** -- Verify `from.totalCost / to.totalCost`. | Status: not_done
- [ ] **Test: projectedMonthlySavings with monthlyVolume** -- Verify `absoluteSavings * monthlyVolume`. | Status: not_done
- [ ] **Test: projectedMonthlySavings undefined without monthlyVolume** -- When `monthlyVolume` is not set, field is undefined. | Status: not_done
- [ ] **Test: from and to ModelCost objects are correct** -- Verify the `from` and `to` fields contain correct model cost data. | Status: not_done

---

## Phase 17: Unit Tests -- Comparator (`src/__tests__/comparator.test.ts`)

- [ ] **Test: comparator uses configured models by default** -- When compare() is called without specifying models, the configured defaults are used. | Status: not_done
- [ ] **Test: comparator uses configured options by default** -- Configured `estimatedOutputTokens`, `baseline`, etc. are applied to calls. | Status: not_done
- [ ] **Test: per-call options override instance defaults** -- When per-call options specify different values, they take precedence. | Status: not_done
- [ ] **Test: multiple comparators are independent** -- Two comparators with different configs do not interfere with each other. | Status: not_done
- [ ] **Test: comparator.cheapest delegates correctly** -- Verify it calls cheapest with the configured models. | Status: not_done
- [ ] **Test: comparator.cheapestAbove delegates correctly** -- Verify it calls cheapestAbove with the configured models. | Status: not_done
- [ ] **Test: comparator.budgetFilter delegates correctly** -- Verify it calls budgetFilter with the configured models. | Status: not_done
- [ ] **Test: comparator.savings delegates correctly** -- Verify it calls savings with the configured options. | Status: not_done
- [ ] **Test: comparator.compareMessages delegates correctly** -- Verify it calls compareMessages with the configured models. | Status: not_done

---

## Phase 18: Unit Tests -- CLI (`src/__tests__/cli.test.ts`)

- [ ] **Test: --text with --output-tokens and --models exits 0 with table** -- Basic invocation produces table output and exits 0. | Status: not_done
- [ ] **Test: --format json outputs valid JSON** -- Verify stdout is parseable JSON matching ComparisonResult structure. | Status: not_done
- [ ] **Test: --file reads prompt from file** -- Verify file contents are used as prompt. | Status: not_done
- [ ] **Test: stdin input works when piped** -- Verify stdin is read when no --file or --text is given. | Status: not_done
- [ ] **Test: --budget within budget exits 0** -- When cheapest model is under budget, exit code is 0. | Status: not_done
- [ ] **Test: --budget exceeded exits 1** -- When all models exceed budget, exit code is 1. | Status: not_done
- [ ] **Test: savings subcommand outputs savings** -- Verify `savings <from> <to>` produces formatted savings output. | Status: not_done
- [ ] **Test: savings --volume shows projected monthly savings** -- Verify monthly projection is displayed. | Status: not_done
- [ ] **Test: --top limits output to N models** -- Verify only N models appear in the table. | Status: not_done
- [ ] **Test: --quiet outputs only cheapest model** -- Verify minimal output. | Status: not_done
- [ ] **Test: --help prints usage** -- Verify help text is printed and exit 0. | Status: not_done
- [ ] **Test: --version prints version** -- Verify version string is printed and exit 0. | Status: not_done
- [ ] **Test: invalid model exits 2** -- Verify configuration error exit code. | Status: not_done
- [ ] **Test: missing input exits 2** -- Verify exit code when no input source provided. | Status: not_done
- [ ] **Test: unreadable file exits 2** -- Verify exit code when --file path is invalid. | Status: not_done

---

## Phase 19: Edge Case Tests

- [ ] **Test: comparison with single model** -- Valid; ranking is trivial, rank 1. | Status: not_done
- [ ] **Test: comparison with zero models** -- Returns empty result, not error. | Status: not_done
- [ ] **Test: all models fail estimation** -- Empty `ranked`, all in `errors`. | Status: not_done
- [ ] **Test: prompt with empty string** -- Still performs comparison (token count near 0). | Status: not_done
- [ ] **Test: very long prompt (100K+ characters)** -- Comparison completes without error for large inputs. | Status: not_done
- [ ] **Test: baseline model not in comparison list** -- Returns an error when explicit baseline is not found. | Status: not_done
- [ ] **Test: savings between the same model** -- Zero savings, multiplier 1. | Status: not_done
- [ ] **Test: models with tiered pricing at threshold** -- Verify tiered pricing is applied correctly (delegated to prompt-price). | Status: not_done
- [ ] **Test: cached input tokens reduce cost** -- Verify cachedInputTokens option reduces cost for supporting models. | Status: not_done

---

## Phase 20: Integration Tests

- [ ] **Integration test: compare with real prompt-price and model-price-registry** -- Run `compare()` against real upstream packages (not mocked) with a known prompt and verify the result structure and that costs are plausible. | Status: not_done
- [ ] **Integration test: savings with real upstream packages** -- Run `savings()` against real packages and verify the result structure. | Status: not_done
- [ ] **Integration test: cheapest with all models** -- Run `cheapest()` without an explicit model list and verify a result is returned from the full model catalog. | Status: not_done
- [ ] **Integration test: CLI end-to-end** -- Execute the CLI binary as a child process with `--text` and `--output-tokens` and verify stdout output and exit code. | Status: not_done

---

## Phase 21: Documentation

- [ ] **Write README.md** -- Create a comprehensive README covering: overview, installation (including peer deps), API reference for all public functions (`compare`, `compareMessages`, `cheapest`, `cheapestAbove`, `budgetFilter`, `savings`, `createComparator`), type definitions, CLI usage with all flags and examples, environment variables, exit codes, and examples for common use cases. | Status: not_done
- [ ] **Add JSDoc comments to all public functions** -- Add JSDoc with `@param`, `@returns`, and `@example` tags to `compare`, `compareMessages`, `cheapest`, `cheapestAbove`, `budgetFilter`, `savings`, `createComparator`. | Status: not_done
- [ ] **Add JSDoc comments to all public interfaces** -- Add JSDoc descriptions to every field in `CompareOptions`, `SavingsOptions`, `ComparatorConfig`, `ComparisonResult`, `ModelCost`, `SavingsResult`, `ComparisonError`. | Status: not_done
- [ ] **Add inline code comments** -- Add comments explaining non-obvious logic: tie-breaking algorithm, uniform token count mode, output estimation method determination, cost rounding. | Status: not_done

---

## Phase 22: Build Verification and Publishing Prep

- [ ] **Bump version in package.json** -- Bump version appropriately (0.1.0 for initial release). Verify version matches the implementation roadmap phase. | Status: not_done
- [ ] **Run npm run build** -- Verify `tsc` compiles successfully with no errors. All source files produce correct `.js`, `.d.ts`, and `.js.map` outputs in `dist/`. | Status: not_done
- [ ] **Run npm run lint** -- Verify ESLint passes with no errors or warnings. | Status: not_done
- [ ] **Run npm run test** -- Verify all unit and integration tests pass. | Status: not_done
- [ ] **Verify package.json files field** -- Confirm `"files": ["dist"]` so only compiled output is published. | Status: not_done
- [ ] **Verify CLI binary is executable** -- After build, confirm `dist/cli.js` has the shebang line and can be executed via `node dist/cli.js --help`. | Status: not_done
- [ ] **Verify type exports** -- Confirm that importing the package in a TypeScript project resolves all exported types correctly via `dist/index.d.ts`. | Status: not_done
- [ ] **Dry run npm publish** -- Run `npm publish --dry-run` to verify the package contents and ensure no unexpected files are included. | Status: not_done
