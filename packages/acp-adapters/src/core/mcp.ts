import type { McpServer } from "@agentclientprotocol/sdk";

/**
 * Converters from ACP `mcpServers` entries to each provider's format. Headers and env values carry
 * credentials (the Plane MCP bearer token), so nothing here logs them.
 */

export type ClaudeMcpServer =
  | { type: "http"; url: string; headers: Record<string, string> }
  | { type: "sse"; url: string; headers: Record<string, string> }
  | { type: "stdio"; command: string; args: string[]; env: Record<string, string> };

export function toClaudeMcpServers(servers: readonly McpServer[]): Record<string, ClaudeMcpServer> {
  const out: Record<string, ClaudeMcpServer> = {};
  for (const server of servers) {
    if ("type" in server && (server.type === "http" || server.type === "sse")) {
      out[server.name] = { type: server.type, url: server.url, headers: pairs(server.headers) };
    } else if ("command" in server) {
      out[server.name] = { type: "stdio", command: server.command, args: [...server.args], env: pairs(server.env) };
    }
  }
  return out;
}

/** One `mcp_servers.<name>` table of Codex's config, passed as a `thread/start` config override. */
export type CodexMcpServer =
  | { url: string; http_headers: Record<string, string>; default_tools_approval_mode: "prompt" }
  | { command: string; args: string[]; env: Record<string, string>; default_tools_approval_mode: "prompt" };

/**
 * Codex config overrides for `thread/start` `config.mcp_servers`. Every server prompts for every
 * tool call (`default_tools_approval_mode = "prompt"`), so each call reaches our permission gate as
 * an `mcpServer/elicitation/request` and the session mode decides. SSE has no Codex transport and
 * is skipped.
 */
export function toCodexMcpServers(servers: readonly McpServer[]): Record<string, CodexMcpServer> {
  const out: Record<string, CodexMcpServer> = {};
  for (const server of servers) {
    const name = codexServerName(server.name);
    if ("type" in server && server.type === "http") {
      out[name] = { url: server.url, http_headers: pairs(server.headers), default_tools_approval_mode: "prompt" };
    } else if (!("type" in server) || server.type !== "sse") {
      if ("command" in server) {
        out[name] = {
          command: server.command,
          args: [...server.args],
          env: pairs(server.env),
          default_tools_approval_mode: "prompt",
        };
      }
    }
  }
  return out;
}

/** Codex config keys are TOML bare keys. */
export function codexServerName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, "_") || "mcp";
}

function pairs(entries: readonly { name: string; value: string }[] | undefined): Record<string, string> {
  return Object.fromEntries((entries ?? []).map((entry) => [entry.name, entry.value]));
}
