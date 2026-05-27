# MCP Transports

The wrapped server must support **stdio**, **SSE**, and **Streamable HTTP**. One core `Server` instance, three transport adapters.

## Transport selection

Entry (`bin.ts`):

```ts
const transport = process.env.MCP_TRANSPORT ?? flag("--transport") ?? "stdio";
switch (transport) {
  case "stdio":
    await startStdio(server);
    break;
  case "sse":
    await startSse(server, { port });
    break;
  case "http":
    await startStreamableHttp(server, { port });
    break;
  default:
    die(`unknown transport: ${transport}`);
}
```

## stdio

Default for local agent processes (Claude Code, Cursor, etc.).

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const t = new StdioServerTransport();
await server.connect(t);
```

- No auth at transport layer — trust the spawning parent
- Never write non-protocol bytes to stdout; logs go to stderr
- Credentials resolved from env + config files (same chain as CLI)

## SSE (legacy)

Compatibility for older clients. Keep it, but document Streamable HTTP as preferred.

```ts
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
app.get("/sse", async (c) => {
  const t = new SSEServerTransport("/messages", c.res);
  await server.connect(t);
});
app.post("/messages", (c) => t.handlePostMessage(c.req, c.res));
```

- Per-connection transport instance
- Bearer token auth before upgrade
- Heartbeats to keep proxies from idling the connection

## Streamable HTTP (preferred remote)

Modern transport. Required for Cloudflare Workers and most PaaS.

```ts
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
app.all("/mcp", async (c) => {
  const t = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  await server.connect(t);
  return t.handleRequest(c.req.raw, c.res);
});
```

- Single endpoint handles POST (requests) and GET (stream)
- Session ID header `mcp-session-id` maps to server state
- Works behind standard HTTP load balancers
- Supports resumable streams

## Session state

Local (stdio): in-memory per process.
Remote (SSE, HTTP): keyed by session ID. On Cloudflare Workers, use **Durable Objects** for per-session state. On Docker/Node, use Redis or in-memory with sticky sessions.

## Auth

Applies to SSE + HTTP only. stdio trusts the parent.

```
Authorization: Bearer <token>
```

Reject early with `401` and a clean MCP-level error on the first request. Do not leak which tokens exist. Rate-limit by token.

Token sources per deployment:

- Cloudflare: Workers Secrets (`wrangler secret put MCP_TOKEN`)
- Docker: env var, ideally sourced from a secret manager, never baked into the image
- Self-host: same, plus optional `.env` in production only if the host filesystem is trusted

## Tool schema

Every tool registered once against the core `Server`; all transports expose the same tool set.

```ts
server.tool(
  "list_projects",
  "List all projects for the authenticated user. Returns concise records (id, name, status). Use `format: detailed` for full data.",
  {
    format: z.enum(["concise", "detailed"]).default("concise"),
    limit: z.number().int().min(1).max(100).default(25),
  },
  async (args, ctx) => core.listProjects({ ...args, auth: ctx.auth })
);
```

## Health & observability

Expose on the HTTP transports:

- `GET /healthz` → 200 when server is up and core dependencies reachable
- `GET /readyz` → 200 when ready to serve
- Structured logs (JSON) to stderr with `trace_id`, `session_id`, `tool_name`, `duration_ms`, never args

Do not expose metrics without auth. If Prometheus is needed, mount on a separate internal port.
