---
name: ck:code-review
description: "Review code quality with evidence-based rigor. Supports input modes: pending changes, PR number, commit hash, and codebase scan. Focuses on bugs, regressions, maintainability, reliability, and verification gaps."
user-invocable: true
when_to_use: "Invoke to review diffs, PRs, commits, or full codebases."
category: utilities
keywords: [review, quality, verification, reliability]
argument-hint: "[#PR | COMMIT | --pending | codebase [parallel]]"
metadata:
  author: claudekit
  version: "2.0.0"
---

# Code Review

Production-readiness code review with technical rigor, evidence-based claims, and verification over performative responses. Reviews focus on production risks, regression paths, and whether the implementation matches the requested change.

## Input Modes

Auto-detect from arguments. If ambiguous or no arguments, prompt via `AskUserQuestion`.

| Input                       | Mode          | What Gets Reviewed                       |
| --------------------------- | ------------- | ---------------------------------------- |
| `#123` or PR URL            | **PR**        | Full PR diff fetched via `gh pr diff`    |
| `abc1234` (7+ hex chars)    | **Commit**    | Single commit diff via `git show`        |
| `--pending`                 | **Pending**   | Staged + unstaged changes via `git diff` |
| _(no args, recent changes)_ | **Default**   | Recent changes in context                |
| `codebase`                  | **Codebase**  | Full codebase scan                       |
| `codebase parallel`         | **Codebase+** | Parallel multi-reviewer audit            |

**Resolution details:** `references/input-mode-resolution.md`

### No Arguments

If invoked WITHOUT arguments and no recent changes in context, use `AskUserQuestion` with header "Review Target", question "What would you like to review?":

| Option                  | Description                     |
| ----------------------- | ------------------------------- |
| Pending changes         | Review staged/unstaged git diff |
| Enter PR number         | Fetch and review a specific PR  |
| Enter commit hash       | Review a specific commit        |
| Full codebase scan      | Deep codebase analysis          |
| Parallel codebase audit | Multi-reviewer codebase scan    |

## Core Principle

**YAGNI**, **KISS**, **DRY** always. Technical correctness over social comfort.
**Be honest, be brutal, straight to the point, and be concise.**

Verify before implementing. Ask before assuming. Evidence before claims.

## Practices

| Practice                 | When                                                           | Reference                                      |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| **Spec compliance**      | After implementing from plan/spec, BEFORE quality review       | `references/spec-compliance-review.md`         |
| Receiving feedback       | Unclear feedback, external reviewers, needs prioritization     | `references/code-review-reception.md`          |
| Requesting review        | After tasks, before merge, stuck on problem                    | `references/requesting-code-review.md`         |
| Verification gates       | Before any completion claim, commit, PR                        | `references/verification-before-completion.md` |
| Edge case scouting       | After implementation, before review                            | `references/edge-case-scouting.md`             |
| **Checklist review**     | Pre-landing, `/ck:ship` pipeline, security audit               | `references/checklist-workflow.md`             |
| **Task-managed reviews** | Multi-file features (3+ files), parallel reviewers, fix cycles | `references/task-management-reviews.md`        |

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
│   └─ Verification gate → Run required tests/builds before claims
├─ Completed work (no plan) → Scout → Code quality → Verification
├─ Pre-landing / ship → Load checklists → Two-pass review → Verification
├─ Multi-file feature (3+ files) → Create review pipeline tasks (scout→review→fix→verify)
└─ About to claim status → RUN verification command FIRST
```

### Review Protocol

**Stage 1 — Spec Compliance** (load `references/spec-compliance-review.md`)

- Does code match what was requested?
- Any missing requirements? Any unjustified extras?
- MUST pass before Stage 2

**Stage 2 — Code Quality** (code-reviewer subagent)

- Only runs AFTER spec compliance passes
- Standards, security, performance, edge cases

**Final Verification**

- Runs AFTER Stage 2 passes
- Re-run the relevant tests, build, lint, or manual reproduction
- Verify accepted findings are fixed and no new regression is introduced
- Critical findings block merge until fixed and re-verified

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

**Pipeline:** scout → review → fix → verify (each a Task with dependency chain)

```
TaskCreate: "Scout edge cases"         → pending
TaskCreate: "Review implementation"    → pending, blockedBy: [scout]
TaskCreate: "Fix critical issues"      → pending, blockedBy: [review]
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

- **Subagent-Driven:** Scout → Review → Verify before next task
- **Pull Requests:** Scout → Code quality → Verify → Merge
- **Task Pipeline:** Create review tasks with dependencies → auto-unblock through chain
- **Cook Handoff:** Cook completes phase → review pipeline tasks → all complete → cook proceeds
- **PR Review:** `/ck:code-review #123` → fetch diff → full review pipeline on PR changes
- **Commit Review:** `/ck:code-review abc1234` → review specific commit with full pipeline

## Codebase Analysis Subcommands

| Subcommand                          | Reference                                | Purpose                                     |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------- |
| `/ck:code-review codebase`          | `references/codebase-scan-workflow.md`   | Scan & analyze the codebase                 |
| `/ck:code-review codebase parallel` | `references/parallel-review-workflow.md` | Ultrathink edge cases, then parallel verify |

## Bottom Line

1. Resolve input mode first — know WHAT you're reviewing
2. Technical rigor over social performance
3. Scout edge cases before review
4. Evidence before claims

Verify. Scout. Question. Then implement. Evidence. Then claim.

## Workflow Position

**Typically follows:** `/ck:cook` (review after implementation), `/ck:fix` (review after bug fix)
**Typically precedes:** `/ck:ship` (ship after review passes)
**Related:** `/ck:scout` (scout before reviewing), `/ck:test` (test before reviewing)
