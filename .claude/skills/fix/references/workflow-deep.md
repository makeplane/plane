# Deep Workflow

Full pipeline with research, brainstorming, and planning for complex issues.

## Steps

### Step 1: Debug & Parallel Investigation
Activate `debug` skill. Launch 2-3 `Explore` subagents in parallel:
```
Task("Explore", "Find error origin", "Trace error")
Task("Explore", "Find affected components", "Map deps")
Task("Explore", "Find similar patterns", "Find patterns")
```
See `references/parallel-exploration.md` for patterns.

**Output:** `✓ Step 1: Root cause - [summary], system impact: [scope]`

### Step 2: Research
Use `researcher` subagent for external knowledge.

- Search latest docs, best practices
- Find similar issues/solutions
- Gather security advisories if relevant

**Output:** `✓ Step 2: Research complete - [key findings]`

### Step 3: Brainstorm
Activate `brainstorm` skill.

- Evaluate multiple approaches
- Consider trade-offs
- Get user input on preferred direction

**Output:** `✓ Step 3: Approach selected - [chosen approach]`

### Step 4: Plan
Use `planner` subagent to create implementation plan.

- Break down into phases
- Identify dependencies
- Define success criteria

**Output:** `✓ Step 4: Plan created - [N] phases`

### Step 5: Implement
Implement per plan. Use `context-engineering`, `sequential-thinking`, `problem-solving`.

**Parallel Verification:** Launch `Bash` agents: typecheck + lint + build
See `references/parallel-exploration.md`

**Output:** `✓ Step 5: Implemented - [N] files, [M] phases, verified`

### Step 6: Test
Use `tester` subagent.

- Comprehensive testing
- Edge cases, security, performance
- If fail → debug, fix, repeat

**Output:** `✓ Step 6: Tests [X/X passed]`

### Step 7: Review
Use `code-reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

**Output:** `✓ Step 7: Review [score]/10 - [status]`

### Step 8: Finalize
- Use `project-manager` subagent to update roadmap
- Use `docs-manager` subagent for documentation
- Use `git-manager` subagent for commit

**Output:** `✓ Step 8: Complete - [actions taken]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `debug`, parallel `Explore` subagents for investigation |
| 2 | `researcher` |
| 3 | `brainstorm` |
| 4 | `planner` |
| 5 | `problem-solving`, `sequential-thinking`, `context-engineering`, parallel `Bash` |
| 6 | `tester` |
| 7 | `code-reviewer` |
| 8 | `project-manager`, `docs-manager`, `Bash` |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `chrome-devtools` or any relevant skills/tools to verify. 
**Visual Assets:** Use `ai-multimodal` for visual assets generation, analysis and verification.