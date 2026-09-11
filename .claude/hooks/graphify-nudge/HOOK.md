# graphify-nudge — PreToolUse hook

Nudges Claude to orient via the project's graphify knowledge graph instead of
broad grepping / file-by-file reading. **Never blocks** — it only injects
`additionalContext` when all of these hold:

- `graphify-out/graph.json` exists in the project root (no graph → no-op), and
- the tool call is a search-shaped Bash command (`grep|rg|ripgrep|ack|ag|fd|
  find|Select-String`), or a Read/Glob/Grep targeting a source/doc file
  outside `graphify-out/` (reading the graph's own report never triggers it —
  no feedback loop).

Every failure path exits 0 silently (fail open); malformed input, missing
fields, JSON errors — a legitimate tool call always proceeds.

## Why this exists instead of graphify's own installer

Upstream `graphify claude install` writes a POSIX-shell + `python3` hook
(broken on Windows) — and its "portable" `graphify hook-check` variant is a
verified no-op (`sys.exit(0)` in v0.9.5 `__main__.py`). This item is the
vetted, Windows-native (Node) replacement we control. Approved as a standing
default per gstack-v2 decision #17; upstream installers remain forbidden.

## Deploy

Standard hook item: `hook.json` merges into the project's
`.claude/settings.json`; `graphify-nudge.js` is copied to `.claude/hooks/`.
Pair with: `graphify` skill (query guidance) + a one-time `graphify extract .`
in the repo (see `library/plugins/graphify/PLUGIN.md` runbook). Without the
extract (no graph.json) the hook is inert by design.

## Testing

Verified 2026-07-03 on all paths: Bash-grep nudge, Read-source nudge,
graphify-out read suppressed, non-search Bash silent, garbage input fail-open
(exit 0). Beware PS 5.1 piping adds a BOM to stdin in manual tests — handled
via `trim()`.
