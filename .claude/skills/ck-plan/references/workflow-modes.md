# Workflow Modes

## Auto-Detection (Default: `--auto`)

When no flag specified, analyze task and pick mode:

| Signal | Mode | Rationale |
|--------|------|-----------|
| Simple task, clear scope, no unknowns | fast | Skip research overhead |
| Complex task, unfamiliar domain, new tech | hard | Research needed |
| 3+ independent features/layers/modules | parallel | Enable concurrent agents |
| Ambiguous approach, multiple valid paths | two | Compare alternatives |

Use `AskUserQuestion` if detection is uncertain.

## Scope Challenge Integration

Step 0 (Scope Challenge, see `scope-challenge.md`) runs before mode detection and can influence it:
- If user selects **EXPANSION** → auto-suggest `--hard` or `--two`
- If user selects **REDUCTION** → auto-suggest `--fast`
- If user selects **HOLD** → proceed with auto-detected mode

Mode can still be overridden by explicit flags (`--fast`, `--hard`, etc.).
Scope challenge is skipped when `--fast` is explicitly set or task is trivial.

## Fast Mode (`--fast`)

No research. Analyze → Plan → Hydrate Tasks.

1. Read codebase docs (`codebase-summary.md`, `code-standards.md`, `system-architecture.md`)
2. Use `planner` subagent to create plan
3. Hydrate tasks (unless `--no-tasks`)
4. **Context reminder:** `/ck:cook --auto {absolute-plan-path}/plan.md`

**Why `--auto` cook flag?** Fast planning pairs with fast execution — skip review gates.

## Hard Mode (`--hard`)

Research → Scout → Plan → Red Team → Validate → Hydrate Tasks.

1. Spawn max 2 `researcher` agents in parallel (different aspects, max 5 calls each)
2. Read codebase docs; if stale/missing: run `/ck:scout` to search codebase
3. Gather research + scout report filepaths → pass to `planner` subagent
4. Post-plan red team review (see Red Team Review section below)
5. Post-plan validation (see Validation section below)
6. Hydrate tasks (unless `--no-tasks`)
7. **Context reminder:** `/ck:cook {absolute-plan-path}/plan.md`

**Why no cook flag?** Thorough planning needs interactive review gates.

## Parallel Mode (`--parallel`)

Research → Scout → Plan with file ownership → Red Team → Validate → Hydrate Tasks with dependency graph.

1. Same as Hard mode steps 1-3
2. Planner creates phases with:
   - **Exclusive file ownership** per phase (no overlap)
   - **Dependency matrix** (which phases run concurrently vs sequentially)
   - **Conflict prevention** strategy
3. plan.md includes: dependency graph, execution strategy, file ownership matrix
4. Hydrate tasks: `addBlockedBy` for sequential deps, no blockers for parallel groups
5. Post-plan red team review
6. Post-plan validation
7. **Context reminder:** `/ck:cook --parallel {absolute-plan-path}/plan.md`

### Parallel Phase Requirements
- Each phase self-contained, no runtime deps on other phases
- Clear file boundaries — each file modified in ONE phase only
- Group by: architectural layer, feature domain, or technology stack
- Example: Phases 1-3 parallel (DB/API/UI), Phase 4 sequential (integration tests)

## Two-Approach Mode (`--two`)

Research → Scout → Plan 2 approaches → Compare → Hydrate Tasks.

1. Same as Hard mode steps 1-3
2. Planner creates 2 implementation approaches with:
   - Clear trade-offs (pros/cons each)
   - Recommended approach with rationale
3. User selects approach
4. Post-plan red team review on selected approach
5. Post-plan validation
6. Hydrate tasks for selected approach (unless `--no-tasks`)
7. **Context reminder:** `/ck:cook {absolute-plan-path}/plan.md`

## Task Hydration Per Mode

| Mode | Task Granularity | Dependency Pattern |
|------|------------------|--------------------|
| fast | Phase-level only | Sequential chain |
| hard | Phase + critical steps | Sequential + step deps |
| parallel | Phase + steps + ownership | Parallel groups + sequential deps |
| two | After user selects approach | Sequential chain |

All modes: See `task-management.md` for TaskCreate patterns and metadata.

## Post-Plan Red Team Review

Adversarial review that spawns hostile reviewers to find flaws before validation.

**Available in:** hard, parallel, two modes. **Skipped in:** fast mode.

**Invocation:** Run `/ck:plan red-team {plan-directory-path}`.
```
/ck:plan red-team {plan-directory-path}
```

**Sequence:** Red team runs BEFORE validation because:
1. Red team may change the plan (added risks, removed sections, new constraints)
2. Validation should confirm the FINAL plan, not a pre-review draft
3. Validating first then red-teaming would invalidate validation answers

## Post-Plan Validation

Check `## Plan Context` → `Validation: mode=X, questions=MIN-MAX`:

| Mode | Behavior |
|------|----------|
| `prompt` | Ask: "Validate this plan with interview?" → Yes (Recommended) / No |
| `auto` | Run `/ck:plan validate {plan-directory-path}` |
| `off` | Skip validation |

**Invocation (when prompt mode, user says yes):** Run:
```
/ck:plan validate {plan-directory-path}
```

**Available in:** hard, parallel, two modes. **Skipped in:** fast mode.

## Context Reminder (MANDATORY)

After plan creation, MUST output with **actual absolute path**:

| Mode | Cook Command |
|------|-----------------------------|
| fast | `/ck:cook --auto {path}/plan.md` |
| hard | `/ck:cook {path}/plan.md` |
| parallel | `/ck:cook --parallel {path}/plan.md` |
| two | `/ck:cook {path}/plan.md` |

> **Best Practice:** Run `/clear` before implementing to reduce planning-context carryover.
> Then run the cook command above.

**Why absolute path?** After `/clear`, the new session loses previous context.
This reminder is **NON-NEGOTIABLE** — always output after presenting the plan.

## Pre-Creation Check

Check `## Plan Context` in injected context:
- **"Plan: {path}"** → Ask "Continue with existing plan? [Y/n]"
- **"Suggested: {path}"** → Branch hint only, ask if activate or create new
- **"Plan: none"** → Create new using `Plan dir:` from `## Naming`

After creating: `node .claude/scripts/set-active-plan.cjs {plan-dir}`
Pass plan directory path to every subagent during the process.
