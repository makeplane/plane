# Complexity Assessment

Classify issue complexity before routing to workflow. Assessment happens AFTER Step 1 (Scout) and Step 2 (Diagnose).

## Classification Criteria

### Simple (→ workflow-quick.md) — No Tasks

**Indicators:**
- Single file affected
- Clear error message (type error, syntax, lint)
- Keywords: `type`, `typescript`, `tsc`, `lint`, `eslint`, `syntax`
- Obvious fix location
- Root cause confirmed by diagnosis (not assumed)

**Task usage:** Skip. < 3 steps, overhead exceeds benefit.

**Examples:**
- "Fix type error in auth.ts"
- "ESLint errors after upgrade"
- "Syntax error in config file"

### Moderate (→ workflow-standard.md) — Use Tasks (6 phases)

**Indicators:**
- 2-5 files affected
- Root cause identified but fix spans multiple files
- Needs investigation to confirm diagnosis
- Keywords: `bug`, `broken`, `not working`, `fails sometimes`
- Test failures with root cause traced

**Task usage:** Create 6 phase tasks with dependencies. See `references/task-orchestration.md`.

**Examples:**
- "Login sometimes fails"
- "API returns wrong data"
- "Component not rendering correctly"

### Complex (→ workflow-deep.md) — Use Tasks with Dependency Chains (9 phases)

**Indicators:**
- System-wide impact (5+ files)
- Architecture decision needed
- Research required for solution
- Keywords: `architecture`, `refactor`, `system-wide`, `design issue`
- Performance/security vulnerabilities
- Multiple interacting components
- Root cause spans multiple layers/modules

**Task usage:** Create 9 phase tasks. Steps 1+2+3 run parallel (scout+diagnose+research). Full dependency chains. See `references/task-orchestration.md`.

**Examples:**
- "Memory leak in production"
- "Database deadlocks under load"
- "Security vulnerability in auth flow"

### Parallel (→ multiple fullstack-developer agents) — Use Task Trees

**Triggers:**
- `--parallel` flag explicitly passed (activate parallel routing regardless of auto-classification)

**Indicators:**
- 2+ independent issues mentioned
- Issues in different areas (frontend + backend, auth + payments)
- No dependencies between issues
- Keywords: list of issues, "and", "also", multiple error types

**Task usage:** Create separate task trees per independent issue (each with scout+diagnose+fix+verify). Spawn `fullstack-developer` agent per tree. See `references/task-orchestration.md`.

**Examples:**
- "Fix type errors AND update UI styling"
- "Auth bug + payment integration issue"
- "3 different test failures in unrelated modules"
