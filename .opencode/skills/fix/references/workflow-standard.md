# Standard Workflow

Full pipeline for moderate complexity issues.

## Steps

### Step 1: Debug & Investigate
Activate `debug` skill. Use `debugger` subagent if needed.

- Read error messages, logs, stack traces
- Reproduce the issue
- Trace backward to root cause
- Identify all affected files

**Output:** `✓ Step 1: Root cause - [summary], [N] files affected`

### Step 2: Parallel Scout
Launch multiple `Explore` subagents in parallel to scout and verify the root cause.

**Pattern:** In SINGLE message, launch 2-3 Explore agents:
```
Task("Explore", "Find [area1] files related to issue", "Scout area1")
Task("Explore", "Find [area2] patterns/usage", "Scout area2")
Task("Explore", "Find [area3] tests/dependencies", "Scout area3")
```

- Only if unclear which files need changes
- Find patterns, similar implementations, dependencies

See `references/parallel-exploration.md` for patterns.

**Output:** `✓ Step 2: Scouted [N] areas - Found [M] related files`

### Step 3: Implement Fix
Fix the issue following debugging findings.

- Apply `problem-solving` skill if stuck
- Use `sequential-thinking` for complex logic

**After implementation - Parallel Verification:**
Launch `Bash` agents in parallel to verify:
```
Task("Bash", "Run typecheck", "Verify types")
Task("Bash", "Run lint", "Verify lint")
Task("Bash", "Run build", "Verify build")
```

**Output:** `✓ Step 3: Implemented - [N] files, verified (types/lint/build passed)`

### Step 4: Test
Use `tester` subagent to run tests.

- Write new tests if needed
- Run existing test suite
- If fail → use `debugger`, fix, repeat

**Output:** `✓ Step 4: Tests [X/X passed]`

### Step 5: Review
Use `code-reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

**Output:** `✓ Step 5: Review [score]/10 - [status]`

### Step 6: Finalize
- Report summary to user
- Ask to commit via `git-manager` subagent
- Update docs if needed via `docs-manager`

**Output:** `✓ Step 6: Complete - [action]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `debug`, `debugger` subagent |
| 2 | Multiple `Explore` subagents in parallel (optional) |
| 3 | `problem-solving`, `sequential-thinking`, parallel `Bash` for verification |
| 4 | `tester` subagent |
| 5 | `code-reviewer` subagent |
| 6 | `git-manager`, `docs-manager` subagents |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `chrome-devtools` or any relevant skills/tools to verify. 
**Visual Assets:** Use `ai-multimodal` for visual assets generation, analysis and verification.