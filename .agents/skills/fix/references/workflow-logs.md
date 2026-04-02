# Log Analysis Fix Workflow

For fixing issues from application logs. Uses native Claude Tasks for phase tracking.

## Prerequisites
- Log file at `./logs.txt` or similar

## Setup (if logs missing)

Add permanent log piping to project config:
- **Bash/Unix**: `command 2>&1 | tee logs.txt`
- **PowerShell**: `command *>&1 | Tee-Object logs.txt`

## Task Setup (Before Starting)

```
T1 = TaskCreate(subject="Read & analyze logs",  activeForm="Analyzing logs")
T2 = TaskCreate(subject="Scout codebase",        activeForm="Scouting codebase",    addBlockedBy=[T1])
T3 = TaskCreate(subject="Plan fix",              activeForm="Planning fix",          addBlockedBy=[T1, T2])
T4 = TaskCreate(subject="Implement fix",         activeForm="Implementing fix",      addBlockedBy=[T3])
T5 = TaskCreate(subject="Test fix",              activeForm="Testing fix",           addBlockedBy=[T4])
T6 = TaskCreate(subject="Code review",           activeForm="Reviewing code",        addBlockedBy=[T5])
```

## Workflow

### Step 1: Read & Analyze Logs
`TaskUpdate(T1, status="in_progress")`

- Read logs with `Grep` (use `head_limit: 30` initially, increase if needed)
- Use `debugger` agent for root cause analysis
- Focus on last N lines first (most recent errors)
- Look for stack traces, error codes, timestamps, repeated patterns

`TaskUpdate(T1, status="completed")`

### Step 2: Scout Codebase
`TaskUpdate(T2, status="in_progress")`
Use `ck:scout` agent or parallel `Explore` subagents to find issue locations.

See `references/parallel-exploration.md` for patterns.

`TaskUpdate(T2, status="completed")`

### Step 3: Plan Fix
`TaskUpdate(T3, status="in_progress")` — auto-unblocks when T1 + T2 complete.
Use `planner` agent.

`TaskUpdate(T3, status="completed")`

### Step 4: Implement
`TaskUpdate(T4, status="in_progress")`
Implement the fix.

`TaskUpdate(T4, status="completed")`

### Step 5: Test
`TaskUpdate(T5, status="in_progress")`
Use `tester` agent. If issues remain → keep T5 `in_progress`, loop back to Step 2.

`TaskUpdate(T5, status="completed")`

### Step 6: Review
`TaskUpdate(T6, status="in_progress")`
Use `code-reviewer` agent.

`TaskUpdate(T6, status="completed")`

## Tips
- Focus on last N lines first (most recent errors)
- Look for stack traces, error codes, timestamps
- Check for patterns/repeated errors
