---
name: ck:kanban
description: "AI agent orchestration board for task visualization and team coordination."
argument-hint: "[dir]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Plans Dashboard

Plans dashboard with progress tracking and timeline visualization.

## Usage

- `/ck:kanban` - View dashboard for ./plans directory
- `/ck:kanban <dir>` - View dashboard for specific directory
- `/ck:kanban --stop` - Stop running server

## Features

- Plan cards with progress bars
- Phase status breakdown (completed, in-progress, pending)
- Timeline/Gantt visualization
- Activity heatmap
- Issue and branch links

## Execution

**IMPORTANT:** Run server as Claude Code background task using `run_in_background: true` with the Bash tool. This makes the server visible in `/tasks` and manageable via `KillShell`.

The skill is located at `.claude/skills/plans-kanban/`.

### Stop Server

If `--stop` flag is provided:

```bash
node .claude/skills/plans-kanban/scripts/server.cjs --stop
```

### Start Server

Otherwise, run the kanban server as CC background task with `--foreground` flag (keeps process alive for CC task management):

```bash
# Determine plans directory
INPUT_DIR="$1"
PLANS_DIR="${INPUT_DIR:-./plans}"

# Start kanban dashboard
node .claude/skills/plans-kanban/scripts/server.cjs \
  --dir "$PLANS_DIR" \
  --host 0.0.0.0 \
  --open \
  --foreground
```

**Critical:** When calling the Bash tool:
- Set `run_in_background: true` to run as CC background task
- Set `timeout: 300000` (5 minutes) to prevent premature termination
- Parse JSON output and report URL to user

Example Bash tool call:
```json
{
  "command": "node .claude/skills/plans-kanban/scripts/server.cjs --dir \"./plans\" --host 0.0.0.0 --open --foreground",
  "run_in_background": true,
  "timeout": 300000,
  "description": "Start kanban server in background"
}
```

After starting, parse the JSON output and report:
- Local URL for browser access
- Network URL for remote device access (if available)
- Inform user that server is now running as CC background task (visible in `/tasks`)

**CRITICAL:** MUST display the FULL URL including path and query string. NEVER truncate to just `host:port`.

## Future Plans

The `/ck:kanban` command will evolve into **VibeKanban-inspired** AI agent orchestration:

### Phase 1 (Current - MVP)
- Task board with progress tracking
- Visual representation of plans/tasks
- Click to view plan details

### Phase 2 (Worktree Integration)
- Create tasks → spawn git worktrees
- Assign agents to tasks
- Track agent progress per worktree

### Phase 3 (Full Orchestration)
- Parallel agent execution monitoring
- Code diff/review interface
- PR creation workflow
- Agent output streaming
- Conflict detection

Track progress: https://github.com/claudekit/claudekit-engineer/issues/189
