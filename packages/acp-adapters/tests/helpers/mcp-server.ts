/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export interface McpCall {
  readonly tool: string;
  readonly args: Record<string, unknown>;
  readonly authorization: string | undefined;
  readonly workspace: string | undefined;
}

/**
 * A stateless Streamable HTTP MCP server shaped like the Plane MCP server: one `workitem` tool with
 * an `action` argument. Records each call with the auth headers it arrived with.
 */
export async function planeMcpServer(): Promise<{ url: string; calls: McpCall[]; close: () => Promise<void> }> {
  const calls: McpCall[] = [];
  const http: Server = createServer(async (req, res) => {
    const server = new McpServer({ name: "plane-test", version: "1.0.0" });
    server.registerTool(
      "workitem",
      {
        description: "Work items. Actions: list, retrieve, create, update, delete.",
        inputSchema: {
          action: z.enum(["list", "retrieve", "create", "update", "delete"]),
          name: z.string().optional(),
        },
      },
      async (args) => {
        calls.push({
          tool: "workitem",
          args,
          authorization: req.headers.authorization,
          workspace: req.headers["x-workspace-slug"] as string | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: args.action === "list" ? "ENG-1 First item" : `${args.action}d ${args.name ?? ""}`.trim(),
            },
          ],
        };
      }
    );
    const transport = new StreamableHTTPServerTransport(
      {} as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]
    );
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    let raw = "";
    req.on("data", (data: Buffer) => {
      raw += data.toString();
    });
    req.on("end", () => void transport.handleRequest(req, res, raw ? JSON.parse(raw) : undefined));
  });
  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", () => resolve()));
  const { port } = http.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    calls,
    close: () =>
      new Promise((resolve) => {
        http.closeAllConnections();
        http.close(() => resolve());
      }),
  };
}
