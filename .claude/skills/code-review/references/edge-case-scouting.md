---
name: edge-case-scouting
description: Use after implementation, before code review to proactively find edge cases, side effects, and potential issues via scout skill - catches problems code-reviewer might miss
---

# Edge Case Scouting

Proactive detection of edge cases, side effects, and potential issues before code review.

## Purpose

Code reviews catch obvious issues but miss subtle side effects. Scout detects:
- Files affected by changes reviewer might not check
- Data flow paths that could break
- Boundary conditions and error paths
- Integration issues across modules

## When to Use

**Mandatory:** Multi-file features, shared utility refactors, complex bug fixes
**Optional:** Single-file changes, docs, config

## Process

### 1. Identify Changed Files
```bash
git diff --name-only HEAD~1
```

### 2. Invoke Scout
```
/scout edge cases for recent changes.

Changed: {files from git diff}

Find:
1. Files importing/depending on changed modules
2. Data flow paths through modified functions
3. Error handling paths not tested
4. Boundary conditions (null, empty, max)
5. Race conditions in async code
6. State management side effects
```

### 3. Analyze & Act

| Finding | Action |
|---------|--------|
| Affected file not in scope | Add to review |
| Data flow risk | Verify or add test |
| Edge case | Add test or verify |
| Missing test | Add before review |

### 4. Document for Review
```
Scout findings:
- {issues found}
- Verified: {what checked}
- Addressed: {what fixed}
- Needs review: {remaining}
```

## Scout Prompts

**Feature:**
```
Scout edge cases for {feature}.
Changed: {files}
Find: consumers, error states, untested inputs, performance, compatibility
```

**Bug fix:**
```
Scout side effects of fix in {file}.
Bug: {description}, Fix: {approach}
Find: other paths using logic, dependent features, similar bugs
```

**Refactor:**
```
Scout breaking changes in {module}.
Before: {old}, After: {new}
Find: importers, behavior diffs, removed functionality
```

## What Scout Catches

| Issue | Why Missed | Scout Detects |
|-------|------------|---------------|
| Indirect deps | Not in diff | Traces imports |
| Race conditions | Hard static review | Analyzes flow |
| State mutations | Hidden side effects | Tracks data |
| Missing null checks | Assumed safe | Boundary analysis |
| Integration breaks | Out of scope | Cross-module search |

## Red Flags

- Shared utility changed but only one caller tested
- Error path leads to unhandled rejection
- State modified in place without notification
- Breaking change without migration

## Example

```
1. Done: Add cache to UserService.getUser()
2. Diff: src/services/user-service.ts
3. Scout: "edge cases for caching in getUser()"
4. Report:
   - ProfileComponent expects fresh data on edit
   - AdminPanel loops getUser() (memory risk)
   - No cache clear on updateUser()
5. Fix: Add invalidation, maxSize
6. Document for code-reviewer
```

## Bottom Line

Scout before review. Don't trust "simple changes" - scout them anyway.
