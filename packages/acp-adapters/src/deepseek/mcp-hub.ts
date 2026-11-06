/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- tool listing follows the server's pagination cursor */
import type { McpServer } from "@agentclientprotocol/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { scrubSecrets } from "../core/env.ts";
import { errorMessage, type JsonObject } from "../core/json.ts";
import { PACKAGE_VERSION } from "../core/info.ts";
import { openAiToolName, sanitizeToolInputSchema } from "./tool-names.ts";

export interface McpToolBinding {
  /** Name the model sees, unique and API-safe. */
  readonly functionName: string;
  readonly server: string;
  readonly tool: string;
  readonly description: string;
  readonly parameters: JsonObject;
  readonly readOnlyHint: boolean | undefined;
}

const CONNECT_TIMEOUT_MS = 15_000;
const MAX_RESULT_CHARS = 100_000;

/**
 * MCP client side of the DeepSeek adapter: connects to the session's `mcpServers` (Streamable HTTP
 * or stdio), lists their tools as functions named `mcp__<server>__<tool>`, and calls them. A server
 * that fails to connect is reported once and skipped, so one bad server does not sink the session.
 */
export class McpHub {
  readonly #clients = new Map<string, Client>();
  readonly #tools = new Map<string, McpToolBinding>();
  readonly failures: string[] = [];

  static async connect(servers: readonly McpServer[], cwd: string): Promise<McpHub> {
    const hub = new McpHub();
    await Promise.all(servers.map((server) => hub.#connectOne(server, cwd)));
    return hub;
  }

  get tools(): readonly McpToolBinding[] {
    return [...this.#tools.values()];
  }

  binding(functionName: string): McpToolBinding | undefined {
    return this.#tools.get(functionName);
  }

  async call(
    binding: McpToolBinding,
    args: JsonObject,
    signal: AbortSignal
  ): Promise<{ text: string; isError: boolean }> {
    const client = this.#clients.get(binding.server);
    if (!client) return { text: `MCP server ${binding.server} is not connected`, isError: true };
    const result = await client.callTool({ name: binding.tool, arguments: args }, undefined, { signal });
    const content = Array.isArray(result.content) ? result.content : [];
    const text = content
      .map((block: { type?: string; text?: string }) =>
        block.type === "text" ? (block.text ?? "") : `[${block.type ?? "content"}]`
      )
      .join("\n");
    const structured = result.structuredContent ? JSON.stringify(result.structuredContent) : "";
    const body = text || structured || "(no output)";
    return {
      text: body.length > MAX_RESULT_CHARS ? `${body.slice(0, MAX_RESULT_CHARS)}\n[truncated]` : body,
      isError: result.isError === true,
    };
  }

  async close(): Promise<void> {
    await Promise.allSettled([...this.#clients.values()].map((client) => client.close()));
    this.#clients.clear();
  }

  async #connectOne(server: McpServer, cwd: string): Promise<void> {
    const client = new Client({ name: "plane-acp-deepseek", version: PACKAGE_VERSION });
    try {
      if ("type" in server && server.type === "http") {
        const headers = Object.fromEntries(server.headers.map((header) => [header.name, header.value]));
        await client.connect(new StreamableHTTPClientTransport(new URL(server.url), { requestInit: { headers } }), {
          timeout: CONNECT_TIMEOUT_MS,
        });
      } else if ("command" in server) {
        await client.connect(
          new StdioClientTransport({
            command: server.command,
            args: server.args,
            // Explicit values from the session request are kept; inherited credentials are not.
            env: {
              ...scrubSecrets(process.env),
              ...Object.fromEntries(server.env.map((entry) => [entry.name, entry.value])),
            },
            cwd,
            stderr: "ignore",
          }),
          { timeout: CONNECT_TIMEOUT_MS }
        );
      } else {
        this.failures.push(`${server.name}: SSE MCP servers are not supported`);
        return;
      }
      this.#clients.set(server.name, client);
      let cursor: string | undefined;
      do {
        const page = await client.listTools(cursor ? { cursor } : undefined);
        for (const tool of page.tools) {
          const functionName = this.#uniqueName(openAiToolName(`mcp__${server.name}__${tool.name}`));
          this.#tools.set(functionName, {
            functionName,
            server: server.name,
            tool: tool.name,
            description: tool.description ?? tool.title ?? tool.name,
            parameters: sanitizeToolInputSchema(tool.inputSchema),
            readOnlyHint: tool.annotations?.readOnlyHint,
          });
        }
        cursor = page.nextCursor;
      } while (cursor);
    } catch (error) {
      this.failures.push(`${server.name}: ${errorMessage(error)}`);
      await client.close().catch(() => {});
      this.#clients.delete(server.name);
    }
  }

  #uniqueName(name: string): string {
    let candidate = name;
    for (let n = 2; this.#tools.has(candidate); n += 1) candidate = `${name.slice(0, 60)}_${n}`;
    return candidate;
  }
}
