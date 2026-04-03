# Standard Workflow

Full pipeline for moderate complexity issues. Uses native Claude Tasks for phase tracking.

## Task Setup (Before Starting)

Create all phase tasks upfront with dependencies. See `references/task-orchestration.md`.

```
T1 = TaskCreate(subject="Scout codebase",        activeForm="Scouting codebase")
T2 = TaskCreate(subject="Diagnose root cause",    activeForm="Diagnosing root cause")
T3 = TaskCreate(subject="Implement fix",          activeForm="Implementing fix",    addBlockedBy=[T1, T2])
T4 = TaskCreate(subject="Verify + prevent",       activeForm="Verifying fix",       addBlockedBy=[T3])
T5 = TaskCreate(subject="Code review",            activeForm="Reviewing code",      addBlockedBy=[T4])
T6 = TaskCreate(subject="Finalize",               activeForm="Finalizing",          addBlockedBy=[T5])
```

## Steps

### Step 1: Scout Codebase
`TaskUpdate(T1, status="in_progress")`

**Mandatory skill chain:**
1. Activate `ck:scout` skill OR launch 2-3 parallel `Explore` subagents.
2. Map: affected files, module boundaries, dependencies, related tests, recent git changes.

**Pattern:** In SINGLE message, launch 2-3 Explore agents:
```
Task("Explore", "Find [area1] files related to issue", "Scout area1")
Task("Explore", "Find [area2] patterns/usage", "Scout area2")
Task("Explore", "Find [area3] tests/dependencies", "Scout area3")
```

See `references/parallel-exploration.md` for patterns.

`TaskUpdate(T1, status="completed")`
**Output:** `✓ Step 1: Scouted [N] areas - [M] files, [K] tests found`

### Step 2: Diagnose Root Cause
`TaskUpdate(T2, status="in_progress")`

**Mandatory skill chain:**
1. **Capture pre-fix state:** Record exact error messages, failing test output, stack traces.
2. Activate `ck:debug` skill. Use `debugger` subagent if needed.
3. Activate `ck:sequential-thinking` — form hypotheses through structured reasoning.
4. Spawn parallel `Explore` subagents to test hypotheses against codebase evidence.
5. If 2+ hypotheses fail → auto-activate `ck:problem-solving`.
6. Trace backward to root cause (not just symptom location).

See `references/diagnosis-protocol.md` for full methodology.

`TaskUpdate(T2, status="completed")`
**Output:** `✓ Step 2: Diagnosed - Root cause: [summary], Evidence: [brief], Scope: [N files]`

### Step 3: Implement Fix
`TaskUpdate(T3, status="in_progress")` — auto-unblocked when T1 + T2 complete.

Fix the ROOT CAUSE per diagnosis findings. Not symptoms.

- Apply `ck:problem-solving` skill if stuck
- Use `ck:sequential-thinking` for complex logic
- Minimal changes. Follow existing patterns.

`TaskUpdate(T3, status="completed")`
**Output:** `✓ Step 3: Implemented - [N] files changed`

### Step 4: Verify + Prevent
`TaskUpdate(T4, status="in_progress")`

**Mandatory skill chain:**
1. **Iron-law verify:** Re-run the EXACT commands from pre-fix state capture. Compare before/after.
2. **Regression test:** Add/update test(s) covering the fixed issue. Test MUST fail without fix, pass with fix.
3. **Defense-in-depth:** Apply prevention layers where applicable (see `references/prevention-gate.md`).
4. **Parallel verification:** Launch `Bash` agents:
```
Task("Bash", "Run typecheck", "Verify types")
Task("Bash", "Run lint", "Verify lint")
Task("Bash", "Run build", "Verify build")
Task("Bash", "Run tests", "Verify tests")
```

**If verification fails:** Loop back to Step 2 (re-diagnose). Max 3 attempts.

`TaskUpdate(T4, status="completed")`
**Output:** `✓ Step 4: Verified + Prevented - [before/after], [N] tests added, [M] guards`

### Step 5: Code Review
`TaskUpdate(T5, status="in_progress")`
Use `code-reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

`TaskUpdate(T5, status="completed")`
**Output:** `✓ Step 5: Review [score]/10 - [status]`

### Step 6: Finalize
`TaskUpdate(T6, status="in_progress")`
- Report summary: root cause, changes, prevention measures, confidence score
- Activate `ck:project-management` for task sync-back and plan status updates
- Update docs if needed via `docs-manager`
- Ask to commit via `git-manager` subagent
- Run `/ck:journal`

`TaskUpdate(T6, status="completed")`
**Output:** `✓ Step 6: Complete - [action]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `ck:scout` OR parallel `Explore` subagents |
| 2 | `ck:debug`, `ck:sequential-thinking`, `debugger` subagent, parallel `Explore`, (`ck:problem-solving` auto) |
| 3 | `ck:problem-solving` (if stuck), `ck:sequential-thinking` (complex logic) |
| 4 | `tester` subagent, parallel `Bash` verification |
| 5 | `code-reviewer` subagent |
| 6 | `ck:project-management`, `git-manager`, `docs-manager` subagents |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `ck:chrome-devtools` or any relevant skills/tools to verify.
**Visual Assets:** Use `ck:ai-multimodal` for visual assets generation, analysis and verification.
