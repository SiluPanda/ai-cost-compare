"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = estimateTokens;
exports.estimatePromptTokens = estimatePromptTokens;
/**
 * Estimate the number of tokens in a text string.
 *
 * Uses a simple heuristic of ~4 characters per token, which is a reasonable
 * average across English text for most LLM tokenizers.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count (minimum 0).
 */
function estimateTokens(text) {
    if (!text) {
        return 0;
    }
    return Math.ceil(text.length / 4);
}
/**
 * Estimate the number of tokens for a prompt that may be a string or
 * an array of chat messages.
 *
 * For message arrays, each message's content is counted plus a small
 * per-message overhead (4 tokens for role/formatting metadata).
 *
 * @param prompt - A plain string or array of ChatMessage objects.
 * @returns Estimated token count.
 */
function estimatePromptTokens(prompt) {
    if (typeof prompt === 'string') {
        return estimateTokens(prompt);
    }
    if (!Array.isArray(prompt) || prompt.length === 0) {
        return 0;
    }
    let total = 0;
    for (const message of prompt) {
        // 4 tokens overhead per message for role/formatting
        total += 4;
        total += estimateTokens(message.content ?? '');
    }
    // 2 tokens for assistant reply priming
    total += 2;
    return total;
}
//# sourceMappingURL=tokenizer.js.map