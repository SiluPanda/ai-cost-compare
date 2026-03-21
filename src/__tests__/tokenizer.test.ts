import { describe, it, expect } from 'vitest';
import { estimateTokens, estimatePromptTokens } from '../tokenizer';

describe('estimateTokens', () => {
  it('returns 0 for an empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns 0 for a null-ish input', () => {
    expect(estimateTokens(null as unknown as string)).toBe(0);
    expect(estimateTokens(undefined as unknown as string)).toBe(0);
  });

  it('estimates tokens for a short string (~4 chars per token)', () => {
    // "hello" is 5 chars => ceil(5/4) = 2
    expect(estimateTokens('hello')).toBe(2);
  });

  it('estimates tokens for a single character', () => {
    expect(estimateTokens('a')).toBe(1);
  });

  it('estimates tokens for exactly 4 characters', () => {
    expect(estimateTokens('test')).toBe(1);
  });

  it('estimates tokens for 8 characters', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
  });

  it('estimates tokens for a longer text', () => {
    const text = 'This is a moderately long sentence for token estimation.';
    const expected = Math.ceil(text.length / 4);
    expect(estimateTokens(text)).toBe(expected);
  });

  it('handles whitespace-only strings', () => {
    expect(estimateTokens('    ')).toBe(1); // 4 chars => 1 token
  });

  it('handles multi-byte characters', () => {
    const text = 'Hello, world! 🌍';
    const expected = Math.ceil(text.length / 4);
    expect(estimateTokens(text)).toBe(expected);
  });

  it('handles newlines and tabs', () => {
    const text = 'line1\nline2\tline3';
    const expected = Math.ceil(text.length / 4);
    expect(estimateTokens(text)).toBe(expected);
  });

  it('scales proportionally with text length', () => {
    const short = 'abcd'; // 4 chars => ceil(4/4) = 1
    const long = 'abcd'.repeat(100); // 400 chars => ceil(400/4) = 100
    expect(estimateTokens(long)).toBe(estimateTokens(short) * 100);
  });
});

describe('estimatePromptTokens', () => {
  it('handles a plain string prompt', () => {
    const prompt = 'Hello, world!';
    expect(estimatePromptTokens(prompt)).toBe(estimateTokens(prompt));
  });

  it('handles an empty string prompt', () => {
    expect(estimatePromptTokens('')).toBe(0);
  });

  it('handles a single-message array', () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    // 4 overhead + ceil(5/4) = 4 + 2 = 6, plus 2 priming = 8
    expect(estimatePromptTokens(messages)).toBe(8);
  });

  it('handles a multi-message array', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
    ];
    // msg1: 4 + ceil(28/4) = 4 + 7 = 11
    // msg2: 4 + ceil(5/4)  = 4 + 2 = 6
    // priming: 2
    // total: 11 + 6 + 2 = 19
    expect(estimatePromptTokens(messages)).toBe(19);
  });

  it('handles an empty message array', () => {
    expect(estimatePromptTokens([])).toBe(0);
  });

  it('handles messages with empty content', () => {
    const messages = [{ role: 'user', content: '' }];
    // 4 overhead + 0 content + 2 priming = 6
    expect(estimatePromptTokens(messages)).toBe(6);
  });

  it('adds per-message overhead for each message', () => {
    const single = [{ role: 'user', content: 'test' }];
    const double = [
      { role: 'user', content: 'test' },
      { role: 'assistant', content: 'test' },
    ];
    // single: 4 + 1 + 2 = 7
    // double: (4+1) + (4+1) + 2 = 12
    // difference should be 5 (one message overhead + its content)
    expect(estimatePromptTokens(double) - estimatePromptTokens(single)).toBe(5);
  });

  it('handles messages with long content', () => {
    const longContent = 'a'.repeat(1000);
    const messages = [{ role: 'user', content: longContent }];
    // 4 overhead + ceil(1000/4) + 2 priming = 4 + 250 + 2 = 256
    expect(estimatePromptTokens(messages)).toBe(256);
  });

  it('handles three messages typical conversation', () => {
    const messages = [
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'What is 2+2?' },
      { role: 'assistant', content: 'The answer is 4.' },
    ];
    const systemTokens = 4 + Math.ceil('Be helpful.'.length / 4);
    const userTokens = 4 + Math.ceil('What is 2+2?'.length / 4);
    const assistantTokens = 4 + Math.ceil('The answer is 4.'.length / 4);
    const expected = systemTokens + userTokens + assistantTokens + 2;
    expect(estimatePromptTokens(messages)).toBe(expected);
  });
});
