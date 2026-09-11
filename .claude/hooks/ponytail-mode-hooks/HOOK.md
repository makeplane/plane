---
name: ponytail-mode-hooks
description: Always-on "lazy senior dev" mode — injects the ponytail YAGNI ladder into context on SessionStart/UserPromptSubmit/SubagentStart, without installing the rest of the ponytail plugin suite.
---

# ponytail-mode-hooks

Makes the `ponytail` ladder (YAGNI-first, stdlib-before-custom-code minimalism)
active on every turn automatically, the way the full marketplace plugin does —
without requiring the marketplace install or any other ponytail package.

Three Node hooks, self-contained:

| Hook | Event | Purpose |
|------|-------|---------|
| `ponytail-activate.js` | `SessionStart` | Writes the mode flag and emits the ladder as hidden context at session start. |
| `ponytail-mode-tracker.js` | `UserPromptSubmit` | Detects `/ponytail [lite\|full\|ultra\|off]` or "stop ponytail"/"normal mode" and updates the mode flag mid-session. |
| `ponytail-subagent.js` | `SubagentStart` | Re-injects the ladder into spawned subagents — `SessionStart` context is parent-thread-only and never reaches `Task`-spawned agents otherwise. |

Plus two small shared modules (`ponytail-config.js`, `ponytail-runtime.js`) and
`ponytail-instructions.js`, which ships its **own complete copy** of the
ladder text rather than reading the `ponytail` skill's `SKILL.md` by relative
path — that's the one deliberate change from upstream, so this package has
zero dependency on the `ponytail` skill (or any other ponytail package) being
installed alongside it.

## Deploy

1. Copy all 6 `.js` files in this package to `.claude/hooks/ponytail-mode-hooks/`
2. Merge `hook.json` into `.claude/settings.json` under `hooks`
3. Requires Node.js on PATH (the hooks run via `node`)

## hook.json entry

```json
{
  "SessionStart": [
    {
      "matcher": "startup|resume|clear|compact",
      "hooks": [{ "type": "command", "command": "node .claude/hooks/ponytail-mode-hooks/ponytail-activate.js", "timeout": 5 }]
    }
  ],
  "UserPromptSubmit": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/ponytail-mode-hooks/ponytail-mode-tracker.js", "timeout": 5 }]
    }
  ],
  "SubagentStart": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/ponytail-mode-hooks/ponytail-subagent.js", "timeout": 5 }]
    }
  ]
}
```

## Configuration

Same resolution order as upstream: `PONYTAIL_DEFAULT_MODE` env var →
`~/.config/ponytail/config.json` (`{"defaultMode": "lite"}`) → `full`.

## Deactivate

Say "stop ponytail" or "normal mode" mid-session, or set `PONYTAIL_DEFAULT_MODE=off`.

## Without these hooks

The standalone `ponytail` skill (also in this Arsenal) still works without
this hook package — it just activates via Claude Code's normal skill-matching
instead of being forced into context every turn. Add this hook package only
if you want the always-on behavior.

## Dropped from upstream (by design)

The original `ponytail-activate.js` also nudges the user to configure a
statusline badge showing the active mode, reading two more bundled scripts
(`ponytail-statusline.sh` / `.ps1`) to do so. That's pure UI sugar and would
have reintroduced a multi-file dependency this package exists to avoid — it's
intentionally not included here. Pull it from upstream directly if wanted.

## Known operational behavior (carried over, not a regression)

`ponytail-activate.js` and `ponytail-mode-tracker.js` write a small state flag
to `$CLAUDE_CONFIG_DIR` (defaults to `~/.claude/.ponytail-active`) and, if you
change the default mode via config file, to `~/.config/ponytail/config.json`
(or the platform equivalent). This is the same behavior as the upstream
plugin and the existing `library/plugin/ponytail/` catalog entry — see that
entry's `_arsenal.yml` for the accepted CRITICAL "writes outside project"
flag and the reasoning for accepting it.
