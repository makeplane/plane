/**
 * Sentence-boundary chunking (~500 tokens max, 50-token overlap, ~4 chars per
 * token heuristic). Ported unchanged from the crm-new reference — pure JS,
 * runtime-agnostic.
 */

const MAX_CHUNK_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 50;

export type TextChunk = { index: number; text: string; tokens: number };

export const estimateTokenCount = (text: string): number => Math.ceil(text.length / 4);

const getOverlapText = (text: string, targetTokens: number): string => {
  const words = text.split(" ");
  const targetChars = targetTokens * 4;
  let result = "";
  for (let i = words.length - 1; i >= 0; i--) {
    const next = words[i] + (result ? " " + result : "");
    if (next.length > targetChars) break;
    result = next;
  }
  return result;
};

export const chunkText = (text: string): TextChunk[] => {
  const chunks: TextChunk[] = [];
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  let current = "";
  let index = 0;

  for (const sentence of sentences) {
    if (estimateTokenCount(current) + estimateTokenCount(sentence) > MAX_CHUNK_TOKENS && current) {
      chunks.push({ index, text: current.trim(), tokens: estimateTokenCount(current.trim()) });
      index += 1;
      current = getOverlapText(current, CHUNK_OVERLAP_TOKENS) + " " + sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim()) {
    chunks.push({ index, text: current.trim(), tokens: estimateTokenCount(current.trim()) });
  }
  return chunks;
};
