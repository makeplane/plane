# Review Task Management Patterns

Track review pipeline execution via Claude Native Tasks (TaskCreate, TaskUpdate, TaskList).

## When to Create Tasks

| Review Scope | Tasks? | Rationale |
|--------------|--------|-----------|
| Single-file fix | No | Scout + review + done, overhead not worth it |
| Multi-file feature (3+ files) | Yes | Track scout → review → fix → verify chain |
| Parallel reviewers (2+ scopes) | Yes | Coordinate independent reviews |
| Review cycle with Critical fixes | Yes | Dependencies between fix → re-verify |

**3-Task Rule:** Skip task creation when review pipeline has <3 meaningful steps.

## Review Pipeline as Tasks

```
TaskCreate: "Scout edge cases"         → pending
TaskCreate: "Review implementation"    → pending, blockedBy: [scout]
TaskCreate: "Adversarial review"       → pending, blockedBy: [review]
TaskCreate: "Fix critical issues"      → pending, blockedBy: [adversarial]
TaskCreate: "Verify fixes pass"        → pending, blockedBy: [fix]
```

Dependency chain auto-unblocks: scout → review → adversarial → fix → verify.

## Task Schemas

### Scout Task

```
TaskCreate(
  subject: "Scout edge cases for {feature}",
  activeForm: "Scouting edge cases",
  description: "Identify affected files, data flows, boundary conditions. Changed: {files}",
  metadata: { reviewStage: "scout", feature: "{feature}",
              changedFiles: "src/auth.ts,src/middleware.ts",
              priority: "P2", effort: "3m" }
)
```

### Review Task

```
TaskCreate(
  subject: "Review {feature} implementation",
  activeForm: "Reviewing {feature}",
  description: "Code-reviewer subagent reviews {BASE_SHA}..{HEAD_SHA}. Plan: {plan_ref}",
  metadata: { reviewStage: "review", feature: "{feature}",
              baseSha: "{BASE_SHA}", headSha: "{HEAD_SHA}",
              priority: "P1", effort: "10m" },
  addBlockedBy: ["{scout-task-id}"]
)
```

### Adversarial Task

```
TaskCreate(
  subject: "Adversarial review for {feature}",
  activeForm: "Red-teaming {feature}",
  description: "Spawn adversarial reviewer to break the code. See references/adversarial-review.md",
  metadata: { reviewStage: "adversarial", feature: "{feature}",
              priority: "P1", effort: "10m" },
  addBlockedBy: ["{review-task-id}"]
)
```

### Fix Task (created after adversarial finds issues)

```
TaskCreate(
  subject: "Fix {severity} issues from review",
  activeForm: "Fixing {severity} review issues",
  description: "Address: {issue_list}",
  metadata: { reviewStage: "fix", severity: "critical",
              issueCount: 3, priority: "P1", effort: "15m" },
  addBlockedBy: ["{review-task-id}"]
)
```

### Verify Task

```
TaskCreate(
  subject: "Verify fixes pass tests and build",
  activeForm: "Verifying fixes",
  description: "Run test suite, build, confirm 0 failures. Evidence before claims.",
  metadata: { reviewStage: "verify", priority: "P1", effort: "5m" },
  addBlockedBy: ["{fix-task-id}"]
)
```

## Parallel Review Coordination

For multi-scope reviews (e.g., backend + frontend changed independently):

```
// Create scoped review tasks — no blockedBy between them
TaskCreate(subject: "Review backend auth changes",
  metadata: { reviewStage: "review", scope: "src/api/,src/middleware/",
              agentIndex: 1, totalAgents: 2, priority: "P1" })

TaskCreate(subject: "Review frontend auth UI",
  metadata: { reviewStage: "review", scope: "src/components/auth/",
              agentIndex: 2, totalAgents: 2, priority: "P1" })

// Both run simultaneously via separate code-reviewer subagents
// Fix task blocks on BOTH completing:
TaskCreate(subject: "Fix all review issues",
  addBlockedBy: ["{backend-review-id}", "{frontend-review-id}"])
```

## Task Lifecycle

```
Scout:       pending → in_progress → completed (scout report returned)
Review:      pending → in_progress → completed (reviewer findings returned)
Adversarial: pending → in_progress → completed (red-team findings adjudicated)
Fix:         pending → in_progress → completed (all Critical/Important fixed)
Verify:      pending → in_progress → completed (tests pass, build clean)
```

### Handling Re-Reviews

When fixes introduce new issues → create new review cycle:

```
TaskCreate(subject: "Re-review after fixes",
  addBlockedBy: ["{fix-task-id}"],
  metadata: { reviewStage: "review", cycle: 2, priority: "P1" })
```

Limit to 3 cycles. If still failing after cycle 3 → escalate to user.

## Integration with Planning Tasks

Review tasks are **separate from** cook/planning phase tasks.

**When cook spawns review:**
1. Cook completes implementation phase → creates review pipeline tasks
2. Review pipeline executes (scout → review → adversarial → fix → verify)
3. All review tasks complete → cook marks phase as reviewed
4. Cook proceeds to next phase

Review tasks reference the phase but don't block it directly — the orchestrator manages handoff.

## Quality Check

After pipeline registration: `Registered [N] review tasks (scout → review → adversarial → fix → verify chain)`

## Error Handling

If `TaskCreate` fails: log warning, fall back to sequential review without task tracking. Review pipeline functions identically — tasks add visibility, not functionality.
