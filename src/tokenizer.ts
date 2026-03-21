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
export function estimateTokens(text: string): number {
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
export function estimatePromptTokens(prompt: string | ChatMessage[]): number {
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
