---
name: secrets-guard
description: PreToolUse hook that blocks Claude from reading/editing/writing credential and secret files (.env, SSH keys, AWS credentials, .pem/.key files, etc.), with a two-tier response - hard deny for definite matches, ask-for-confirmation for heuristic filename matches.
---

# secrets-guard

A PreToolUse hook that guards against Claude accidentally reading, editing, or writing files that hold credentials or secrets. When Claude calls `Read`, `Edit`, `Write`, or `NotebookEdit` on a matching file, the hook either hard-blocks the call or defers to the user for confirmation, depending on how confident the match is.

## What it does

Extracts the target file path from `tool_input` (`file_path` for Read/Edit/Write, `notebook_path` for NotebookEdit) and checks it against two tiers of patterns.

### Tier 1 -- hard deny, no override

- `.env` or `.env.*` (e.g. `.env.local`, `.env.production`) -- except `.env.example`, `.env.sample`, `.env.template`, which are explicitly allowed through
- Path contains a `.ssh/` directory anywhere
- Path contains a `.aws/` directory anywhere
- Basename is exactly `.claude.json` (home-level OAuth/session token file) -- `.claude/settings.json` is NOT blocked, it legitimately needs editing
- Extension is `.pem`, `.key`, or `.pfx`
- Basename (no extension) is `id_rsa`, `id_ed25519`, `id_ecdsa`, or `id_dsa`

Returns `permissionDecision: "deny"` with a reason naming the matched pattern.

### Tier 2 -- ask for confirmation

- Basename contains `credentials` (case-insensitive)
- Basename contains `secrets` (case-insensitive)

Returns `permissionDecision: "ask"` with a reason noting this is a heuristic match that could be a false positive (e.g. `credentials-schema.md`).

### Otherwise

Returns `permissionDecision: "allow"`.

## Deploy

The install script:
1. Merges `hook.json` into `.claude/settings.json` under `hooks.PreToolUse`
2. Copies `secrets-guard.ps1` to `.claude/hooks/secrets-guard.ps1` in the target project

The `.claude/hooks/` directory must exist in the target project.

## Notes

Pure PowerShell, no dependencies, reads stdin JSON via `$input`.
