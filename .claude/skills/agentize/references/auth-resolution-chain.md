# Auth Resolution Chain

One chain, used by both CLI and MCP-stdio. MCP-HTTP/SSE uses bearer tokens at transport layer, but tools may still need per-request values pulled from the chain.

## Resolution chain (first hit wins)

1. **Explicit flag** — `--api-key <v>`, `--token <v>`, etc. Never logged, never echoed.
2. **Process env vars** — convention: `<TOOL>_<KEY>` (e.g. `ACME_API_KEY`).
3. **dotenv files**, in this order:
   - `.env.local` (git-ignored, highest priority)
   - `.env.<NODE_ENV>` (e.g. `.env.production`)
   - `.env`
     Search starts in CWD and walks up to the nearest package root or repo root.
4. **User config JSON**:
   - Linux/macOS: `$XDG_CONFIG_HOME/<tool>/config.json` or `~/.config/<tool>/config.json`
   - Windows: `%APPDATA%\<tool>\config.json`
5. **Project config JSON**: `./.<tool>rc.json` or `./<tool>.config.json` in CWD.
6. **OS keychain** via `keytar` — stored by the `login` command:
   - macOS Keychain, Windows Credential Vault, libsecret on Linux
   - Service name: `<tool>`, account = profile name

Document the chain in `docs/cli.md`. `doctor` command reports which layer supplied each value without revealing the value itself.

## Config file shape

```json
{
  "$schema": "https://<tool>.dev/schema/config.json",
  "profiles": {
    "default": {
      "apiKey": "env:ACME_API_KEY",
      "baseUrl": "https://api.acme.dev",
      "timeoutMs": 30000
    },
    "staging": {
      "apiKey": "keychain:acme/staging",
      "baseUrl": "https://staging.api.acme.dev"
    }
  },
  "activeProfile": "default"
}
```

Resolver supports indirection:

- `env:NAME` → read from process env
- `keychain:<service>/<account>` → read from OS keychain
- `file:/absolute/path` → read file contents (for mounted files)
- plain string → literal value

## `login` and `logout`

```
<tool> login [--profile <name>]
<tool> logout [--profile <name>]
```

`login` prompts interactively, writes to OS keychain, updates `activeProfile`. Never writes the value to a config file on disk unless the user passes `--save-plaintext` (explicit, discouraged).

## Redaction

- Log redactor masks anything that looks sensitive: long entropy strings, `*key*`, `*token*`, `Authorization:` headers.
- JSON output of `doctor`:

```json
{
  "apiKey": { "resolved": true, "source": "keychain:acme/default" },
  "baseUrl": { "resolved": true, "source": "config:~/.config/acme/config.json", "value": "https://api.acme.dev" }
}
```

Sensitive entries have `resolved` + `source` but never `value`. Non-sensitive config includes `value`.

## Precedence rules

- A value present at a higher layer fully overrides lower layers (no merging per-field for scalars).
- Structured config objects merge shallowly: later layers replace keys they define.
- `--profile <name>` selects the active profile before resolution runs; env-only values still win over profile values.

## MCP-HTTP context

Tools receive a per-request `ctx.auth` built by the transport's auth handler. Inside tool handlers:

```ts
const resolved = await resolveAuth({ token: ctx.auth.token, profile: ctx.auth.profile });
```

`resolveAuth` uses the same chain, but layer 1 is the transport-provided token instead of a CLI flag. Layer 6 (keychain) is disabled in non-local deployments.

## Anti-patterns

- Storing API keys in plain JSON by default.
- Logging full request/response bodies.
- `postinstall` scripts that touch the keychain.
- Baking values into Docker images.
- Reading `.env` from unbounded parent directories (limit to package/repo root).
