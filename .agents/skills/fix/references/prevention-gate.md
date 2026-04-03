# Prevention Gate

After fixing a bug, prevent the same class of issues from recurring. This step is MANDATORY.

## Core Principle

A fix without prevention is incomplete. The same bug pattern WILL recur if you only patch the symptom.

## Prevention Requirements (Check All That Apply)

### 1. Regression Test (ALWAYS required)

Every fix MUST have a test that:
- **Fails** without the fix applied (proves the test catches the bug)
- **Passes** with the fix applied (proves the fix works)

```
If no test framework exists:
  → Add inline verification or assertion at minimum
  → Note in report: "No test framework — added runtime assertion"
```

### 2. Defense-in-Depth Validation (When applicable)

Apply layered validation from `ck:debug` defense-in-depth technique:

| Layer | Apply When | Example |
|-------|-----------|---------|
| **Entry point validation** | Fix involves user/external input | Reject invalid input at API boundary |
| **Business logic validation** | Fix involves data processing | Assert data makes sense for operation |
| **Environment guards** | Fix involves env-sensitive operations | Prevent dangerous ops in wrong context |
| **Debug instrumentation** | Fix was hard to diagnose | Add logging/context capture for forensics |

**Rule:** Not every fix needs all 4 layers. Apply what's relevant. But ALWAYS consider each.

### 3. Type Safety (When applicable)

| Scenario | Prevention |
|----------|-----------|
| Null/undefined caused the bug | Add strict null checks, use `??` or `?.` |
| Wrong type passed | Add type guard or runtime validation |
| Missing property | Add required field to interface/type |
| Implicit any | Add explicit types |

### 4. Error Handling (When applicable)

| Scenario | Prevention |
|----------|-----------|
| Unhandled promise rejection | Add `.catch()` or try/catch |
| Missing error boundary | Add error boundary component |
| Silent failure | Add explicit error logging |
| No fallback for external dependency | Add timeout + fallback |

## Verification Checklist (Before Completing Step 5)

```
□ Pre-fix state captured? (error messages, test output)
□ Fix applied to ROOT CAUSE (not symptom)?
□ Fresh verification run? (exact same commands as pre-fix)
□ Before/after comparison documented?
□ Regression test added? (fails without fix, passes with fix)
□ Defense-in-depth layers considered? (applied where relevant)
□ No new warnings/errors introduced?
□ Parallel verification passed? (typecheck + lint + build + test)
```

## Output Format

```
Prevention measures applied:
- Regression test: [test file:line] — covers [specific scenario]
- Guard added: [file:line] — [description of guard]
- Type safety: [file:line] — [what was strengthened]
- Error handling: [file:line] — [what was added]

Before/After comparison:
- Before: [exact error/failure]
- After: [exact success output]
```

## Quick Mode Prevention

For trivial issues (type errors, lint), abbreviated prevention:
- Regression test: optional (type system IS the test)
- Parallel verification: typecheck + lint only
- Defense-in-depth: skip (not applicable for type fixes)
- Still require before/after comparison of typecheck output
