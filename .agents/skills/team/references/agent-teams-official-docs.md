# Agent Teams -- Overview & Architecture

> **Canonical source:** https://code.claude.com/docs/en/agent-teams
> **Version captured:** Claude Code v2.1.80 (March 2026)
> **Update policy:** Re-fetch canonical URL when Claude Code releases new Agent Teams features.

This is a **self-contained knowledge base** -- AI agents should NOT need to re-fetch the URL.

## Overview

Agent Teams coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

Unlike subagents (run within a single session, report back only), teammates are full independent sessions you can interact with directly.

## When to Use

Best for tasks where parallel exploration adds real value:

- **Research and review**: multiple teammates investigate different aspects, share and challenge findings
- **New modules or features**: teammates each own a separate piece without conflicts
- **Debugging with competing hypotheses**: test different theories in parallel
- **Cross-layer coordination**: changes spanning frontend, backend, tests -- each owned by different teammate

**Not suitable for:** sequential tasks, same-file edits, work with many dependencies.

### Subagents vs Agent Teams

| | Subagents | Agent Teams |
|---|---|---|
| **Tool** | `Agent` (formerly `Task`) | `Agent` + `TeamCreate`/`TaskCreate`/`SendMessage` |
| **Context** | Own 200K-token window; results return to caller | Own full Claude Code instance + context |
| **Communication** | Report back to parent only | Message each other directly via SendMessage |
| **Coordination** | Parent manages all work | Shared task list, self-coordination |
| **Isolation** | Optional `isolation: "worktree"` | Each teammate = separate session |
| **Model** | Any (haiku/sonnet/opus per agent) | All teammates must run Opus 4.6 |
| **Max parallel** | ~10 simultaneous | Depends on system resources |
| **Best for** | Focused tasks, result-only | Complex work requiring discussion |
| **Token cost** | Lower | Higher (each teammate = separate instance) |
| **Status** | Production (stable) | Experimental (requires opt-in flag) |

## Enable

Still experimental -- requires opt-in:

```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

Set in shell environment or settings.json.

## How Teams Start

Two paths:
1. **You request**: describe task + ask for agent team. Claude creates based on instructions.
2. **Claude proposes**: suggests team if task benefits from parallel work.

Both require your confirmation. Claude won't create a team without approval.

## Architecture

| Component | Role |
|-----------|------|
| **Team lead** | Main session -- creates team, spawns teammates, coordinates |
| **Teammates** | Separate Claude Code instances with own context windows |
| **Task list** | Shared work items at `~/.claude/tasks/{team-name}/` |
| **Mailbox** | Messaging system for inter-agent communication |

Storage:
- **Team config**: `~/.claude/teams/{team-name}/config.json` (members array with name, agent ID, type)
- **Task list**: `~/.claude/tasks/{team-name}/`

Task dependencies managed automatically -- completing a blocking task unblocks dependents without manual intervention.

## Tools API Surface

### Agent Tool (spawn teammates)

The `Agent` tool (formerly `Task`, renamed v2.1.63) spawns teammates:

```
Agent(
  subagent_type: string,       # Agent specialization
  description: string,         # Short task summary (3-5 words)
  prompt: string,              # Full instructions for teammate
  model: "opus",               # Required for Agent Teams (Opus 4.6)
  run_in_background: true,     # Non-blocking spawn
  isolation: "worktree"        # Optional: git worktree isolation
)
```

**Built-in subagent types:** `general-purpose`, `Explore`, `Plan`, `researcher`, `fullstack-developer`, `code-reviewer`, `debugger`, `tester`, `planner`, `docs-manager`, `brainstormer`, and more.

**Custom subagents:** Define in `.claude/agents/` with frontmatter (name, description, tools, model).

### TeamCreate

Create team + task list. Params: `team_name`, `description`.

### TeamDelete

Remove team/task dirs. **Takes NO parameters** -- just call `TeamDelete` with empty params. Fails if active teammates still exist.

### SendMessage Types

| Type | Purpose |
|------|---------|
| `message` | DM to one teammate (requires `recipient`) |
| `broadcast` | Send to ALL teammates (use sparingly -- costs scale with N) |
| `shutdown_request` | Ask teammate to gracefully exit |
| `shutdown_response` | Teammate approves/rejects shutdown (requires `request_id`) |
| `plan_approval_response` | Lead approves/rejects teammate plan (requires `request_id`) |

**Resume pattern:** `SendMessage(to: "<agent-name>")` resumes an idle teammate.

### Task System Fields

| Field | Values/Purpose |
|-------|---------------|
| `status` | `pending` -> `in_progress` -> `completed` (or `deleted`) |
| `owner` | Agent name assigned to task |
| `blocks` | Task IDs this task blocks (read via TaskGet) |
| `blockedBy` | Task IDs that must complete first (read via TaskGet) |
| `addBlocks` | Set blocking relations (write via TaskUpdate) |
| `addBlockedBy` | Set dependency relations (write via TaskUpdate) |
| `metadata` | Arbitrary key-value pairs |
| `subject` | Brief imperative title |
| `description` | Full requirements and context |

Task claiming uses file locking to prevent race conditions.
Task dependencies resolve automatically -- completing a blocker unblocks dependents.

## Hook Events

### TaskCompleted

Fires when teammate calls `TaskUpdate` with `status: "completed"`.

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string | Completed task ID |
| `task_subject` | string | Task title |
| `task_description` | string | Full task description |
| `teammate_name` | string | Who completed it |
| `team_name` | string | Team name |

### TeammateIdle

Fires after `SubagentStop` for team members.

| Field | Type | Description |
|-------|------|-------------|
| `teammate_name` | string | Idle teammate name |
| `team_name` | string | Team name |

### Event Lifecycle

```
SubagentStart(worker) -> TaskCompleted(task) -> SubagentStop(worker) -> TeammateIdle(worker)
```

TaskCompleted fires BEFORE SubagentStop/TeammateIdle.

## Worktree Isolation

For implementation teams, the `isolation: "worktree"` parameter on the Agent tool gives each teammate:
- **Own git worktree** -- isolated working directory, staging area, HEAD
- **Own branch** -- auto-created feature branch
- **No file conflicts** -- multiple devs can edit same files independently
- **Shared .git** -- common config, refs visible to all

After completion, lead merges worktree branches. This is the recommended pattern for parallel code changes.

## Agent Memory

Agents can declare `memory` in frontmatter for persistent cross-session learning.

| Scope | Location | Persists across |
|-------|----------|-----------------|
| `user` | `~/.claude/agent-memory/<name>/` | All projects |
| `project` | `.claude/agent-memory/<name>/` | Sessions in same project |

First 200 lines of `MEMORY.md` auto-injected into system prompt.

## Task(agent_type) Restrictions

Limit which sub-agents an agent can spawn:

```yaml
tools: Read, Grep, Bash, Task(Explore)
```

This agent can only spawn `Explore` sub-agents. Restricts recursive spawning and cost escalation.

## Context & Communication

Each teammate loads: CLAUDE.md, MCP servers, skills, agents. Receives spawn prompt from lead. Lead's conversation history does NOT carry over.

- **Automatic message delivery** -- no polling needed
- **Idle notifications** -- teammates notify lead when turn ends
- **Shared task list** -- all agents see status and claim work

## Permissions

Teammates inherit lead's permission settings at spawn. If lead uses `--dangerously-skip-permissions`, all teammates do too. Can change individually after spawning but not at spawn time.

## Token Usage

Scales with active teammates. Worth it for research/review/features. Single session more cost-effective for routine tasks. All teammates run Opus 4.6 -- no mixed-model teams currently supported.

## Limitations

- **Model lock**: All teammates must run Opus 4.6 (no mixed-model teams)
- **No session resumption**: `/resume` and `/rewind` don't restore in-process teammates
- **Task status can lag**: teammates may not mark tasks completed; check manually
- **Shutdown can be slow**: finishes current request first
- **One team per session**: clean up before starting new one
- **No nested teams**: only lead manages team
- **Lead is fixed**: can't promote teammate or transfer leadership
- **Permissions at spawn**: all inherit lead's mode; changeable after but not at spawn time
- **Split panes**: require tmux or iTerm2 only
- **VSCode unsupported**: Agent Teams requires CLI terminal
