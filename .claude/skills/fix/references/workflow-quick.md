# Quick Workflow

Fast debug-fix-review cycle for simple issues.

## Steps

### Step 1: Debug
Activate `debug` skill. Find root cause quickly. Verify the root cause with multiple `Explore` subagents in parallel.
- Read error message/logs
- Locate affected file(s)
- Identify exact fix needed

**Output:** `✓ Step 1: Root cause - [brief description]`

### Step 2: Fix & Verify
Implement the fix directly.
- Make minimal changes
- Follow existing patterns

**Parallel Verification:**
Launch `Bash` agents in parallel:
```
Task("Bash", "Run typecheck", "Verify types")
Task("Bash", "Run lint", "Verify lint")
```

See `references/parallel-exploration.md` for patterns.

**Output:** `✓ Step 2: Fixed - [N] files, verified (types/lint passed)`

### Step 3: Verify
Use `code-reviewer` subagent for quick review.

Prompt: "Quick review of fix for [issue]. Check: correctness, security, no regressions. Score X/10."

**Review handling:** See `references/review-cycle.md`

**Output:** `✓ Step 3: Review [score]/10 - [status]`

### Step 4: Complete
Report summary to user.

**If autonomous mode:** Ask to commit via `git-manager` subagent if score >= 9.0
**If HITL mode:** Ask user next action

**Output:** `✓ Step 4: Complete - [action]`

## Skills/Subagents Activated

- `debug` - Always (Step 1)
- Parallel `git-manager` - Verification (Step 2)
- `code-reviewer` subagent - Always (Step 3)
- `context-engineering` - If dealing with AI/LLM code

## Notes

- Skip if review fails → escalate to Standard workflow
- Total steps: 4 (vs 5-6 in Standard/Deep)
- No planning phase needed
