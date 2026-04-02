# Agent Teams -- Examples, Best Practices & Troubleshooting

> **Source:** https://code.claude.com/docs/en/agent-teams
> **Version captured:** Claude Code v2.1.80 (March 2026)

## Use Case Examples

### Parallel Code Review

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Each reviewer applies different filter to same PR. Lead synthesizes across all three.

### Competing Hypotheses Investigation

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

Adversarial debate structure fights anchoring bias -- surviving theory is most likely correct.

### Parallel Feature Implementation (with Worktree Isolation)

```
Create a team to implement the new dashboard feature.
Developer A owns src/api/* and src/models/*.
Developer B owns src/components/* and src/pages/*.
Tester writes tests after both devs finish.
Require plan approval for developers.
Use worktree isolation for each developer.
```

Each developer works in isolated worktree -- own branch, own working directory. No file conflicts even if ownership boundaries overlap accidentally. Tester blocked until both complete.

## Best Practices

### Give Enough Context

Teammates don't inherit lead's conversation. Include details in spawn prompt:

```
Spawn a security reviewer with prompt: "Review src/auth/ for vulnerabilities.
Focus on token handling, session management, input validation.
App uses JWT in httpOnly cookies. Report with severity ratings."
```

### Size Tasks Right

- **Too small**: coordination overhead exceeds benefit
- **Too large**: teammates work too long without check-ins
- **Right**: self-contained units with clear deliverable (function, test file, review)

### Start with Research/Review

If new to agent teams, start with read-only tasks (reviewing PRs, researching libraries, investigating bugs). Shows parallel value without coordination challenges of parallel implementation.

### Use Worktree Isolation for Code Changes

For any template where teammates edit code (cook, fix), always use `isolation: "worktree"`:

```
Agent(
  subagent_type: "fullstack-developer",
  model: "opus",
  isolation: "worktree",
  run_in_background: true,
  prompt: "..."
)
```

**Benefits:**
- Each dev gets own git worktree + branch
- No file conflicts -- devs can edit same files independently
- `.git` dir shared (common config), everything else isolated
- Lead merges branches after all devs complete

**When NOT to use:** Research and review templates (read-only, no file edits).

### Spawn with run_in_background

Always use `run_in_background: true` when spawning multiple teammates:

```
# Spawn all 3 researchers concurrently (non-blocking)
Agent(subagent_type: "researcher", run_in_background: true, ...)
Agent(subagent_type: "researcher", run_in_background: true, ...)
Agent(subagent_type: "researcher", run_in_background: true, ...)
```

Lead continues orchestration immediately. TaskCompleted events notify when each finishes.

### Wait for Teammates

If lead starts implementing instead of delegating:
```
Wait for your teammates to complete their tasks before proceeding
```

### Avoid File Conflicts

Two teammates editing same file = overwrites. Mitigate with:
1. **Worktree isolation** (recommended) -- each dev in own worktree
2. **File ownership boundaries** -- define glob patterns per task
3. **Lead handles shared files** -- restructure tasks if overlap unavoidable

### Monitor & Steer

Check progress regularly. Redirect bad approaches. Synthesize findings as they arrive. Letting a team run unattended too long increases wasted effort risk.

### File Ownership Enforcement

- Define explicit file boundaries in each task description
- Include glob patterns: `File ownership: src/api/*, src/models/*`
- If two tasks need same file: use worktree isolation OR escalate to lead
- Tester owns test files only; reads implementation files but never edits them

### Leverage Event-Driven Hooks

With `TaskCompleted` and `TeammateIdle` hooks enabled:

- Lead is automatically notified when tasks complete -- no manual polling needed
- Progress is tracked via hook-injected context: "3/5 tasks done, 2 pending"
- Idle teammates trigger suggestions: "worker-2 idle, 1 unblocked task available"
- All tasks done triggers: "Consider shutting down teammates and synthesizing"

**Cook workflow example:**
```
1. Lead spawns 3 devs (run_in_background: true, isolation: "worktree")
2. TaskCompleted(dev-1, task #1) -> "1/4 done"
3. TaskCompleted(dev-2, task #2) -> "2/4 done"
4. TaskCompleted(dev-3, task #3) -> "3/4 done"
5. TaskCompleted(dev-1, task #4) -> "4/4 done. All tasks completed."
6. Lead merges worktree branches, then spawns tester
```

### Use Agent Memory for Long-Running Projects

For projects with recurring team sessions:
- Code reviewer learns project conventions, stops flagging known patterns
- Debugger remembers past failures, faster root-cause identification
- Tester tracks flaky tests, avoids re-investigating known issues
- Researcher accumulates domain knowledge across projects (user scope)

Memory persists after team cleanup -- it's in `.claude/agent-memory/`, not `~/.claude/teams/`.

### Restrict Sub-Agent Spawning

Use `Task(agent_type)` in agent definitions to prevent:
- Recursive agent chains (agent spawns agent spawns agent)
- Cost escalation (teammate spawning expensive sub-agents)
- Scope creep (tester spawning developer to "fix" issues)

Recommended: Most agents get `Task(Explore)` only. Planner gets `Task(Explore), Task(researcher)`.

## Token Budget Guidance

| Template | Estimated Tokens | Notes |
|----------|-----------------|-------|
| Research (3 teammates) | ~150K-300K | Read-only, all Opus |
| Cook (4 teammates) | ~400K-800K | Highest -- code generation |
| Review (3 teammates) | ~100K-200K | Read-only, all Opus |
| Debug (3 teammates) | ~200K-400K | Mixed read/execute |

Agent Teams use significantly more tokens than subagents (all teammates run Opus 4.6). Use only when parallel exploration + discussion adds clear value. For routine tasks, single session with subagents is more cost-effective.

## Troubleshooting

### Teammates Not Appearing

- In-process: press `Shift+Down` to cycle through active teammates
- Task may not be complex enough -- Claude decides based on task
- Split panes: verify tmux installed and in PATH
- iTerm2: verify `it2` CLI installed and Python API enabled

### Too Many Permission Prompts

Pre-approve common operations in permission settings before spawning.

### Teammates Stopping on Errors

Check output via `Shift+Up/Down` or clicking pane. Give additional instructions or spawn replacement.

### Lead Shuts Down Early

Tell lead to keep going or wait for teammates.

### Orphaned tmux Sessions

```
tmux ls
tmux kill-session -t <session-name>
```

### TeamCreate Fails

- Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in settings.json env
- Agent Teams requires CLI terminal -- NOT supported in VSCode extension
- Only one team per session -- call TeamDelete before creating another

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
