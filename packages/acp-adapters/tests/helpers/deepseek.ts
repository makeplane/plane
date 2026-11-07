/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- the SSE body is written chunk by chunk */
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

type Message = { role: string; content?: string | null; tool_call_id?: string; reasoning_content?: string };
type Event = Record<string, unknown>;

/** One scripted completion: SSE events, or a stream that sends one chunk then hangs until aborted. */
export type Completion = { events: Event[] } | { hang: Event[] };

const usage = { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 };

const chunk = (delta: Record<string, unknown>, finish: string | null = null): Event => ({
  id: "cmpl-1",
  object: "chat.completion.chunk",
  model: "deepseek-v4-pro",
  choices: [{ index: 0, delta, finish_reason: finish }],
});

function toolCall(id: string, name: string, args: Record<string, unknown>): Event[] {
  const json = JSON.stringify(args);
  const half = Math.ceil(json.length / 2);
  return [
    chunk({ reasoning_content: `I will call ${name}.` }),
    chunk({ tool_calls: [{ index: 0, id, type: "function", function: { name, arguments: json.slice(0, half) } }] }),
    chunk({ tool_calls: [{ index: 0, function: { arguments: json.slice(half) } }] }),
    chunk({}, "tool_calls"),
    { ...chunk({}), choices: [], usage },
  ];
}

/**
 * The scripted DeepSeek: decides from the conversation so far. Prompts: "hello" (reasoning + text),
 * "write" (built-in write tool), "plane create" / "plane list" (MCP tool), "wait" (hangs), "long"
 * (finish_reason length), "filter" (content_filter), "loop" (tool calls forever). After a tool
 * result it answers "done: <result>".
 */
export function scriptedCompletion(body: { messages: Message[] }): Completion {
  const messages = body.messages;
  const last = messages.at(-1);
  const lastUser = messages.findLast((message) => message.role === "user")?.content ?? "";
  if (last?.role === "tool" && lastUser !== "loop") {
    return {
      events: [
        chunk({ content: `done: ${String(last.content).split(/\s/)[0]}` }),
        chunk({}, "stop"),
        { ...chunk({}), choices: [], usage },
      ],
    };
  }
  switch (lastUser) {
    case "hello":
      return {
        events: [
          chunk({ role: "assistant", reasoning_content: "The user " }),
          chunk({ reasoning_content: "greets me." }),
          chunk({ content: "Hi " }),
          chunk({ content: "there" }),
          chunk({}, "stop"),
          { ...chunk({}), choices: [], usage },
        ],
      };
    case "write":
      return { events: toolCall("call_w", "write", { path: "out.txt", content: "hello file" }) };
    case "plane create":
      return { events: toolCall("call_p", "mcp__plane__workitem", { action: "create", name: "From DeepSeek" }) };
    case "plane list":
      return { events: toolCall("call_l", "mcp__plane__workitem", { action: "list" }) };
    case "env":
      return {
        events: toolCall("call_env", "bash", {
          command: "echo key=${DEEPSEEK_API_KEY:-unset} token=${PLANE_TOKEN:-unset} home=${HOME:+set}",
        }),
      };
    case "loop":
      return { events: toolCall(`call_loop_${messages.length}`, "glob", { pattern: "*.none" }) };
    case "wait":
      return { hang: [chunk({ content: "working" })] };
    case "long":
      return { events: [chunk({ content: "cut" }), chunk({}, "length")] };
    case "filter":
      return { events: [chunk({ content: "no" }), chunk({}, "content_filter")] };
    default:
      return { events: [chunk({ content: "ok" }), chunk({}, "stop")] };
  }
}

function sseStream(completion: Completion, signal: AbortSignal | undefined): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const events = "events" in completion ? completion.events : completion.hang;
      for (const event of events) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      if ("events" in completion) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } else {
        signal?.addEventListener(
          "abort",
          () => controller.error(Object.assign(new Error("aborted"), { name: "AbortError" })),
          {
            once: true,
          }
        );
      }
    },
  });
}

/** A `fetch` stub serving the scripted DeepSeek and recording each request body. */
export function deepSeekFetch(): {
  fetch: typeof fetch;
  requests: Array<{ url: string; body: any; headers: Headers }>;
} {
  const requests: Array<{ url: string; body: any; headers: Headers }> = [];
  const stub = (async (input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    requests.push({ url: String(input), body, headers: new Headers(init?.headers) });
    return new Response(sseStream(scriptedCompletion(body), init?.signal ?? undefined), {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    });
  }) as typeof fetch;
  return { fetch: stub, requests };
}

/** The same scripted DeepSeek over local HTTP, for the spawned bin (`DEEPSEEK_BASE_URL`). */
export async function deepSeekServer(): Promise<{ url: string; requests: any[]; close: () => Promise<void> }> {
  const requests: any[] = [];
  const server: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (data: Buffer) => {
      raw += data.toString();
    });
    req.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      requests.push({ url: req.url, body, authorization: req.headers.authorization });
      const controller = new AbortController();
      res.on("close", () => controller.abort());
      res.writeHead(200, { "content-type": "text/event-stream" });
      const reader = sseStream(scriptedCompletion(body), controller.signal).getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch {
        // client went away
      }
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
