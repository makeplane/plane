# Debug Task Management Patterns

Track investigation and debugging pipelines via Claude Native Tasks (TaskCreate, TaskUpdate, TaskList).

## When to Create Tasks

| Debug Scope | Tasks? | Rationale |
|-------------|--------|-----------|
| Single bug, one file | No | Systematic debugging handles directly |
| Multi-component investigation (3+ steps) | Yes | Track assess → collect → analyze → fix → verify |
| Parallel log/data collection agents | Yes | Coordinate independent evidence gathering |
| Performance investigation with multiple layers | Yes | Track bottleneck analysis per layer |
| CI/CD pipeline failure with 3+ possible causes | Yes | Track hypothesis elimination |

**3-Task Rule:** Skip task creation when investigation has <3 meaningful steps.

## Investigation Pipeline as Tasks

```
TaskCreate: "Assess incident scope"      → pending
TaskCreate: "Collect logs and evidence"  → pending, blockedBy: [assess]
TaskCreate: "Analyze root cause"         → pending, blockedBy: [collect]
TaskCreate: "Implement fix"              → pending, blockedBy: [analyze]
TaskCreate: "Verify fix resolves issue"  → pending, blockedBy: [fix]
```

Maps to investigation-methodology.md 5-step process. Auto-unblocks as each step completes.

## Task Schemas

### Assess Task

```
TaskCreate(
  subject: "Assess {incident} scope and impact",
  activeForm: "Assessing incident scope",
  description: "Gather symptoms, identify affected components, check recent changes. See investigation-methodology.md Step 1",
  metadata: { debugStage: "assess", incident: "{incident}",
              severity: "P1", effort: "5m" }
)
```

### Collect Task

```
TaskCreate(
  subject: "Collect evidence for {incident}",
  activeForm: "Collecting evidence",
  description: "Server logs, CI/CD logs, database state, metrics. See log-and-ci-analysis.md",
  metadata: { debugStage: "collect", incident: "{incident}",
              sources: "logs,ci,db", priority: "P1", effort: "10m" },
  addBlockedBy: ["{assess-task-id}"]
)
```

### Analyze Task

```
TaskCreate(
  subject: "Analyze root cause of {incident}",
  activeForm: "Analyzing root cause",
  description: "Correlate evidence, trace execution paths, identify root cause. See systematic-debugging.md Phase 1-3",
  metadata: { debugStage: "analyze", incident: "{incident}",
              technique: "systematic", priority: "P1", effort: "15m" },
  addBlockedBy: ["{collect-task-id}"]
)
```

### Fix Task

```
TaskCreate(
  subject: "Fix root cause: {root_cause_summary}",
  activeForm: "Implementing fix",
  description: "Address root cause, add defense-in-depth validation. See defense-in-depth.md",
  metadata: { debugStage: "fix", rootCause: "{root_cause}",
              priority: "P1", effort: "20m" },
  addBlockedBy: ["{analyze-task-id}"]
)
```

### Verify Task

```
TaskCreate(
  subject: "Verify fix with fresh evidence",
  activeForm: "Verifying fix",
  description: "Run tests, check build, confirm issue resolved. NO CLAIMS WITHOUT EVIDENCE. See verification.md",
  metadata: { debugStage: "verify", priority: "P1", effort: "5m" },
  addBlockedBy: ["{fix-task-id}"]
)
```

## Parallel Evidence Collection

For multi-source investigations, spawn parallel collection agents:

```
// Parallel — no blockedBy between them
TaskCreate(subject: "Collect CI/CD pipeline logs",
  metadata: { debugStage: "collect", source: "ci",
              agentIndex: 1, totalAgents: 3, priority: "P1" })

TaskCreate(subject: "Collect application server logs",
  metadata: { debugStage: "collect", source: "server",
              agentIndex: 2, totalAgents: 3, priority: "P1" })

TaskCreate(subject: "Query database for anomalies",
  metadata: { debugStage: "collect", source: "db",
              agentIndex: 3, totalAgents: 3, priority: "P1" })

// Analyze blocks on ALL collection completing:
TaskCreate(subject: "Analyze root cause from collected evidence",
  addBlockedBy: ["{ci-id}", "{server-id}", "{db-id}"])
```

## Task Lifecycle

```
Assess:   pending → in_progress → completed (scope + impact identified)
Collect:  pending → in_progress → completed (evidence gathered)
Analyze:  pending → in_progress → completed (root cause identified)
Fix:      pending → in_progress → completed (fix implemented)
Verify:   pending → in_progress → completed (fresh verification evidence)
```

### Re-Investigation Cycle

When fix doesn't resolve the issue → new analyze-fix-verify cycle:

```
TaskCreate(subject: "Re-analyze: fix attempt {N} failed",
  addBlockedBy: ["{verify-task-id}"],
  metadata: { debugStage: "analyze", cycle: 2, priority: "P1" })
```

Limit to 3 cycles. After cycle 3 → question architecture (systematic-debugging.md Phase 4.5).

## Integration with Cook/Planning

Debug tasks are **separate from** cook/planning phase tasks.

**When cook spawns debugger:**
1. Cook encounters failing tests → creates debug pipeline tasks
2. Debug pipeline executes (assess → collect → analyze → fix → verify)
3. All debug tasks complete → cook marks phase debugging as done
4. Cook proceeds to next phase

## Report Sync-Back

After investigation completes, write diagnostic report per reporting-standards.md. Report persists as the "source of truth" for cross-session reference (tasks are session-scoped only).

## Error Handling

If `TaskCreate` fails: log warning, continue with sequential debugging. Tasks add visibility and coordination, not core functionality.
