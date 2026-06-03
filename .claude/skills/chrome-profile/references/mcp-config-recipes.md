# MCP Bridge Recipes — making `chrome-profile` tabs readable by an agent

`chrome-profile <key> <url>` opens a tab in the named profile of your daily Chrome. To make the opened tab readable by Claude Code, an MCP must be attached to **that same Chrome process**. This file lists the two supported bridges and how to configure each.

Run `chrome-profile doctor` first — it tells you which bridge (if any) is currently active.

---

## Recipe 1 — `claude-in-chrome` extension (RECOMMENDED for daily Chrome)

**Why:** No Chrome relaunch. Survives reboots. Works with multiple profiles. The extension binds `127.0.0.1:9222` for its own protocol (this is why kai's `:9222` looks "squatted" — it's actually claude-in-chrome doing its job).

### Install

1. In your daily Chrome, open https://claude.ai/chrome and install the extension.
2. Sign in with the same Anthropic account you use in Claude Code.
3. In `~/.claude.json` (project or user scope), make sure `claude-in-chrome` MCP entry exists:
   ```jsonc
   "mcpServers": {
     "claude-in-chrome": {
       "type": "sse",
       "url": "https://claude.ai/api/organizations/.../mcp-bridge"
       // (Claude Code adds this automatically when you sign into the extension —
       //  no manual edit needed in practice.)
     }
   }
   ```
4. Restart Claude Code session so the MCP loads.

### Verify

```bash
chrome-profile doctor
# Expected: bridge=claude_in_chrome, ok=true
```

In Claude Code:

- `mcp__claude-in-chrome__tabs_context_mcp` returns daily-Chrome tab list.
- `mcp__claude-in-chrome__read_page` / `get_page_text` reads tab content.

### Limits

- Extension-side install is required per profile that needs to be readable. If you only sign in on profile A, tabs in profile B aren't visible to the agent (yet).
- Couples to claude.ai sign-in state. If you sign out in the browser, the bridge stops working until you re-sign-in.

---

## Recipe 2 — `chrome-devtools-mcp --browserUrl` attach (for scripted/headless)

**Why:** Pure CDP. Works without any Anthropic browser extension. Useful for CI, headless servers, or when you don't want claude-in-chrome installed.

**Trade-off:** Requires relaunching daily Chrome with `--remote-debugging-port=9222`. **Closes all open tabs** unless session restore catches them. Genuinely costly if you have live work in tabs.

### One-time setup

```bash
# 1. Fully quit daily Chrome (Cmd-Q is NOT enough; this guarantees no helper survives):
osascript -e 'quit app "Google Chrome"'
sleep 3

# 2. Confirm nothing is holding :9222 (e.g. an old claude-in-chrome). If something is
#    listening, switch to Recipe 1 instead — recipes don't combine.
lsof -nP -iTCP:9222 -sTCP:LISTEN
# Expected: no output.

# 3. Relaunch daily Chrome with CDP enabled:
open -na "Google Chrome" --args \
  --remote-debugging-port=9222 \
  --remote-allow-origins=*

# 4. Verify the endpoint is real CDP (not a squatter):
curl -s http://127.0.0.1:9222/json/version
# Expected: JSON containing "Browser" and "webSocketDebuggerUrl".
```

### Wire the MCP

Edit `~/.claude.json` for the relevant project (or user scope), replace any existing `chrome-devtools` entry with:

```jsonc
"mcpServers": {
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
  }
}
```

Restart Claude Code session.

### Verify

```bash
chrome-profile doctor
# Expected: bridge=chrome_devtools_mcp_attached, ok=true,
#           chrome_devtools_mcp.browser_url_configured=http://127.0.0.1:9222
```

In Claude Code:

- `mcp__chrome-devtools__list_pages` returns daily-Chrome tabs (across all profiles).
- `mcp__chrome-devtools__select_page` + `evaluate_script`/`take_snapshot` read the tab.

### Do not confuse an open `:9222` with CDP

`lsof` showing Chrome on `127.0.0.1:9222` is not enough. The endpoint is usable
for `chrome-devtools-mcp --browserUrl` only when this returns HTTP 200 JSON with
`Browser` and `webSocketDebuggerUrl`:

```bash
curl -sS -D - --max-time 3 http://127.0.0.1:9222/json/version
```

If it returns `HTTP/1.1 404 Not Found`, remove the static `--browserUrl` MCP
config and use auto-connect instead:

```bash
claude mcp remove chrome-devtools -s user
claude mcp add -s user chrome-devtools npx -- -y chrome-devtools-mcp@latest --autoConnect --channel=stable
```

Then restart the agent session and approve Chrome's remote-debugging prompt on
that same machine.

### Rule out Tailscale or SSH leakage

Run these from the machine where the agent is running:

```bash
lsof -nP -iTCP:9222
tailscale serve status
tailscale funnel status
nc -G 2 -vz "$(tailscale ip -4)" 9222
nc -G 2 -vz <other-machine-tailnet-ip> 9222
ps -axww -o pid=,ppid=,command= | rg 'ssh .*-[LDR]|ssh .*9222|chrome-devtools-mcp'
```

Interpretation:

- `127.0.0.1:9222` listening but the tailnet IP refuses `:9222` means the port is
  local-only, not published through Tailscale.
- `No serve config` and `No funnel config` mean Tailscale is not publishing it.
- A debug prompt on another Mac means an MCP/agent running on that Mac asked its
  own Chrome for access, unless an SSH `-L`/`-R` process explicitly forwards
  `9222`.
- VS Code Remote SSH commonly uses `ssh -D <port>` SOCKS forwarding; that is not
  a `9222` leak by itself.

### Why this can't be combined with Recipe 1

Both bridges want `:9222`. The claude-in-chrome extension binds that port from inside Chrome before CDP gets a chance. Pick one.

---

## Recipe 3 — None (skip browser automation)

If neither recipe is set up, `chrome-profile <key> <url>` will **refuse** to open the tab by default (the agent would launch a tab no MCP can see — a confusing footgun). Override with `--force` if you just want the tab open for yourself:

```bash
chrome-profile personal https://example.com --force   # open anyway, no agent read-back
```

The skill's `cmd_open` runs `doctor` before launching. If `doctor` returns `ok=false` and `--force` is not passed, the command exits non-zero with the same remediation hints printed above.

---

## Quick decision matrix

| Your situation                                                   | Recipe                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Daily Chrome with live work, multi-profile, agent must read tabs | **Recipe 1 (claude-in-chrome)**                                                  |
| Fresh Chrome / CI / scripted, willing to relaunch                | **Recipe 2 (chrome-devtools-mcp --browserUrl)**                                  |
| Just want tab visible to yourself, no agent read                 | `chrome-profile <key> <url> --force`                                             |
| Unsure                                                           | Run `chrome-profile doctor` first; it tells you which bridge (if any) is active. |

---

## Cross-references

- `../SKILL.md` — top-level skill doc, "Bridge required" section
- `https://claude.ai/chrome` — claude-in-chrome extension landing page
- `https://github.com/ChromeDevTools/chrome-devtools-mcp` — chrome-devtools-mcp upstream
