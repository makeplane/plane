# agent-bridge

ACP (Agent Client Protocol) policy proxy for the in-app agent chat. The browser is a real ACP
client; the bridge authenticates it, then relays JSON-RPC frames to the agent runner. It enforces
policy but never translates, and it never runs agents itself (no agent CLIs or adapters in this image).

```
browser ──WS /agents/acp (cookie)──▶ agent-bridge ──WS /acp (spawn ticket)──▶ agent-runner ──stdio──▶ plane-acp-*
browser ──HTTP /agents/connections/* ─▶     │      ──HTTP /auth/* (login ticket)─▶      └──stdio──▶ plane-agent-login
                                            └─▶ API: /api/users/me/ (cookie), /api/internal/agent-sessions/,
                                                     /api/internal/agent-connections/ (shared secret)
```

## Endpoints

- `GET /agents/acp?agent=<agent uuid>&workspace=<slug>`: WebSocket upgrade. In order:
  1. Origin check.
  2. Cookie → `/api/users/me/`.
  3. Per-user connection cap.
  4. `POST /api/internal/agent-sessions/` mints a short-lived, workspace-scoped token.
  5. Opens the runner connection.
- `GET /agents/health`: liveness and the open connection count.
- `<base>/connections/<provider>/…`: provider account sign-in (below).

When the browser disconnects (or the session ends any other way), the runner connection is closed
(the runner kills the agent) and the token is revoked with `DELETE /api/internal/agent-sessions/<id>/`.

## Policy

- **Method allowlist.**
  - Browser → agent: `initialize`, `session/new|load|resume|list|close|delete|set_mode|set_config_option|prompt`,
    and the notifications `session/cancel` and `$/cancel_request`.
  - Agent → browser: `session/request_permission`, `session/update` and `$/cancel_request`.
  - Anything else gets a `-32601` answer from the bridge (requests), or is dropped (notifications, and
    responses nobody asked for). That includes `fs/*`, `terminal/*`, `authenticate`, `elicitation/*`
    and `_` extensions.
- **`initialize`**: `clientCapabilities` is forced to
  `{fs: {readTextFile: false, writeTextFile: false}, terminal: false}` (plus the browser's `session`
  capabilities).
- **`session/new|load|resume`**:
  - `cwd` is pinned to `<AGENT_WORKSPACES_ROOT>/<workspace_id>/<user_id>`.
  - `additionalDirectories` and any browser-supplied `mcpServers` are dropped.
  - Plane MCP is appended as
    `{type: "http", name: "plane", url, headers: [Authorization: Bearer <token>, X-Workspace-slug: <slug>]}`
    when the admin enabled it and the agent advertised `mcpCapabilities.http`. Otherwise the bridge
    sends a `notice` session update (or an agent message, if the browser did not advertise
    `session.notices`).
  - `_meta["plane/initialModeId"]` is the browser's request, or else the admin default, clamped to the admin maximum.
  - The result's `modes.availableModes` loses the modes above the maximum.
- **`session/list`**: `cwd` is pinned the same way.
- **`session/set_mode`** above the admin maximum, or to an unknown mode, is answered `-32602` and not forwarded.
- **Limits**:
  - The largest frame from the browser (the socket closes with 1009).
  - A per-user and a global connection cap.
  - An initialize deadline (30 s).
  - An idle timeout, which only applies when no request is in flight.
  - The connection closes when the token expires.

## Provider sign-in (`<base>/connections/<provider>/…`)

Workspace settings → AI providers uses these to connect a member's own ChatGPT or Google account.
`provider` is `openai` (adapter `codex`, API method `chatgpt`) or `google` (adapter `gemini`, method
`google_account`). Every request, in order:

1. The Origin check of the WebSocket (and a GET without `Origin` whose `Sec-Fetch-Site` is
   `cross-site`/`same-site` is refused). Allowed origins get CORS headers with credentials, and
   `OPTIONS` preflights are answered (`GET, POST`, header `Content-Type`).
2. `POST` requires `Content-Type: application/json`.
3. Cookie → `/api/users/me/`.
4. `POST /api/internal/agent-connections/authorize/` `{user_id, workspace_slug}`: an active member.
5. A single-use `purpose: "login"` spawn ticket (`env: {}`, `initialMode: "ask_all"`) for the runner's
   `/auth/*` (see the runner README).

| Endpoint                                     | Body / query                 | Success                                                |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| `POST …/start`                               | `{workspace}`                | 200 `{loginId, verificationUrl, userCode?, needsCode}` |
| `GET …/status?workspace=<slug>&loginId=<id>` |                              | 200 `{status, account?, error?}`                       |
| `POST …/complete`                            | `{workspace, loginId, code}` | 200 `{status, account?, error?}`                       |
| `POST …/disconnect`                          | `{workspace}`                | 204                                                    |

- `status` is `pending`, `connected` or `failed`; `account` is `{email?, plan?}` on `connected`; `error`
  is set on `failed`.
- ChatGPT (`openai`): `needsCode: false`; show `userCode` and `verificationUrl` and poll `status`.
- Google (`google`): `needsCode: true`, no `userCode`; open `verificationUrl`, then send the code the
  user pastes to `complete`.
- When `status` or `complete` reports `connected`, the bridge records the credential first:
  `PUT /api/internal/agent-connections/` `{user_id, workspace_slug, provider, method, account_label}`
  (the email). If that fails the answer is 502 and the next `status` poll retries it.
- `disconnect` signs out on the runner, then `DELETE /api/internal/agent-connections/`
  `{user_id, workspace_slug, provider}`. If the runner cannot sign out, nothing is deleted (502).
- Errors are JSON `{error}`:

| Status | Meaning                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| 400    | Unknown provider, missing/invalid `workspace`/`loginId`/`code`, not JSON, a code for a sign-in without one   |
| 401    | Not signed in                                                                                                |
| 403    | Not an active member of the workspace, or a disallowed origin                                                |
| 404    | Unknown sign-in (expired, or not this user's/workspace's/provider's), or an unknown route                    |
| 429    | Too many `start`s for this user (`Retry-After` is set)                                                       |
| 502    | The runner or the API is unavailable or misconfigured; or the sign-in helper failed (its message is `error`) |

- Every answer is `Cache-Control: no-store`. Cookies, tickets, verification URLs, device codes and pasted
  codes are never logged.

## Close codes

| Code | Meaning                                                       |
| ---- | ------------------------------------------------------------- |
| 4400 | Missing or malformed `agent`/`workspace` parameters           |
| 4401 | Not signed in                                                 |
| 4403 | Not an active member of the workspace                         |
| 4404 | Agent not found or disabled                                   |
| 4408 | Idle timeout, or no `initialize` in time                      |
| 4410 | The agent-session token expired; reconnect and `session/load` |
| 4429 | Too many open chats (per user) or the bridge is at capacity   |
| 4502 | The agent runner is unavailable, or the agent went away       |
| 1011 | The API is unavailable or the bridge is misconfigured         |

A cross-origin upgrade is refused with HTTP 403 before any API call.

## Environment

| Variable                                | Default          | Meaning                                                                               |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `PORT` / `HOST`                         | `3400`/`0.0.0.0` | Listen address                                                                        |
| `API_BASE_URL`                          | (required)       | Plane API origin                                                                      |
| `AGENT_BRIDGE_SECRET`                   | (required)       | Same value as the API's `AGENT_BRIDGE_SECRET`                                         |
| `AGENT_RUNNER_URL`                      | (required)       | Runner endpoint, e.g. `ws://agent-runner:3410/acp`                                    |
| `AGENT_RUNNER_SECRET`                   | (required)       | Signs spawn tickets (32+ chars); same value on the runner                             |
| `AGENT_RUNNER_HTTP_URL`                 | (from the above) | Runner HTTP origin for `/auth/*`; default `AGENT_RUNNER_URL` as http(s), minus `/acp` |
| `AGENT_BRIDGE_BASE_PATH`                | `/agents`        | Mount point                                                                           |
| `AGENT_WORKSPACES_ROOT`                 | `/workspaces`    | Must equal the runner's value (the cwd is computed on both sides)                     |
| `PLANE_MCP_URL`                         | (API's value)    | Overrides the MCP URL the API returns (use the address the runner can reach)          |
| `CORS_ALLOWED_ORIGINS`                  | (empty)          | Browser origins allowed to connect (and to call `/connections`); empty: own host only |
| `AGENT_BRIDGE_MAX_MESSAGE_BYTES`        | 4 MiB            | Largest frame from the browser                                                        |
| `AGENT_BRIDGE_MAX_AGENT_MESSAGE_BYTES`  | 32 MiB           | Largest frame from the runner                                                         |
| `AGENT_BRIDGE_MAX_CONNECTIONS_PER_USER` | `4`              |                                                                                       |
| `AGENT_BRIDGE_MAX_CONNECTIONS`          | `500`            |                                                                                       |
| `AGENT_BRIDGE_IDLE_TIMEOUT_MS`          | 15 min           |                                                                                       |
| `AGENT_BRIDGE_PING_INTERVAL_MS`         | 30 s             | WebSocket keepalive                                                                   |
| `AGENT_BRIDGE_LOGIN_START_LIMIT`        | `10`             | Sign-in `start`s per user per window                                                  |
| `AGENT_BRIDGE_LOGIN_START_WINDOW_MS`    | 10 min           |                                                                                       |
| `LOG_LEVEL`, `APP_VERSION`              |                  | Structured JSON logs via `@plane/logger`. Tokens, env and cookies are never logged    |

## Transports

`AgentTransport` (`src/transport.ts`) is how the bridge reaches an agent. `RunnerTransport` uses the
SDK's experimental `createWebSocketStream` with a spawn ticket. A direct remote ACP agent (the user's own
`/acp` endpoint) can be added as another implementation; the policy proxy does not change.

```sh
pnpm --filter agent-bridge test
docker build -f apps/agent-bridge/Dockerfile.agent-bridge -t plane-agent-bridge .   # BUILDX_BUILDER=default locally
```
