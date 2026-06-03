---
name: ck:watzup
description: "Generate short handoff reports from Git branches, remote refs, worktrees, and unfinished plans. Use when the user asks what's in flight, wants progress/next steps, is in a fresh worktree or detached checkout, or needs end-of-session status."
user-invocable: true
when_to_use: "Invoke for end-of-session handoffs, progress summaries, cross-branch worktree status, unfinished plan discovery, and next-step recommendations."
category: utilities
keywords: [session, wrap-up, changes, review, worktree, branches, plans]
metadata:
  author: claudekit
  version: "1.1.0"
---

# Wrap Up

Create a short, evidence-backed handoff report for the active project.

This skill handles status and handoff reporting only. It does not implement, edit, commit, checkout, merge, push, or fetch unless the user explicitly requests fresh remote refs.

## Required Scan

Run the scanner first from the project root:

```bash
node .claude/skills/watzup/scripts/watzup-scan.cjs --json
```

Use `--fetch` only when the user asks to refresh remotes before the report:

```bash
node .claude/skills/watzup/scripts/watzup-scan.cjs --json --fetch
```

When developing from this source repository before install, use `node claude/skills/watzup/scripts/watzup-scan.cjs --json` only if `.claude/skills/...` is not present.

Default behavior:

- Scan local branches and remote branch refs.
- Scan registered worktrees.
- Scan unfinished plans from visible worktrees and tracked branch refs.
- Do not run network operations.
- Do not change branches or mutate the checkout.

## Report Format

Keep output brief. Prefer this structure:

1. **Current State** - branch or detached HEAD, dirty/clean, active worktree.
2. **Recent Work** - only the highest-signal branches/worktrees.
3. **In-Flight Plans** - unfinished plans only.
4. **Next Steps** - 3 to 5 ordered actions.
5. **Warnings** - scanner failures, stale remote-ref caveat, detached HEAD.

If the scanner fails, say it failed and include the error. Then use minimal read-only fallback commands:

```bash
git status --short --branch
git worktree list --porcelain
git for-each-ref --format='%(refname:short) %(committerdate:iso8601) %(objectname:short) %(subject)' refs/heads refs/remotes
find plans -maxdepth 2 -name plan.md -print
```

Do not pretend the full scan completed when fallback was used.
