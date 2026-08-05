import type { Chunk, ContentItem } from "../types";

/**
 * Maximum characters of source content sent to Claude in a single call
 * (~37k tokens), sized from real measurements of this repository:
 *
 * - PR mode: the largest matched diff across the last 42 pull requests touching
 *   `apps/api` was 19,215 chars (median 1,761), so this leaves ample headroom
 *   and a check should effectively never be skipped for size.
 * - Baseline mode: the largest single matched file is
 *   `apps/api/plane/api/views/issue.py` at 101,511 chars. The cap must exceed
 *   the largest file, or that file can never be scanned at all — at a 60k cap
 *   it was being silently skipped on every run.
 *
 * A file larger than this is reported as skipped rather than truncated, so a
 * future regression past this ceiling is visible in the report instead of silent.
 */
export const DEFAULT_MAX_CHUNK_CHARS = 150_000;

export function chunkContent(items: readonly ContentItem[], maxChars: number = DEFAULT_MAX_CHUNK_CHARS): Chunk[] {
  const chunks: Chunk[] = [];
  let current: ContentItem[] = [];
  let currentSize = 0;

  const flush = (): void => {
    if (current.length > 0) {
      chunks.push({ items: current, overCap: false });
      current = [];
      currentSize = 0;
    }
  };

  for (const item of items) {
    const itemSize = item.content.length;

    if (itemSize > maxChars) {
      flush();
      chunks.push({ items: [item], overCap: true });
      continue;
    }

    if (currentSize + itemSize > maxChars) {
      flush();
    }

    current.push(item);
    currentSize += itemSize;
  }

  flush();

  return chunks;
}
