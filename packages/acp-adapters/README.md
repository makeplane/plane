# @plane/acp-adapters

Agent Client Protocol (ACP v1) agents for Plane's in-app agent chat. Each adapter is a stdio bin that the
agent runner spawns. The bridge talks to it over ACP and never translates.

| Admin `adapter` | Bin                  | Provider                                                                   |
| --------------- | -------------------- | -------------------------------------------------------------------------- |
| `claude`        | `plane-acp-claude`   | Claude Agent SDK `query()`: Claude Code's built-in tools plus MCP          |
| `codex`         | `plane-acp-codex`    | `codex app-server` (the `codex` CLI must be on `PATH`)                     |
| `deepseek`      | `plane-acp-deepseek` | DeepSeek chat completions, with our own tool loop, tool set and MCP client |
| (tests only)    | `plane-acp-echo`     | Deterministic echo agent for bridge and conformance tests                  |

`ADAPTER_BINS` exports this mapping. Admins pick an adapter and never a command.

## Contract with the bridge

- **Permission levels** are ACP session modes, ordered least to most permissive: `ask_all`, `ask_writes`
  and `yolo`. Every adapter advertises exactly these three in `session/new` and honours `session/set_mode`
  (mid-turn too: the gate reads the mode on each tool call). The bridge enforces the admin maximum.
- **Starting mode**: `session/new` `_meta["plane/initialModeId"]`, else `PLANE_AGENT_DEFAULT_MODE`, else
  `ask_writes`.
- **Model**: a `configOptions` select with `id: "model"` and `category: "model"`, changed with
  `session/set_config_option`.
- **Plane MCP** arrives as an ACP `mcpServers` entry `{type: "http", url, headers}`. Every adapter
  advertises `mcpCapabilities.http = true` (SSE is not offered).
- **Prompts** offer _Allow once_ (`allow_once`), _Always this session_ (`allow_always`, remembered per
  tool and command or Plane action) and _Deny_ (`reject_once`).
- **Cancellation**: `session/cancel` is the business stop, and the prompt answers `stopReason: "cancelled"`.
  `$/cancel_request` on the prompt request is transport-level, and the prompt answers JSON-RPC `-32800`.

The mode gate:

| Category                                                | `ask_all` | `ask_writes` | `yolo` |
| ------------------------------------------------------- | --------- | ------------ | ------ |
| read, search, web fetch, plan/think, Plane MCP reads    | ask       | run          | run    |
| shell, file write/edit/delete/move, Plane MCP mutations | ask       | ask          | run    |

Plane MCP calls count as reads when the tool is annotated `readOnlyHint`, when its `action` is
`list*`/`retrieve*`/`search`/`count`/`get*` (and similar), or when it is a `get_*`/`list_*` tool. Anything
else, including unknown actions, is a mutation.

## Environment variables

The runner passes the agent's `env` from the admin config. Credentials never reach the tools the user
drives: Claude runs with `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`, Codex threads get a
`shell_environment_policy` that excludes `*KEY*`/`*TOKEN*`/`*SECRET*`/`*PASSWORD*`/`*CREDENTIAL*`, and
DeepSeek's shell and stdio MCP servers drop the same names.

| Variable                       | Adapter  | Meaning                                                                      |
| ------------------------------ | -------- | ---------------------------------------------------------------------------- |
| `PLANE_AGENT_MODEL`            | all      | Default model id (added to the model list if it is not already in it)        |
| `PLANE_AGENT_DEFAULT_MODE`     | all      | Starting mode when the bridge sends none                                     |
| `ANTHROPIC_API_KEY`            | claude   | API key, or…                                                                 |
| `CLAUDE_CODE_OAUTH_TOKEN`      | claude   | …a Claude subscription token (one of the two is required)                    |
| `OPENAI_API_KEY`               | codex    | Signs the app-server in with an API key when it is not already signed in     |
| `CODEX_HOME`                   | codex    | Alternative: a pre-signed-in Codex home                                      |
| `PLANE_CODEX_STALL_TIMEOUT_MS` | codex    | Fail a turn after this long without app-server output (default 300000)       |
| `PLANE_CODEX_TURN_TIMEOUT_MS`  | codex    | Hard turn limit (default 1800000)                                            |
| `DEEPSEEK_API_KEY`             | deepseek | Required                                                                     |
| `DEEPSEEK_BASE_URL`            | deepseek | API base (default `https://api.deepseek.com`)                                |
| `DEEPSEEK_REASONING_EFFORT`    | deepseek | Optional `reasoning_effort` (`low`/`high`/`max`)                             |
| `PLANE_AGENT_MAX_ITERATIONS`   | deepseek | Model calls per prompt before stopping with `max_turn_requests` (default 50) |
| `PLANE_ACP_MAX_MESSAGE_BYTES`  | all      | Inbound frame limit (default 8 MiB)                                          |

Models: Claude defaults to `claude-opus-5-5` (also `claude-sonnet-5-5`, `claude-haiku-5-5` and
`claude-fable-5-1`). DeepSeek defaults to `deepseek-v4-pro` (also `deepseek-flash`). Codex lists whatever
the app-server's `model/list` returns.

## How each adapter maps the modes

- **Claude**: a `PreToolUse` hook runs every tool call through the gate and answers `allow` or `deny`.
  `canUseTool` uses the same decision as a fallback. `permissionMode` is `bypassPermissions` in `yolo`
  and `default` otherwise, and settings files are not loaded (`settingSources: []`), so nothing on disk
  can bypass the hook. `TodoWrite` becomes a `plan` update and is never gated.
- **Codex**: threads run with `sandbox: "danger-full-access"` because the runner is the sandbox.
  `ask_all` and `ask_writes` use `approvalPolicy: "untrusted"`. `ask_writes` auto-accepts commands that
  Codex parsed as pure reads, lists or searches. `yolo` uses `on-request` and accepts everything. MCP
  servers are configured with `default_tools_approval_mode = "prompt"`, so each MCP call arrives as an
  `mcpServer/elicitation/request` and the gate decides. That way a mode change applies to MCP calls on an
  existing thread too.
- **DeepSeek**: our own loop asks the gate before every tool and MCP call.

## Conformance

The discipline is ported from employai_v2's `acp/employai-acp`:

- `acp-version.lock.json` pins the SDK release (version, integrity, git head), the wire protocol, the v1
  schema hash and the golden corpus hash. `tests/acp-version.test.ts` fails when any of them drift.
- `tests/golden/` holds transcripts compared frame by frame (`valid/`, `malformed/`, `transport/`):
  - Pipe cases feed raw bytes to a spawned bin.
  - Script cases drive an interactive session.
  - Every input and expected file is pinned by hash in `manifest.json`.
  - stdout must be JSON-RPC 2.0 only, and a session's `session/new` response must come before its updates.
  - Re-record with `UPDATE_GOLDEN=1 pnpm test`, review the diff, then update `corpus.sha256` in the lock.
- Transport rules:
  - Frames queued behind `initialize` wait for its response.
  - EOF drains in-flight requests before exit.
  - An over-limit or non-UTF-8 frame is answered with one `-32600` and exit code 1.
  - SIGINT and SIGTERM exit within 1.5 s.
  - `console.log` goes to stderr.
- `messageId`s are deterministic (`m<turn>-<n>`). Tool calls keep their provider ids.

Tests run with no network and no credentials:

- Codex runs against a fake `codex app-server` placed on `PATH`.
- Claude runs with a mocked `query()`, in-process over ndjson streams.
- DeepSeek runs against a `fetch` stub, or a local SSE server for the spawned bin.
- An in-process Streamable HTTP MCP server stands in for Plane MCP.

```sh
pnpm --filter @plane/acp-adapters test
pnpm --filter @plane/acp-adapters build && printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1}}' \
  '{"jsonrpc":"2.0","id":2,"method":"session/new","params":{"cwd":"/tmp","mcpServers":[]}}' \
  '{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"echo-session-1","prompt":[{"type":"text","text":"hi"}]}}' \
  | node packages/acp-adapters/dist/bin/echo.mjs
```
