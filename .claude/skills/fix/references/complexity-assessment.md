# Complexity Assessment

Classify issue complexity before routing to workflow.

## Classification Criteria

### Simple (→ workflow-quick.md)

**Indicators:**
- Single file affected
- Clear error message (type error, syntax, lint)
- Keywords: `type`, `typescript`, `tsc`, `lint`, `eslint`, `syntax`
- Obvious fix location
- No investigation needed

**Examples:**
- "Fix type error in auth.ts"
- "ESLint errors after upgrade"
- "Syntax error in config file"

### Moderate (→ workflow-standard.md)

**Indicators:**
- 2-5 files affected
- Root cause unclear but localized
- Needs debugging investigation
- Keywords: `bug`, `broken`, `not working`, `fails sometimes`
- Test failures with unclear cause

**Examples:**
- "Login sometimes fails"
- "API returns wrong data"
- "Component not rendering correctly"

### Complex (→ workflow-deep.md)

**Indicators:**
- System-wide impact (5+ files)
- Architecture decision needed
- Research required for solution
- Keywords: `architecture`, `refactor`, `system-wide`, `design issue`
- Performance/security vulnerabilities
- Multiple interacting components

**Examples:**
- "Memory leak in production"
- "Database deadlocks under load"
- "Security vulnerability in auth flow"

### Parallel (→ multiple fullstack-developer agents)

**Triggers:**
- `--parallel` flag explicitly passed (activate parallel routing regardless of auto-classification)

**Indicators:**
- 2+ independent issues mentioned
- Issues in different areas (frontend + backend, auth + payments)
- No dependencies between issues
- Keywords: list of issues, "and", "also", multiple error types

**Examples:**
- "Fix type errors AND update UI styling"
- "Auth bug + payment integration issue"
- "3 different test failures in unrelated modules"
