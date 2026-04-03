---
name: ck:code-review
description: "Review code quality with adversarial rigor. Supports input modes: pending changes, PR number, commit hash, codebase scan. Always-on red-team analysis finds security holes, false assumptions, and failure modes."
argument-hint: "[#PR | COMMIT | --pending | codebase [parallel]]"
metadata:
  author: claudekit
  version: "2.0.0"
---

# Code Review

Adversarial code review with technical rigor, evidence-based claims, and verification over performative responses. Every review includes red-team analysis that actively tries to break the code.

## Input Modes

Auto-detect from arguments. If ambiguous or no arguments, prompt via `AskUserQuestion`.

| Input | Mode | What Gets Reviewed |
|-------|------|--------------------|
| `#123` or PR URL | **PR** | Full PR diff fetched via `gh pr diff` |
| `abc1234` (7+ hex chars) | **Commit** | Single commit diff via `git show` |
| `--pending` | **Pending** | Staged + unstaged changes via `git diff` |
| *(no args, recent changes)* | **Default** | Recent changes in context |
| `codebase` | **Codebase** | Full codebase scan |
| `codebase parallel` | **Codebase+** | Parallel multi-reviewer audit |

**Resolution details:** `references/input-mode-resolution.md`

### No Arguments

If invoked WITHOUT arguments and no recent changes in context, use `AskUserQuestion` with header "Review Target", question "What would you like to review?":

| Option | Description |
|--------|-------------|
| Pending changes | Review staged/unstaged git diff |
| Enter PR number | Fetch and review a specific PR |
| Enter commit hash | Review a specific commit |
| Full codebase scan | Deep codebase analysis |
| Parallel codebase audit | Multi-reviewer codebase scan |

## Core Principle

**YAGNI**, **KISS**, **DRY** always. Technical correctness over social comfort.
**Be honest, be brutal, straight to the point, and be concise.**

Verify before implementing. Ask before assuming. Evidence before claims.

## Practices

| Practice | When | Reference |
|----------|------|-----------|
| **Spec compliance** | After implementing from plan/spec, BEFORE quality review | `references/spec-compliance-review.md` |
| **Adversarial review** | Always-on Stage 3 — actively tries to break the code | `references/adversarial-review.md` |
| Receiving feedback | Unclear feedback, external reviewers, needs prioritization | `references/code-review-reception.md` |
| Requesting review | After tasks, before merge, stuck on problem | `references/requesting-code-review.md` |
| Verification gates | Before any completion claim, commit, PR | `references/verification-before-completion.md` |
| Edge case scouting | After implementation, before review | `references/edge-case-scouting.md` |
| **Checklist review** | Pre-landing, `/ck:ship` pipeline, security audit | `references/checklist-workflow.md` |
| **Task-managed reviews** | Multi-file features (3+ files), parallel reviewers, fix cycles | `references/task-management-reviews.md` |

## Quick Decision Tree

```
SITUATION?
│
├─ Input mode? → Resolve diff (references/input-mode-resolution.md)
│   ├─ #PR / URL → fetch PR diff
│   ├─ commit hash → git show
│   ├─ --pending → git diff (staged + unstaged)
│   ├─ codebase → full scan (references/codebase-scan-workflow.md)
│   ├─ codebase parallel → parallel audit (references/parallel-review-workflow.md)
│   └─ default → recent changes in context
│
├─ Received feedback → STOP if unclear, verify if external, implement if human partner
├─ Completed work from plan/spec:
│   ├─ Stage 1: Spec compliance review (references/spec-compliance-review.md)
│   │   └─ PASS? → Stage 2 │ FAIL? → Fix → Re-review Stage 1
│   ├─ Stage 2: Code quality review (code-reviewer subagent)
│   │   └─ Scout edge cases → Review standards, performance
│   └─ Stage 3: Adversarial review (references/adversarial-review.md) [ALWAYS-ON]
│       └─ Red-team the code → Adjudicate → Accept/Reject findings
├─ Completed work (no plan) → Scout → Code quality → Adversarial review
├─ Pre-landing / ship → Load checklists → Two-pass review → Adversarial review
├─ Multi-file feature (3+ files) → Create review pipeline tasks (scout→review→adversarial→fix→verify)
└─ About to claim status → RUN verification command FIRST
```

### Three-Stage Review Protocol

**Stage 1 — Spec Compliance** (load `references/spec-compliance-review.md`)
- Does code match what was requested?
- Any missing requirements? Any unjustified extras?
- MUST pass before Stage 2

**Stage 2 — Code Quality** (code-reviewer subagent)
- Only runs AFTER spec compliance passes
- Standards, security, performance, edge cases

**Stage 3 — Adversarial Review** (load `references/adversarial-review.md`)
- Runs AFTER Stage 2 passes, subject to scope gate (skip if <=2 files, <=30 lines, no security files)
- Spawn adversarial reviewer with context anchoring (runtime, framework, context files)
- Find: security holes, false assumptions, resource exhaustion, race conditions, supply chain, observability gaps
- Output: Accept (must fix) / Reject (false positive) / Defer (GitHub issue) verdicts per finding
- Critical findings block merge; re-reviews use fix-diff-only optimization

## Receiving Feedback

**Pattern:** READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT
No performative agreement. Verify before implementing. Push back if wrong.

**Full protocol:** `references/code-review-reception.md`

## Requesting Review

**When:** After each task, major features, before merge

**Process:**
1. **Scout edge cases first** (see below)
2. Get SHAs: `BASE_SHA=$(git rev-parse HEAD~1)` and `HEAD_SHA=$(git rev-parse HEAD)`
3. Dispatch code-reviewer subagent with: WHAT, PLAN, BASE_SHA, HEAD_SHA, DESCRIPTION
4. Fix Critical immediately, Important before proceeding

**Full protocol:** `references/requesting-code-review.md`

## Edge Case Scouting

**When:** After implementation, before requesting code-reviewer

**Process:**
1. Invoke `/ck:scout` with edge-case-focused prompt
2. Scout analyzes: affected files, data flows, error paths, boundary conditions
3. Review scout findings for potential issues
4. Address critical gaps before code review

**Full protocol:** `references/edge-case-scouting.md`

## Task-Managed Review Pipeline

**When:** Multi-file features (3+ changed files), parallel code-reviewer scopes, review cycles with Critical fix iterations.

**Fallback:** Task tools (`TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList`) are CLI-only — unavailable in VSCode extension. If they error, use `TodoWrite` for tracking and run pipeline sequentially. Review quality is identical.

**Pipeline:** scout → review → adversarial → fix → verify (each a Task with dependency chain)

```
TaskCreate: "Scout edge cases"         → pending
TaskCreate: "Review implementation"    → pending, blockedBy: [scout]
TaskCreate: "Adversarial review"       → pending, blockedBy: [review]
TaskCreate: "Fix critical issues"      → pending, blockedBy: [adversarial]
TaskCreate: "Verify fixes pass"        → pending, blockedBy: [fix]
```

**Parallel reviews:** Spawn scoped code-reviewer subagents for independent file groups (e.g., backend + frontend). Fix task blocks on all reviewers completing.

**Re-review cycles:** If fixes introduce new issues, create cycle-2 review task. Limit 3 cycles, escalate to user after.

**Full protocol:** `references/task-management-reviews.md`

## Verification Gates

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

**Gate:** IDENTIFY command → RUN full → READ output → VERIFY confirms → THEN claim

**Requirements:**
- Tests pass: Output shows 0 failures
- Build succeeds: Exit 0
- Bug fixed: Original symptom passes
- Requirements met: Checklist verified

**Red Flags:** "should"/"probably"/"seems to", satisfaction before verification, trusting agent reports

**Full protocol:** `references/verification-before-completion.md`

## Integration with Workflows

- **Subagent-Driven:** Scout → Review → Adversarial → Verify before next task
- **Pull Requests:** Scout → Code quality → Adversarial → Merge
- **Task Pipeline:** Create review tasks with dependencies → auto-unblock through chain
- **Cook Handoff:** Cook completes phase → review pipeline tasks (incl. adversarial) → all complete → cook proceeds
- **PR Review:** `/code-review #123` → fetch diff → full 3-stage review on PR changes
- **Commit Review:** `/code-review abc1234` → review specific commit with full pipeline

## Codebase Analysis Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/ck:code-review codebase` | `references/codebase-scan-workflow.md` | Scan & analyze the codebase |
| `/ck:code-review codebase parallel` | `references/parallel-review-workflow.md` | Ultrathink edge cases, then parallel verify |

## Bottom Line

1. Resolve input mode first — know WHAT you're reviewing
2. Technical rigor over social performance
3. Scout edge cases before review
4. Adversarial review on EVERY review — no exceptions
5. Evidence before claims

Verify. Scout. Red-team. Question. Then implement. Evidence. Then claim.
