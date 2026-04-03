# Task Operations Reference

Claude Code provides 4 native tools for session-scoped task management.

**Tool Availability:** `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList` are **CLI-only** — disabled in VSCode extension (`isTTY` check). If these tools error, fall back to `TodoWrite` for progress tracking. Plan file sync-back works identically without Task tools.

## TaskCreate

Create structured tasks with metadata and dependencies.

```
TaskCreate(
  subject: "Implement JWT auth middleware",
  description: "Add JWT validation to API routes. Verify tokens, extract claims, attach to context.",
  activeForm: "Implementing JWT auth middleware",
  metadata: { feature: "auth", phase: 2, priority: "P1", effort: "2h",
              planDir: "plans/260205-auth/", phaseFile: "phase-02-api.md" }
)
```

**Parameters:**
- `subject` (required): Imperative title, <60 chars ("Implement X", "Add Y", "Fix Z")
- `description` (required): Detailed requirements + acceptance criteria
- `activeForm` (optional): Present-continuous shown in spinner ("Implementing X")
- `metadata` (optional): Arbitrary key-value pairs for tracking

**Required metadata fields:** `phase`, `priority` (P1/P2/P3), `effort`, `planDir`, `phaseFile`
**Optional metadata:** `step`, `critical`, `riskLevel`, `dependencies`, `feature`, `owner`

## TaskUpdate

Manage state transitions and dependency chains.

```
TaskUpdate(
  taskId: "task-123",
  status: "in_progress",
  addBlockedBy: ["task-122"]
)
```

**Status lifecycle:** `pending` → `in_progress` → `completed`

**Dependency fields:**
- `addBlockedBy`: "I cannot start until these tasks complete"
- `addBlocks`: "These tasks cannot start until I complete"
- `owner`: Assign to specific agent

When a blocking task completes, dependent tasks auto-unblock.

## TaskGet & TaskList

- `TaskGet(taskId)` → Full task details including dependencies
- `TaskList()` → All tasks with status, owner, blockedBy

**Task is "available" when:** status=`pending`, no owner, blockedBy list empty.

## Dependency Patterns

```
Phase 1 (no blockers)              ← start here
Phase 2 (addBlockedBy: [P1-id])    ← auto-unblocked when P1 completes
Phase 3 (addBlockedBy: [P2-id])
Step 3.4 (addBlockedBy: [P2-id])   ← critical steps share phase dependency
```

## When to Use Tasks

| Scenario | Tasks? | Why |
|----------|--------|-----|
| Multi-phase feature (3+) | Yes | Track progress, enable parallel |
| Complex dependencies | Yes | Automatic unblocking |
| Parallel agent work | Yes | Shared progress tracking |
| Single-phase quick fix | No | Overhead exceeds benefit |
| <3 related steps | No | Just do them directly |

**3-Task Rule:** <3 tasks → skip creation, overhead not worth it.

## Parallel Agent Coordination

1. Create tasks with scoped ownership per agent
2. Each agent works in designated directories only
3. When Agent A completes a task → `TaskUpdate(status: "completed")`
4. Tasks blocked by completed work auto-unblock
5. Agent B (or A) claims newly available work

**Key:** Assign `owner` field to prevent agents from claiming same task.
