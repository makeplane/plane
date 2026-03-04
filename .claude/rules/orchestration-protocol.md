---
paths:
  - plans/**
---

# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning subagents via Task tool, **ALWAYS** include in prompt:

1. **Work Context Path**: Git root of PRIMARY files being worked on
2. **Reports Path**: `{work_context}/plans/reports/`
3. **Plans Path**: `{work_context}/plans/`

**Rule:** If CWD differs from work context, use **work context paths**, not CWD.

---

#### Sequential Chaining

Chain when tasks have dependencies:

- Planning → Implementation → Simplification → Testing → Review
- Research → Design → Code → Documentation
- Each agent completes fully before next begins
- Pass context/outputs between agents

#### Parallel Execution

Spawn simultaneously for independent tasks:

- Code + Tests + Docs for non-conflicting components
- Multiple feature branches on isolated features
- Ensure no file conflicts or shared resource contention
- Plan integration points before parallel execution
