# Architecture: why this skill works the way it does

## The single-process multi-profile reality

When Chrome is launched normally on macOS/Linux/Windows, it starts one OS process per `user-data-dir`. All profiles inside that user-data-dir (`Default/`, `Profile 1/`, `Profile 17/`, etc.) share the same process; opening a "new profile window" from the UI does NOT spawn a new Chrome process — it opens a new top-level window owned by the same browser process, bound to a different internal `BrowserContext`.

A consequence: when `chrome-devtools-mcp` attaches via the Chrome DevTools Protocol (CDP), it sees the **entire browser** including every profile window. Targets across profiles appear in one flat list. CDP exposes `browserContextId` per target, but `chrome-devtools-mcp` currently does not surface it in `list_pages`. So from the MCP's outside-the-process view, profiles are invisible by default.

## The SingletonLock IPC primitive

Each user-data-dir has a `SingletonLock` symlink whose target is `<hostname>-<pid>` of the Chrome process that owns it. When you run

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --profile-directory="Profile 17" "https://example.com"
```

…and a Chrome instance with that user-data-dir is already running, the second `Chrome` binary:

1. Reads `SingletonLock` from the user-data-dir.
2. Confirms the referenced PID is alive and is Chrome.
3. Connects to a known Mach port (macOS) or Unix socket / named pipe (Linux/Windows) that the running Chrome listens on.
4. Sends a "please open this URL in profile X" message to the running Chrome.
5. Exits immediately.

The running Chrome receives the message and creates a new tab in `Profile 17`. That tab shows up in `Target.getTargets()` over the same CDP WebSocket the MCP is using.

**This is the only documented public mechanism for cross-profile addressing in a running Chrome.** There is no CDP command that takes a profile path and creates a target there.

## Why the URL fragment matters

Without an anchor, after `chrome-profile cognition https://x` the agent only knows "a new tab in Cognition exists somewhere." `list_pages` returns all tabs. Race conditions (e.g. the user opens another tab manually in the same moment) make "find the newest tab" unreliable.

The `#cdp-profile=<key>` fragment is:

- **Client-only** — never sent in HTTP requests, never logged by upstream servers.
- **Deterministic** — the agent matches `url.includes("cdp-profile=<key>")` with zero ambiguity for that operation.
- **Unique per `chrome-profile` invocation** — even repeated calls in the same profile produce identical fragments, so the agent should pick the most recently opened match (highest pageId).

## Why copy-profile (rsync to /tmp) does NOT work on macOS

Empirically verified (a profile with ~1300 cookies copied to a temp dir):

1. `Cookies` SQLite copies fine: byte-identical between source and copy.
2. Cookie values are encrypted with `v10` (macOS Keychain key, accessed via Chrome's keychain item `Chrome Safe Storage`).
3. When Chrome relaunches against the copied profile, every cookie returns with `value` empty — decryption fails silently.
4. Likely cause: a profile-local integrity check inside Chrome's `OSCrypt`, or a per-profile salt that is bound to the original user-data-dir path.

Whatever the exact cause, the outcome is reproducible: cookies, saved passwords, and "stay signed in" state do not survive a copy. The only way to keep those is to keep using the original user-data-dir, which means staying inside the original Chrome process.

## Why multi-process / multi-MCP-server is unnecessary for the stated goal

A natural-sounding architecture is: one Chrome process per automation profile, each on its own debug port, each with its own MCP server in `mcp.json`. This works, but:

- It abandons the user's already-logged-in profiles (cookies don't migrate).
- It requires a one-time re-login per profile.
- It runs N Chrome processes alongside the user's daily Chrome.
- It complicates `mcp.json`.

The single-process + URL-anchor pattern in this skill gives equivalent determinism without any of those costs, because it works WITH Chrome's existing IPC instead of around it.

The multi-process pattern is still appropriate for:

- Pure-background automation where no human ever opens the Chrome window.
- True parallel automation that needs process-level isolation.
- Profiles you do NOT want loaded in your daily Chrome.

Those are different use cases.

## Why `chrome-devtools-mcp` config cannot pre-pin a profile

The MCP supports `--chromeArg='--profile-directory=Profile 17'`, but this flag only applies when the MCP launches Chrome itself. If the user's daily Chrome is already running on the same user-data-dir (the typical state), the second Chrome binary detects `SingletonLock` and routes the request to the existing process via IPC — and the existing Chrome ignores the new `--chromeArg` payload because it already has its own configuration. The MCP server still attaches successfully but cannot influence which profile its tools target.

Conclusion: profile selection has to happen at the **per-call layer**, not the MCP-server layer.

## Cross-OS variations (informational)

| Concern           | macOS                                                          | Linux                            | Windows                                               |
| ----------------- | -------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| Chrome binary     | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | `google-chrome` on PATH          | `%ProgramFiles%\Google\Chrome\Application\chrome.exe` |
| user-data-dir     | `~/Library/Application Support/Google/Chrome`                  | `~/.config/google-chrome`        | `%LOCALAPPDATA%\Google\Chrome\User Data`              |
| IPC transport     | Mach port                                                      | Unix domain socket               | Named pipe                                            |
| Cookie encryption | macOS Keychain (v10)                                           | Linux libsecret/kwallet (v10/11) | Windows DPAPI + App-Bound (v10/v20)                   |

The skill's Python CLI abstracts all four columns. The `--profile-directory` IPC works on all three OSes because Chromium's `ProcessSingleton` implements the platform-appropriate transport.
