# agent-runner

Runs the ACP stdio adapters from `@plane/acp-adapters` (`plane-acp-claude`, `-codex`, `-deepseek`,
`-gemini`) and serves each one over ACP-on-WebSocket (the SDK's experimental `AcpServer`) to the agent
bridge. It also runs the provider sign-in helper (`plane-agent-login`) for ChatGPT and Google account
sign-ins, behind `/auth/*`.
It is a separate service from the bridge because agents need a full toolbox (shell, git, compilers,
the codex and Gemini CLIs, the Claude Agent SDK runtime), root to switch uids, and a network with only internet
egress and Plane MCP, none of which belongs next to the API.

## Protocol

- `GET /acp` (WebSocket upgrade) with `Authorization: Bearer <spawn ticket>`.
  - The ticket is `v1.<claims>.<HMAC-SHA256>`, signed with `AGENT_RUNNER_SECRET`, valid for 60 s
    and single-use. See `@plane/agent-runner-protocol`.
  - The claims are `{adapter, env, userId, workspaceId, initialMode, sessionRef, purpose}`.
    `purpose` is `acp` (or absent) for a chat; a `login` ticket is refused here with 401.
  - A missing, malformed, expired, tampered or replayed ticket gets HTTP 401. An unknown adapter
    (or `echo` when not enabled) gets 400.
- `GET /health`: `{status, version, agents, logins, isolation}`.

### Sign-in (`/auth/*`)

Provider account sign-in for Workspace settings → AI providers (ChatGPT for `codex`, Google for
`gemini`). The bridge calls these after checking the user's cookie and membership; the browser never
reaches the runner.

- Every request carries `Authorization: Bearer <ticket>` with `purpose: "login"`, `adapter` `codex`
  or `gemini`, and `env: {}`. Tickets are single-use (the same replay guard as `/acp`), so the bridge
  signs one per request. A missing, bad, replayed or `acp` ticket gets 401; another adapter gets 400.
- The helper is `node <@plane/acp-adapters>/dist/bin/login.mjs <adapter> <start|logout>`, run exactly
  like an agent: the dir's uid and dirs (prepared as for `/acp`), its own process group, `HOME` the
  user's agent home (so the adapter finds the sign-in the helper stores there), cwd the workspace dir,
  and the fixed base env only (no provider keys, nothing from the runner). It holds the uid like a
  connection does and counts against `AGENT_RUNNER_MAX_CONNECTIONS`. Its stdout carries device codes
  and is never logged.

| Endpoint                        | Body / query      | Answer                                                             |
| ------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `POST /auth/start`              |                   | `{loginId, verificationUrl, userCode?, needsCode}`                 |
| `GET /auth/status?loginId=<id>` |                   | `{status: "pending" \| "connected" \| "failed", account?, error?}` |
| `POST /auth/complete`           | `{loginId, code}` | the same state, after waiting up to 30 s for the helper            |
| `POST /auth/logout`             |                   | `{status: "disconnected"}`                                         |

- `start` waits up to 30 s for the helper's first event. One sign-in per (workspace, user, adapter):
  a new `start` stops the previous one (its status becomes `failed`). A sign-in still pending after
  15 min is killed. Finished results stay readable for 5 min.
- `status` and `complete` only see sign-ins started for the ticket's workspace, user and adapter
  (404 otherwise). `complete` is for sign-ins with `needsCode` (Google); others get 400.
- `logout` stops a sign-in in progress and runs `login.mjs <adapter> logout`.
- `account` is `{email?, plan?}`.
- Errors are `{error, reason?}`: 400 bad input, 401 ticket, 404 unknown sign-in, 409 already signed
  in, 502 the helper failed or stopped (`reason: "helper_failed"`, `error` is the helper's message),
  503 at capacity / shutting down / helper not installed, 504 the helper did not answer in time
  (`reason: "timeout"`).

The runner makes no access decisions: the bridge has already authenticated the user and checked
membership, and the ticket carries its word. The runner only maps the adapter to a fixed bin
(`node <@plane/acp-adapters>/dist/bin/<adapter>.mjs`), never to anything an admin or user typed.

## Isolation

Every `<workspace_id>/<user_id>` pair gets its own uid from `AGENT_RUNNER_UID_MIN..MAX`, recorded in
`<root>/.runner/uids.json`. That file is written atomically, survives restarts, and is never reset:
a damaged file is an error.

```
<root>/                     0711 root    traversable, not listable
<root>/.runner/uids.json    0700/0600    uid map
<root>/<ws>/<user>/         0700 uid     cwd, persistent across sessions
<root>/.homes/<ws>/<user>/  0700 uid     HOME (agent CLIs keep their session history here)
<root>/.tmp/<ws>/<user>/    0700 uid     TMPDIR
```

Every dir the runner chowns sits in a root-owned parent, so an agent cannot swap it for a symlink.

### Spawning

- Each agent is spawned with `uid`/`gid` set and `detached` (its own process group).
- Its env is built from nothing:
  - `PATH`, `HOME`, `TMPDIR`, `USER`, `SHELL`, `LANG` and `PLANE_AGENT_DEFAULT_MODE`.
  - Plus the agent's env from the ticket, minus reserved names: loader and interpreter hooks
    (`LD_*`, `NODE_OPTIONS`, `BASH_ENV`, …) and the runner's own variables.
  - The adapters scrub credential-looking names again before anything the user drives sees them.

The sign-in helper follows the same rules.

### Stopping

- When the socket closes, the whole process group gets SIGTERM, then SIGKILL after
  `AGENT_RUNNER_KILL_GRACE_MS`.
- When the last connection for a uid ends, anything still running as that uid is killed.
- tini is PID 1 in the image, so orphans are reaped.

`AGENT_RUNNER_ISOLATION=none` runs agents as the runner's own user, for local development only. With
`uid` (the default) the runner refuses to start unless it is root.

## Environment

| Variable                                        | Default                  | Meaning                                                      |
| ----------------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `PORT` / `HOST`                                 | `3410`/`0.0.0.0`         | Listen address                                               |
| `AGENT_RUNNER_SECRET`                           | (required)               | Verifies spawn tickets (32+ chars); same value as the bridge |
| `AGENT_WORKSPACES_ROOT`                         | `/workspaces`            | The volume; must equal the bridge's value                    |
| `AGENT_RUNNER_ISOLATION`                        | `uid`                    | `uid` (needs root) or `none` (development)                   |
| `AGENT_RUNNER_UID_MIN` / `AGENT_RUNNER_UID_MAX` | `20000` / `59999`        | uid range (stays inside a 65536-uid user namespace)          |
| `AGENT_RUNNER_ENABLE_ECHO`                      | `false`                  | Allow the `echo` test agent                                  |
| `AGENT_RUNNER_AGENT_PATH`                       | node's dir + system dirs | `PATH` agents see                                            |
| `AGENT_RUNNER_AGENT_SHELL`                      | `/bin/bash`              | `SHELL` agents see                                           |
| `AGENT_RUNNER_KILL_GRACE_MS`                    | `3000`                   | SIGTERM → SIGKILL                                            |
| `AGENT_RUNNER_MAX_MESSAGE_BYTES`                | 8 MiB                    | Largest frame from the bridge                                |
| `AGENT_RUNNER_MAX_CONNECTIONS`                  | `64`                     |                                                              |
| `AGENT_RUNNER_MAX_HEADER_BYTES`                 | 256 KiB                  | Tickets carry the agent env, so upgrade headers can be large |
| `LOG_LEVEL`, `APP_VERSION`                      |                          | Agent stderr is logged at `debug`                            |

Give the container cpu, memory and pids limits.

```sh
pnpm --filter agent-runner test     # includes the browser → bridge → runner → echo end-to-end test
docker build -f apps/agent-runner/Dockerfile.agent-runner -t plane-agent-runner .  # BUILDX_BUILDER=default locally
```
