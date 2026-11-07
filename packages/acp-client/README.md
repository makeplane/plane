# @plane/acp-client

Browser side of the in-app agent chat: an [Agent Client Protocol](https://agentclientprotocol.com) v1
client that talks to `apps/agent-bridge` over a WebSocket. Framework-agnostic; `apps/web` wraps it in
a MobX store.

```ts
import { AgentChatSession, agentSocketUrl, openWebSocketTransport } from "@plane/acp-client";

const url = agentSocketUrl({ agentId, workspaceSlug, baseUrl, basePath }); // wss://…/agents/acp?agent=…&workspace=…
const chat = new AgentChatSession({ transport: () => openWebSocketTransport(url) });
const stop = chat.subscribe((snapshot) => render(snapshot)); // status, transcript, permissions, close…

await chat.connect(); // initialize: fs/terminal off, session.notices on
await chat.newSession({ initialModeId: "ask_writes" }); // cwd "/", no MCP servers: the bridge pins both
await chat.prompt("List my open work items"); // resolves with the stop reason
```

## Pieces

- **`openWebSocketTransport(url)`**: the SDK's experimental `createWebSocketStream` on the browser's
  native WebSocket (the session cookie authenticates the upgrade). The socket is created through a
  capturing constructor so `closed` resolves with the bridge's close code, which the SDK stream does not
  expose.
- **`AgentChatSession`**: wraps the SDK `client()`.
  - `connect`, `newSession`, `loadSession`, `listSessions` (check `supportsLoad` / `supportsList`), `prompt`,
    `cancel` (`session/cancel`; open permission requests are answered `cancelled` first, as ACP requires),
    `setMode`, `setModel` / `setConfigOption`, `respondToPermission(id, optionId | null)`, `reconnect`, `dispose`.
  - Every `session/request_permission` becomes a `PendingPermission` in the snapshot until the UI answers it.
  - Errors: `AgentRequestError` (JSON-RPC `code`, e.g. `INVALID_PARAMS` (-32602) for a `set_mode` above the
    admin maximum) and `AgentDisconnectedError` (with the `close` info).
  - **4410** (agent-session token expired): reconnects on its own, `initialize`s and `session/load`s the same
    session when the agent supports it. `reconnect()` does the same by hand, or starts a new session (with a
    `new_session` notice in the transcript) when the agent cannot load.
- **Transcript reducer** (`applySessionUpdate`): pure `session/update` → transcript. Messages and thoughts
  merge by `messageId`, tool calls are tracked by `toolCallId`, plus plan, usage, mode, config options,
  commands, session info, compaction and notices (including the bridge's `_meta["plane/notice"]` fallback).
- **`describeClose(code)`**: what a bridge close code means (`reason`, `canReconnect`, `autoReconnect`).

`pnpm --filter @plane/acp-client test` runs the reducer tests, the session against an in-memory fake ACP
agent (SDK `agent()`), and the transport against a browser-shaped fake WebSocket. The fake agent and the
in-memory transport are exported from `@plane/acp-client/testing` for tests built on the session (the
web `AgentChatStore` uses them).
