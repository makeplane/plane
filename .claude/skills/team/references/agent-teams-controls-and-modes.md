# Agent Teams -- Controls, Display Modes & Task Management

> **Source:** https://code.claude.com/docs/en/agent-teams
> **Version captured:** Claude Code v2.1.80 (March 2026)

## Display Modes

- **In-process** (default fallback): all teammates in one terminal. `Shift+Up/Down` to navigate. Works in any terminal.
- **Split panes**: each teammate gets own pane. Requires tmux or iTerm2.

Default is `"auto"` -- uses split panes if already inside a tmux session, otherwise in-process. The `"tmux"` setting enables split-pane mode and auto-detects tmux vs iTerm2.

```json
{ "teammateMode": "in-process" }
```

Per-session override: `claude --teammate-mode in-process`

Split panes NOT supported in: VS Code terminal, Windows Terminal, Ghostty.

**tmux setup:** install via system package manager.
**iTerm2 setup:** install `it2` CLI, enable Python API in iTerm2 > Settings > General > Magic.

## Model Requirements

All Agent Team teammates must run **Opus 4.6** -- this is a hard constraint. Mixed-model teams (e.g., Sonnet for devs, Haiku for testers) are NOT supported within Agent Teams.

For mixed-model workflows, use **subagents** instead (the `Agent` tool supports `model: "haiku" | "sonnet" | "opus"` per spawn).

## Plan Approval

Require teammates to plan before implementing:

```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

**Flow:**
1. Teammate works in read-only plan mode
2. Teammate finishes planning -> sends `plan_approval_request` to lead
3. Lead reviews -> approves via `SendMessage(type: "plan_approval_response", approve: true)`
4. If rejected: teammate stays in plan mode, revises based on feedback, resubmits
5. Once approved: teammate exits plan mode, begins implementation

**Influence criteria:** "only approve plans that include test coverage" or "reject plans that modify the database schema"

## Delegate Mode

Restricts lead to coordination-only tools: spawning, messaging, shutting down teammates, and managing tasks. No code editing.

Useful when lead should focus entirely on orchestration -- breaking down work, assigning tasks, synthesizing results.

**Enable:** Press `Shift+Tab` after team creation to cycle into delegate mode.

## Direct Teammate Interaction

- **In-process**: `Shift+Up/Down` select teammate, type to message. `Enter` view session. `Escape` interrupt current turn. `Ctrl+T` toggle task list.
- **Split panes**: click into pane to interact directly. Each teammate has full terminal view.

## Task Assignment & Claiming

Three states: **pending** -> **in_progress** -> **completed**. Tasks can have dependencies -- blocked until dependencies resolve.

- **Lead assigns**: tell lead which task -> which teammate
- **Self-claim**: after finishing, teammate picks next unassigned, unblocked task automatically
- **Auto-unblock**: completing a blocking task automatically unblocks dependents

File locking prevents race conditions on simultaneous claiming.

## Worktree Isolation for Implementation

When spawning developer teammates, use `isolation: "worktree"` on the Agent tool:

```
Agent(
  subagent_type: "fullstack-developer",
  model: "opus",
  isolation: "worktree",
  run_in_background: true,
  prompt: "Implement auth module..."
)
```

Each dev gets own worktree + branch. No file conflicts during parallel work. Lead merges branches after all devs complete.

**When to use:** Always for cook/implementation templates. Not needed for research/review (read-only).

## Background Spawning

Use `run_in_background: true` on the Agent tool to spawn teammates non-blocking:

- Lead continues orchestration while teammates work
- Automatic notification when teammate completes
- No polling needed -- TaskCompleted hook fires on completion
- Use TaskList as fallback if no events in 60s

## Shutdown

```
Ask the researcher teammate to shut down
```

Teammate can approve (exit) or reject with explanation. Teammates finish current request/tool call before shutting down -- can be slow.

## Cleanup

After all teammates shut down, call `TeamDelete` (no parameters). Fails if active teammates still exist.

Removes shared team resources (`~/.claude/teams/` and `~/.claude/tasks/` entries).

## Hook-Based Orchestration

### Event-Driven Monitoring

Instead of polling TaskList, lead receives automatic context injection:

- **TaskCompleted** -- fires when any teammate completes a task. Lead gets progress counts.
- **TeammateIdle** -- fires when teammate turn ends. Lead gets available task info.

### Recommended Pattern

1. Lead creates tasks and spawns teammates (with `run_in_background: true`)
2. TaskCompleted hook notifies lead as tasks finish (progress: N/M)
3. TeammateIdle hook suggests reassignment or shutdown
4. Lead acts on suggestions (spawn tester, shut down, reassign)
5. Fallback: Check TaskList manually if no events received in 60s

This replaces the "poll TaskList every 30s" pattern with reactive orchestration.
