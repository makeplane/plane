# Deep Workflow

Full pipeline with research, brainstorming, and planning for complex issues. Uses native Claude Tasks with dependency chains.

## Task Setup (Before Starting)

Create all phase tasks upfront. Steps 1+2+3 run in parallel (scout + diagnose + research).

```
T1 = TaskCreate(subject="Scout codebase",              activeForm="Scouting codebase",          metadata={phase: "investigate"})
T2 = TaskCreate(subject="Diagnose root cause",          activeForm="Diagnosing root cause",      metadata={phase: "investigate"})
T3 = TaskCreate(subject="Research solutions",            activeForm="Researching solutions",      metadata={phase: "investigate"})
T4 = TaskCreate(subject="Brainstorm approaches",         activeForm="Brainstorming",              metadata={phase: "design"},       addBlockedBy=[T1, T2, T3])
T5 = TaskCreate(subject="Create implementation plan",    activeForm="Planning implementation",    metadata={phase: "design"},       addBlockedBy=[T4])
T6 = TaskCreate(subject="Implement fix",                 activeForm="Implementing fix",           metadata={phase: "implement"},    addBlockedBy=[T5])
T7 = TaskCreate(subject="Verify + prevent",              activeForm="Verifying fix",              metadata={phase: "verify"},       addBlockedBy=[T6])
T8 = TaskCreate(subject="Code review",                   activeForm="Reviewing code",             metadata={phase: "verify"},       addBlockedBy=[T7])
T9 = TaskCreate(subject="Finalize & docs",               activeForm="Finalizing",                 metadata={phase: "finalize"},     addBlockedBy=[T8])
```

## Steps

### Step 1: Scout Codebase (parallel with Steps 2+3)
`TaskUpdate(T1, status="in_progress")`

**Mandatory:** Activate `ck:scout` skill or launch 2-3 `Explore` subagents in parallel:
```
Task("Explore", "Find error origin and affected components", "Trace error")
Task("Explore", "Find module boundaries and dependencies", "Map deps")
Task("Explore", "Find related tests and similar patterns", "Find patterns")
```

Map: all affected files, module boundaries, call chains, test coverage gaps.

See `references/parallel-exploration.md` for patterns.

`TaskUpdate(T1, status="completed")`
**Output:** `✓ Step 1: Scouted - [N] files, system impact: [scope]`

### Step 2: Diagnose Root Cause (parallel with Steps 1+3)
`TaskUpdate(T2, status="in_progress")`

**Mandatory skill chain:**
1. **Capture pre-fix state:** Record ALL error messages, failing tests, stack traces, logs.
2. Activate `ck:debug` skill (systematic-debugging + root-cause-tracing).
3. Activate `ck:sequential-thinking` — structured hypothesis formation.
4. Spawn parallel `Explore` subagents to test each hypothesis.
5. If 2+ hypotheses fail → auto-activate `ck:problem-solving`.
6. Trace backward through call chain to ROOT CAUSE origin.

See `references/diagnosis-protocol.md` for full methodology.

`TaskUpdate(T2, status="completed")`
**Output:** `✓ Step 2: Diagnosed - Root cause: [summary], Evidence: [chain]`

### Step 3: Research (parallel with Steps 1+2)
`TaskUpdate(T3, status="in_progress")`
Use `researcher` subagent for external knowledge.

- Search latest docs, best practices
- Find similar issues/solutions
- Gather security advisories if relevant

`TaskUpdate(T3, status="completed")`
**Output:** `✓ Step 3: Research complete - [key findings]`

### Step 4: Brainstorm
`TaskUpdate(T4, status="in_progress")` — auto-unblocks when T1 + T2 + T3 complete.
Activate `ck:brainstorm` skill.

- Evaluate multiple approaches using scout + diagnosis + research findings
- Consider trade-offs
- Get user input on preferred direction

`TaskUpdate(T4, status="completed")`
**Output:** `✓ Step 4: Approach selected - [chosen approach]`

### Step 5: Plan
`TaskUpdate(T5, status="in_progress")`
Use `planner` subagent to create implementation plan.

- Break down into phases
- Identify dependencies
- Define success criteria
- Include prevention measures in plan

`TaskUpdate(T5, status="completed")`
**Output:** `✓ Step 5: Plan created - [N] phases`

### Step 6: Implement
`TaskUpdate(T6, status="in_progress")`
Implement per plan. Use `ck:context-engineering`, `ck:sequential-thinking`, `ck:problem-solving`.

- Fix ROOT CAUSE per diagnosis — not symptoms
- Follow plan phases
- Minimal changes per phase

`TaskUpdate(T6, status="completed")`
**Output:** `✓ Step 6: Implemented - [N] files, [M] phases`

### Step 7: Verify + Prevent
`TaskUpdate(T7, status="in_progress")`

**Mandatory skill chain:**
1. **Iron-law verify:** Re-run EXACT commands from pre-fix state. Compare before/after.
2. **Regression test:** Add comprehensive tests. Tests MUST fail without fix, pass with fix.
3. **Defense-in-depth:** Apply all relevant prevention layers (see `references/prevention-gate.md`).
4. **Parallel verification:** Launch `Bash` agents: typecheck + lint + build + test.
5. **Edge cases:** Test boundary conditions, security implications, performance impact.

**If verification fails:** Loop back to Step 2 (re-diagnose). Max 3 attempts → question architecture.

See `references/prevention-gate.md` for prevention requirements.

`TaskUpdate(T7, status="completed")`
**Output:** `✓ Step 7: Verified + Prevented - [before/after], [N] tests, [M] guards`

### Step 8: Code Review
`TaskUpdate(T8, status="in_progress")`
Use `code-reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

`TaskUpdate(T8, status="completed")`
**Output:** `✓ Step 8: Review [score]/10 - [status]`

### Step 9: Finalize
`TaskUpdate(T9, status="in_progress")`
- Report summary: root cause, evidence chain, changes, prevention measures, confidence score
- Activate `ck:project-management` for task sync-back, plan status updates, and progress tracking
- Use `docs-manager` subagent for documentation
- Use `git-manager` subagent for commit
- Run `/ck:journal`

`TaskUpdate(T9, status="completed")`
**Output:** `✓ Step 9: Complete - [actions taken]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `ck:scout` OR parallel `Explore` subagents |
| 2 | `ck:debug`, `ck:sequential-thinking`, parallel `Explore`, (`ck:problem-solving` auto) |
| 3 | `researcher` (runs parallel with steps 1+2) |
| 4 | `ck:brainstorm` |
| 5 | `planner` |
| 6 | `ck:problem-solving`, `ck:sequential-thinking`, `ck:context-engineering` |
| 7 | `tester`, parallel `Bash` verification |
| 8 | `code-reviewer` |
| 9 | `ck:project-management`, `docs-manager`, `git-manager` |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `ck:chrome-devtools` or any relevant skills/tools to verify.
**Visual Assets:** Use `ck:ai-multimodal` for visual assets generation, analysis and verification.
