# @plane/acp-adapters

Agent Client Protocol (ACP v1) agents for Plane's in-app agent chat. Each adapter is a stdio bin that the
agent runner spawns. The bridge talks to it over ACP and never translates.

| Admin `adapter` | Bin                  | Provider                                                                   |
| --------------- | -------------------- | -------------------------------------------------------------------------- |
| `claude`        | `plane-acp-claude`   | Claude Agent SDK `query()`: Claude Code's built-in tools plus MCP          |
| `codex`         | `plane-acp-codex`    | `codex app-server` (the `codex` CLI must be on `PATH`)                     |
| `gemini`        | `plane-acp-gemini`   | `gemini --acp`, Gemini CLI 0.65.0 (the `gemini` CLI must be on `PATH`)     |
| `deepseek`      | `plane-acp-deepseek` | DeepSeek chat completions, with our own tool loop, tool set and MCP client |
| (tests only)    | `plane-acp-echo`     | Deterministic echo agent for bridge and conformance tests                  |

`ADAPTER_BINS` exports this mapping. Admins pick an adapter and never a command. The package also ships
`plane-agent-login` (`dist/bin/login.mjs`, `LOGIN_BIN`), the provider sign-in helper the runner drives for
ChatGPT and Google sign-ins (see [Sign-in helper](#sign-in-helper-plane-agent-login)).

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

The runner passes the agent's `env`: the admin config, with the provider credential the API resolved for the
user (personal, then workspace, then the admin's own) and `PLANE_AGENT_AUTH`. Credentials never reach the
tools the user drives: Claude runs with `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`, Codex threads get a
`shell_environment_policy` that excludes `*KEY*`/`*TOKEN*`/`*SECRET*`/`*PASSWORD*`/`*CREDENTIAL*`, Gemini CLI
runs with those names removed from its env (the key only travels in ACP `authenticate`), and DeepSeek's
shell and stdio MCP servers drop the same names.

| Variable                       | Adapter       | Meaning                                                                      |
| ------------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `PLANE_AGENT_MODEL`            | all           | Default model id (added to the model list if it is not already in it)        |
| `PLANE_AGENT_EFFORT`           | all           | Default reasoning effort, when the model takes that level                    |
| `PLANE_AGENT_DEFAULT_MODE`     | all           | Starting mode when the bridge sends none                                     |
| `PLANE_AGENT_AUTH`             | codex, gemini | `api_key`, `chatgpt` (codex) or `google_account` (gemini); see [Auth](#auth) |
| `ANTHROPIC_API_KEY`            | claude        | API key, or…                                                                 |
| `CLAUDE_CODE_OAUTH_TOKEN`      | claude        | …a Claude subscription token (if no member or workspace key applies)         |
| `OPENAI_API_KEY`               | codex         | API key; the app-server logs in with it on every start (separate home)       |
| `CODEX_HOME`                   | codex         | Overrides the Codex home of the mode (`~/.codex` or `~/.codex-api-key`)      |
| `GEMINI_API_KEY`               | gemini        | API key, handed to Gemini CLI in `authenticate`                              |
| `GOOGLE_GEMINI_BASE_URL`       | gemini        | Passed through: a Gemini API gateway (tests point it at a local fake)        |
| `PLANE_CODEX_STALL_TIMEOUT_MS` | codex         | Fail a turn after this long without app-server output (default 300000)       |
| `PLANE_CODEX_TURN_TIMEOUT_MS`  | codex         | Hard turn limit (default 1800000)                                            |
| `DEEPSEEK_API_KEY`             | deepseek      | Required                                                                     |
| `DEEPSEEK_BASE_URL`            | deepseek      | API base (default `https://api.deepseek.com`)                                |
| `DEEPSEEK_REASONING_EFFORT`    | deepseek      | Default `reasoning_effort` (`low`/`high`/`max`, else `high`)                 |
| `PLANE_AGENT_MAX_ITERATIONS`   | deepseek      | Model calls per prompt before stopping with `max_turn_requests` (default 50) |
| `PLANE_ACP_MAX_MESSAGE_BYTES`  | all           | Inbound frame limit (default 8 MiB)                                          |

Models: Claude defaults to `claude-opus-5-5` (also `claude-sonnet-5-5`, `claude-haiku-5-5` and
`claude-fable-5-1`). DeepSeek defaults to `deepseek-v4-pro` (also `deepseek-flash`). Codex lists whatever
the app-server's `model/list` returns.

Reasoning effort: a second `select` config option (`id: "effort"`, category `thought_level`), offered while the
session's model takes one. Claude offers `low` to `max` on every model (default `medium` on Opus 5.5 and Haiku
5.5, `high` otherwise, including an unlisted `PLANE_AGENT_MODEL`), Codex whatever `model/list` reports per model,
DeepSeek `low`/`high`/`max`. A session starts on, and a model switch falls back through: the remembered or current
effort, then `PLANE_AGENT_EFFORT`, then the model's default (`DEEPSEEK_REASONING_EFFORT` sets DeepSeek's), each
only if the model takes it. `session/new|load` accept the browser's
last choice in `_meta` (`plane/initialModel`, `plane/initialEffort`); levels a model does not take are ignored.

## Auth

`PLANE_AGENT_AUTH` says which credential the API put in the env. When it is absent, every adapter keeps its
original behaviour (the admin's env). Every auth error names **Workspace settings → AI providers**, where
users add an API key or sign in.

- **Claude**: API key only (`ANTHROPIC_API_KEY`, or an admin's `CLAUDE_CODE_OAUTH_TOKEN`). Apps built on the
  Claude Agent SDK may not offer claude.ai sign-in.
- **Codex**:
  - `chatgpt`: the ChatGPT sign-in in `CODEX_HOME` (default `~/.codex`, written by `plane-agent-login`).
    `account/read` must show a `chatgpt` account, else `authRequired` "ChatGPT is not connected. Sign in with
    ChatGPT in Workspace settings → AI providers." It never logs in with a key (`OPENAI_API_KEY` is removed
    from the app-server's env).
  - `api_key`, or unset with `OPENAI_API_KEY`: `CODEX_HOME` defaults to `~/.codex-api-key` (created 0700)
    and the adapter always sends `account/login/start {type: "apiKey"}` with the current key, so a changed key
    takes effect and a ChatGPT sign-in in `~/.codex` is never overwritten.
  - Neither: the admin's `CODEX_HOME` must already be signed in.
- **Gemini**: each method gets its own Gemini home, because Gemini CLI clears its cached Google credentials
  when `authenticate` names a method other than the home's `security.auth.selectedType`.
  - `google_account`: `GEMINI_CLI_HOME` unset, so Gemini uses `~/.gemini`. The adapter checks
    `~/.gemini/oauth_creds.json` first (without it Gemini CLI would start an interactive browser or stdin
    flow on the protocol streams) and fails with "Google account is not connected. Sign in with Google in
    Workspace settings → AI providers." It sets `selectedType: "oauth-personal"` in `~/.gemini/settings.json`
    before `authenticate {methodId: "oauth-personal"}` (60 s limit).
  - `api_key`, or unset with `GEMINI_API_KEY`: `GEMINI_CLI_HOME=~/.gemini-api-key` (created 0700, Gemini
    uses `~/.gemini-api-key/.gemini`), then `authenticate {methodId: "gemini-api-key", _meta: {"api-key"}}`.
  - Any other value, or no key: `authRequired` naming the settings page.

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
- **Gemini**: Gemini CLI stays in its own `default` approval mode (`set_mode` is never forwarded) and an
  admin policy makes every tool call reach the adapter as `session/request_permission`. The gate answers it:
  run, ask the browser with our three options, or deny, and the answer is mapped onto Gemini's option by
  `kind` (`allow_once` → `proceed_once`, deny → `cancel`, a cancelled turn → `outcome: cancelled`). Gemini's
  "always" options are never picked: "Always this session" is remembered by the gate, so a later mode change
  still applies. Categories come from the `kind` Gemini declares for its built-in tools (`read`, `search`,
  `fetch`, `think` are reads; `execute`, `edit`, `delete`, `move` and anything else ask). Plane MCP calls are
  found by their tool name (`mcp_<server>_<tool>`, from the `<tool>__<id>` call id) and classified like the
  others; the `action` is read from Gemini's title `tool(action: list, …)` and anything ambiguous counts as a
  mutation. Gemini's `available_commands_update` (its slash commands) is dropped, and a prompt starting with
  `/` or `$` gets a leading zero-width space so it reaches the model as text instead of running a Gemini
  command (`/extensions install`, `/restore`…) that no gate sees.
- **DeepSeek**: our own loop asks the gate before every tool and MCP call.

### Gemini CLI process

One `gemini --acp` per ACP session, its own process group (killed as a group on close), started as

```sh
gemini --acp --approval-mode default --extensions none \
  --admin-policy <package>/gemini/policies/plane.toml \
  --allowed-mcp-server-names <the session's MCP server names, or plane-acp-none>
```

with the agent env minus credential-looking names and Gemini's own steering variables (`GEMINI_CLI_HOME`,
`GOOGLE_GENAI_USE_*`, `GEMINI_SANDBOX`, `GEMINI_TELEMETRY_*`, `BROWSER`, `DISPLAY`…), plus
`GEMINI_CLI_NO_RELAUNCH=true`, `GEMINI_CLI_TRUST_WORKSPACE=true` (an untrusted folder connects no MCP
server), `GEMINI_TELEMETRY_ENABLED=false` and `GEMINI_CLI_SYSTEM_SETTINGS_PATH`. Files shipped in
`gemini/` (published with the package, nothing goes under `/etc`):

- `policies/plane.toml`: the admin policy (Admin tier, above user, workspace, extension and default rules).
  It hides `ask_user`, `enter_plan_mode`, `exit_plan_mode`, `get_internal_docs` and `invoke_agent` (no ACP
  equivalent, or they would change Gemini's approval mode or skip confirmation) and makes everything else
  `ask_user`, with `argsPattern = ".*"` so Gemini's shell heuristics cannot turn "known safe" commands into
  silent allows.
- `system-settings.api-key.json` / `system-settings.google-account.json`: fixes `selectedType`, the
  `default` approval mode, and turns off auto-update, telemetry, usage statistics, hooks, plan mode, "always
  allow" options, YOLO mode and local `.env` loading. Gemini CLI only reads a system settings file whose
  directory chain and file are owned by root and not group/other-writable: true in the runner image (the
  package is copied as root and `chmod -R go-w`), not in a developer checkout, where Gemini warns on stderr
  and skips it. The flags and env above carry everything the gate depends on either way.

Sessions: Gemini picks its own session ids, so `<gemini home>/.gemini/plane-acp-sessions.json` maps ours
to Gemini's for `session/load`. History is replayed from Gemini's stream (which starts before the load
response) until it is quiet for 250 ms, without Gemini's `<session_context>` and function-response turns.

### Gemini CLI 0.65.0, verified

Checked against the real bundle (`npm i @google/gemini-cli@0.65.0`), end to end with the
`tests/gemini.real.test.ts` setup (`gemini --acp` with a throwaway `HOME`, an empty `cwd`, a fake key and
`GOOGLE_GEMINI_BASE_URL` pointing at a local fake Gemini API that returns function calls) unless marked
_(source)_, which was read in the bundle.

- `initialize` → `authMethods` `oauth-personal`, `gemini-api-key` (`_meta["api-key"]`), `vertex-ai`,
  `gateway`; `agentCapabilities.loadSession: true`, `mcpCapabilities: {http: true, sse: true}`.
- `authenticate {methodId: "gemini-api-key", _meta: {"api-key": KEY}}` keeps the key in memory and writes
  `selectedType` to the home's `settings.json`. The key is sent as `x-goog-api-key`, to
  `GOOGLE_GEMINI_BASE_URL` when set. `oauth-personal` without cached credentials prints a user-code URL to
  stdout and reads the code from stdin (no `DISPLAY`), so the adapter never lets it get there and tolerates
  non-JSON stdout lines.
- `session/new` returns `modes` (`default`, `autoEdit`, `yolo`, plus `plan` unless disabled) and
  `models.availableModels[{modelId, name, description}]` with `currentModelId: "auto"`. `"auto"` first
  calls a classifier model. The model is changed with `session/set_model {sessionId, modelId}` (any id is
  accepted).
- Without a policy, Gemini runs reads and "known safe" shell commands (`ls`) with no permission request.
  `--admin-policy <file>` is honoured with no ownership check (it is ignored when `/etc/gemini-cli/policies`
  holds `.toml` files, _(source)_) and its `ask_user` rules win. Every tool call then sends a `tool_call` (`status:
"pending"`) and `session/request_permission` with options `proceed_always` (`allow_always`, for exec/edit/
  info), `proceed_always_server` / `proceed_always_tool` (MCP), `proceed_once` (`allow_once`) and `cancel`
  (`reject_once`); the outcome `cancelled` counts as a rejection. Tool call ids are `<tool name>__<id>`;
  MCP tools are `mcp_<server>_<tool>` with `kind: "other"` and title `tool(arg: value, …)`; the permission
  request carries no `_meta` and no raw input.
- In ACP mode the workspace must be trusted for MCP servers to connect (folder trust is on by default in
  0.65.0); `GEMINI_CLI_TRUST_WORKSPACE=true` trusts it for the process. HTTP MCP servers get the ACP headers.
- `session/cancel` aborts the turn and the prompt answers `stopReason: "cancelled"`; a permission request
  that is open stays open until answered _(source)_. Model errors come back as JSON-RPC errors whose code is
  the HTTP status, e.g. 401 _(source)_.
- `session/load {sessionId, cwd, mcpServers}` finds sessions per project under the home's `.gemini/tmp`,
  sends the first history update before its response and the rest after, and answers unknown ids with
  `-32603` "Invalid session identifier".
- A prompt starting with `/` runs a Gemini command (`/about`, `/memory`, `/extensions`, `/restore`, `/init`)
  without the model.
- Gemini CLI writes logs to stderr even when healthy; the adapter keeps a tail for error messages only.

## Sign-in helper (`plane-agent-login`)

`node dist/bin/login.mjs <codex|gemini> <start|logout|status>`, run by the runner as the user's uid with
`HOME` = the user's home and `cwd` = the workspace dir. It writes newline-delimited JSON events to stdout
(logs go to stderr) and reads JSON lines on stdin.

| Command        | Events                                                                                                                                                        | Exit  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `codex start`  | `{"event":"pending","verificationUrl","userCode","needsCode":false}`, then `{"event":"connected","account":{"email","plan"}}` or `{"event":"failed","error"}` | 0 / 1 |
| `gemini start` | `{"event":"pending","verificationUrl","needsCode":true}`, then (after one stdin line `{"code":"…"}`) `connected` with `{"email"}` or `failed`                 | 0 / 1 |
| `<p> logout`   | `{"event":"disconnected"}`                                                                                                                                    | 0     |
| `<p> status`   | `{"event":"status","connected":true,"account":{…}}` or `{"event":"status","connected":false}`                                                                 | 0     |

Bad arguments answer `failed` with exit code 2.

- **Codex**: `codex app-server` with `CODEX_HOME=~/.codex` (created 0700, `OPENAI_API_KEY` removed),
  `initialize`, then `account/login/start {type: "chatgptDeviceCode"}` → `{loginId, verificationUrl,
userCode}`. It waits for `account/login/completed` for that `loginId` (15 min), then `account/read` must
  show a `chatgpt` account. SIGTERM (or the timeout) sends `account/login/cancel {loginId}` and ends with
  `failed`. `logout` removes `~/.codex/auth.json`; `status` asks the app-server when that file exists.
- **Gemini**: PKCE (S256) and a random `state`, with Gemini CLI's own OAuth client and scopes. The client id
  and its (public, installed-app) secret are read from the bundle of the `gemini` on `PATH` at sign-in time,
  never copied into this repo, so they always match the pinned CLI; `redirect_uri=https://codeassist.google.com/authcode`, `access_type=offline` and
  `prompt=consent`. The user signs in, copies the code Google shows and the web app sends it as `{"code"}`
  (a pasted redirect URL works too; its `state` must match). The code is exchanged at Google's token
  endpoint, then `~/.gemini/oauth_creds.json` (0600, `access_token`, `refresh_token`, `scope`,
  `token_type`, `id_token`, `expiry_date`) is written, `security.auth.selectedType = "oauth-personal"` is
  merged into `~/.gemini/settings.json`, and the userinfo email goes to `~/.gemini/google_accounts.json`
  `{active, old: []}`. A rejected code fails without writing anything; the wait is 10 min. `logout` removes
  both files and drops `selectedType`. `PLANE_GEMINI_OAUTH_TOKEN_URL` / `PLANE_GEMINI_USERINFO_URL`
  override the endpoints and `PLANE_GEMINI_OAUTH_CLIENT_ID` / `PLANE_GEMINI_OAUTH_CLIENT_SECRET` the client,
  in tests.

## Conformance

The discipline is ported from employai_v2's `acp/employai-acp`:

- `acp-version.lock.json` pins the SDK release (version, integrity, git head), the wire protocol, the v1
  schema hash, the provider CLIs (`codex-cli`, `gemini-cli`, which must equal `GEMINI_CLI_VERSION`) and the
  golden corpus hash. `tests/acp-version.test.ts` fails when any of them drift.
- `tests/golden/` holds transcripts compared frame by frame (`valid/`, `malformed/`, `transport/`):
  - Pipe cases feed raw bytes to a spawned bin.
  - Script cases drive an interactive session.
  - Every input and expected file is pinned by hash in `manifest.json`.
  - stdout must be JSON-RPC 2.0 only, and a session's `session/new` response must come before its updates.
  - Re-record with `UPDATE_GOLDEN=1 pnpm test`, review the diff, bump `corpus_version` in the manifest, then
    update `corpus.sha256` in the lock.
- Transport rules:
  - Frames queued behind `initialize` wait for its response.
  - EOF drains in-flight requests before exit.
  - An over-limit or non-UTF-8 frame is answered with one `-32600` and exit code 1.
  - SIGINT and SIGTERM exit within 1.5 s.
  - `console.log` goes to stderr.
- `messageId`s are deterministic (`m<turn>-<n>`). Tool calls keep their provider ids.

Tests run with no network and no credentials:

- Codex runs against a fake `codex app-server` placed on `PATH`.
- Gemini runs against a fake `gemini --acp` placed on `PATH` (`tests/helpers/fake-gemini.cjs`, shaped like
  0.65.0's wire). `tests/gemini.real.test.ts` runs the real CLI against a local fake Gemini API and is
  skipped unless `PLANE_GEMINI_CLI` points at its `bundle/gemini.js`.
- The sign-in helper runs against the fake app-server and a local OAuth token/userinfo server.
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
