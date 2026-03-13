---
name: cook
description: End-to-end feature implementation — research, plan, implement, test, review. Use when asked to "cook", "build end-to-end", or for complete feature delivery.
---

# Cook — End-to-End Implementation

Complete feature pipeline: research → plan → implement → test → review.

## Instructions

Since Antigravity runs as a single agent, this skill executes the pipeline **sequentially** with file-based state tracking.

### Step 1: Research (skip if simple/obvious)

- Search codebase for related patterns
- Search web if needed
- Save report to `plans/reports/research-{date}-{slug}.md`

### Step 2: Plan

- Read research report (if exists)
- Read `.agent/rules/` for architecture rules
- Create `plans/{date}-{slug}/plan.md` + phase files
- **MANDATORY:** Each phase file includes Embedded Rules + Post-Phase Checklist
- Present plan to user for approval before proceeding

### Step 3: Implement (per phase)

- Read phase file (contains embedded rules + steps)
- Implement all steps
- Run post-phase checklist — fix failures
- Run lint/type check
- Mark phase done in plan.md
- **Recommend:** Start fresh chat for next phase (attention dilution prevention)

### Step 4: Test

- Run existing test suite
- Write new tests for added functionality
- Verify: happy path, edge cases, error scenarios
- Save results to `plans/reports/test-{date}-{slug}.md`

### Step 5: Review

- Review ALL changed files against `.agent/rules/frontend-implementation-checklist.md`
- Check: `.agent/rules/development-rules.md` for post-implementation verification gates
- Check: `.agent/rules/prettier-formatting.md` for formatting standards (120-char width)
- Check: `.agent/rules/frontend-canonical-imports.md` for verified frontend import paths
- Check: `.agent/rules/backend-canonical-imports.md` for verified backend import paths
- Check: i18n, color tokens, input backgrounds, components, layout, file quality
- Backend: check permissions, managers, activity tracking, N+1 queries
- Save review to `plans/reports/review-{date}-{slug}.md`
- Score: X/10 with critical issues list

### Step 6: Finalize

- Update `docs/` if changes warrant
- Stage and commit with conventional commit message
- Report summary: files changed, tests passed, review score

## State Tracking

Each step writes output to `plans/` — next step reads from there:

```
plans/{date}-{slug}/
├── research/report.md      ← Step 1 output
├── plan.md                 ← Step 2 output
├── phase-XX-*.md           ← Step 2 output
├── reports/
│   ├── test-report.md      ← Step 4 output
│   └── review-report.md    ← Step 5 output
```

## Rules

- Follow YAGNI / KISS / DRY
- Read `.agent/rules/` BEFORE any implementation
- Never skip post-phase checklist
- Never skip review step
- Always present plan for user approval before implementing
