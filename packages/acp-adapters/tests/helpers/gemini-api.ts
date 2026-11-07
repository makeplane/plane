/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

type Part = { text?: string; functionCall?: unknown; functionResponse?: { name: string; response: unknown } };
type Content = { role?: string; parts?: Part[] };

export interface ApiRequest {
  readonly url: string;
  readonly apiKey: string | undefined;
  readonly tools: string[];
}

const usageMetadata = { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 };
const candidate = (parts: Part[]) => ({
  candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }],
  usageMetadata,
});

/**
 * A local stand-in for the Gemini API (`generativelanguage.googleapis.com`), for running the real
 * Gemini CLI with `GOOGLE_GEMINI_BASE_URL` and a fake key. Scripted by the latest user text:
 * `CALL:<tool>|<json args>` answers with that function call, `WAIT` streams one chunk and never
 * finishes, `hello` answers "Hi there", anything else "ok". After a function response it answers
 * "tool said: <response>".
 */
export async function geminiApiServer(): Promise<{ url: string; requests: ApiRequest[]; close: () => Promise<void> }> {
  const requests: ApiRequest[] = [];
  const http: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      const body = (raw ? JSON.parse(raw) : {}) as {
        contents?: Content[];
        tools?: { functionDeclarations?: { name: string }[] }[];
      };
      requests.push({
        url: req.url ?? "",
        apiKey: req.headers["x-goog-api-key"] as string | undefined,
        tools: (body.tools ?? []).flatMap((tool) => tool.functionDeclarations ?? []).map((fn) => fn.name),
      });
      if (req.url?.includes(":countTokens")) {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ totalTokens: 10 }));
        return;
      }
      const parts = body.contents?.at(-1)?.parts ?? [];
      const response = parts.find((part) => part.functionResponse)?.functionResponse;
      // Gemini CLI may put its own context before the user's text in the same turn.
      const text = (parts.findLast((part) => part.text !== undefined)?.text ?? "").replace(/\u200B/g, "").trim();
      const call = /^CALL:([^|]+)\|(.*)$/s.exec(text);
      let reply;
      if (response) reply = candidate([{ text: `tool said: ${JSON.stringify(response.response).slice(0, 300)}` }]);
      else if (call) reply = candidate([{ functionCall: { name: call[1], args: JSON.parse(call[2] || "{}") } }]);
      else if (text === "WAIT") {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(
          `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "working" }] } }] })}\n\n`
        );
        return;
      } else reply = candidate([{ text: text === "hello" ? "Hi there" : "ok" }]);
      if (req.url?.includes("streamGenerateContent")) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.end(`data: ${JSON.stringify(reply)}\n\n`);
      } else {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(reply));
      }
    });
  });
  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", () => resolve()));
  return {
    url: `http://127.0.0.1:${(http.address() as AddressInfo).port}`,
    requests,
    close: () =>
      new Promise((resolve) => {
        http.closeAllConnections();
        http.close(() => resolve());
      }),
  };
}
