# Quick Workflow

Fast scout-diagnose-fix-verify cycle for simple issues.

## Steps

### Step 1: Scout (Minimal)

Locate affected file(s) and their direct dependencies only.

- Read error message → identify file path
- Check direct imports/dependencies of affected file
- Skip full codebase mapping

**Output:** `✓ Step 1: Scouted - [file], [N] direct deps`

### Step 2: Diagnose (Abbreviated)

Activate `ck:debug` skill. Activate `ck:sequential-thinking` for structured analysis.

- Read error message/logs
- **Capture pre-fix state:** Record exact error output (this is your verification baseline)
- Identify root cause (usually obvious for simple issues)
- Skip parallel hypothesis testing for trivial cases

**Output:** `✓ Step 2: Diagnosed - Root cause: [brief description]`

### Step 3: Fix & Verify

Implement the fix directly.

- Make minimal changes
- Follow existing patterns

**Parallel Verification:**
Launch `Bash` agents in parallel:

```
Task("Bash", "Run typecheck", "Verify types")
Task("Bash", "Run lint", "Verify lint")
```

**Before/After comparison:** Re-run the EXACT command from pre-fix state capture. Compare output.

See `references/parallel-exploration.md` for patterns.

**Output:** `✓ Step 3: Fixed - [N] files, verified (types/lint passed)`

### Step 4: Review + Prevent

Use `code-reviewer` subagent for quick review with explicit side-effect sweep.

Prompt: "Quick review of fix for [issue]. Check: (a) acceptance criteria met, (b) no regression to business logic in blast-radius from Step 1 scout, (c) no breaking changes to public contracts (signatures, schemas, APIs, env vars), (d) follows existing patterns, (e) no new lint/type/build errors. Score X/10. Explicitly flag any side effects."

See HARD-GATE-NO-SIDE-EFFECTS in SKILL.md — on reviewer-flagged regression → `AskUserQuestion` with 2-4 options (revert / narrow / update dependents / accept).

**Prevention (abbreviated for Quick):**

- Type errors/lint: type system IS the test → regression test optional
- Bug fixes: add at least 1 test covering the fixed scenario
- Still require before/after comparison of verification output

**Review handling:** See `references/review-cycle.md`

**Output:** `✓ Step 4: Review [score]/10 - [prevention measures]`

### Step 5: Report

Report summary to user (root cause, files changed, prevention).

**Output:** `✓ Step 5: Reported`

### Step 6: Finalize (MANDATORY — every fix)

1. **Activate `/ck:project-management` skill (MANDATORY)** → sync plan/task status if fix is part of a plan, update progress, hydrate Claude Tasks.
2. Spawn `docs-manager` subagent if API/behavior changed.
3. `TaskUpdate` to mark Claude Tasks complete.
4. Spawn `git-manager` subagent to commit.
5. Run `/ck:journal` to log decisions.

**Output:** `✓ Step 6: Finalized - sync-back complete, committed, journaled`

## Skills/Subagents Activated

| Step | Skills/Subagents                                                                   |
| ---- | ---------------------------------------------------------------------------------- |
| 1    | `ck:scout` (minimal) or direct file read                                           |
| 2    | `ck:debug`, `ck:sequential-thinking`                                               |
| 3    | Parallel `Bash` for verification                                                   |
| 4    | `code-reviewer` subagent                                                           |
| 5    | Report                                                                             |
| 6    | `/ck:project-management` (MANDATORY), `docs-manager`, `git-manager`, `/ck:journal` |

**Extra:** `ck:context-engineering` if dealing with AI/LLM code

## Notes

- Skip if review fails → escalate to Standard workflow
- Total steps: 6
- No planning phase needed
- Pre-fix state capture is STILL mandatory (even for quick fixes)
- Step 6 finalize is MANDATORY for every fix — `/ck:project-management` is NOT optional
