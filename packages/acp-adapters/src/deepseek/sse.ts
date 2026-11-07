/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- a stream is read one chunk after another */
/**
 * Parse an OpenAI-style `text/event-stream` body into JSON events, ending at `[DONE]`. Ported from
 * employ_ai `openai-chat-completions.ts`, with CRLF handling and a malformed-event error that names
 * the stream instead of a bare `SyntaxError`.
 */
export async function* chatSseEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const data = eventData(part);
        if (data === "[DONE]") return;
        if (data) yield parse(data);
      }
    }
    buffer += decoder.decode();
    const data = eventData(buffer);
    if (data && data !== "[DONE]") yield parse(data);
  } finally {
    reader.releaseLock();
  }
}

function eventData(part: string): string {
  return part
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");
}

function parse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw new Error(`malformed event in the DeepSeek stream: ${data.slice(0, 120)}`);
  }
}
