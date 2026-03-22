/**
 * Message format for structured chat inputs.
 */
export interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Estimate the number of tokens in a text string.
 *
 * Uses a simple heuristic of ~4 characters per token, which is a reasonable
 * average across English text for most LLM tokenizers.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count (minimum 0).
 */
export declare function estimateTokens(text: string): number;
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
export declare function estimatePromptTokens(prompt: string | ChatMessage[]): number;
//# sourceMappingURL=tokenizer.d.ts.map