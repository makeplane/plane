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
Use `code-reviewer` subagent for quick review.

Prompt: "Quick review of fix for [issue]. Check: correctness, security, no regressions. Score X/10."

**Prevention (abbreviated for Quick):**
- Type errors/lint: type system IS the test → regression test optional
- Bug fixes: add at least 1 test covering the fixed scenario
- Still require before/after comparison of verification output

**Review handling:** See `references/review-cycle.md`

**Output:** `✓ Step 4: Review [score]/10 - [prevention measures]`

### Step 5: Complete
Report summary to user.

**If autonomous mode:** Ask to commit via `git-manager` subagent if score >= 9.0
**If HITL mode:** Ask user next action

**Output:** `✓ Step 5: Complete - [action]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `ck:scout` (minimal) or direct file read |
| 2 | `ck:debug`, `ck:sequential-thinking` |
| 3 | Parallel `Bash` for verification |
| 4 | `code-reviewer` subagent |
| 5 | `git-manager` subagent |

**Extra:** `ck:context-engineering` if dealing with AI/LLM code

## Notes

- Skip if review fails → escalate to Standard workflow
- Total steps: 5
- No planning phase needed
- Pre-fix state capture is STILL mandatory (even for quick fixes)
