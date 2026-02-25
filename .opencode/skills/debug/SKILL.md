---
name: debug
description: Debug systematically with root cause analysis before fixes. Use for bugs, test failures, unexpected behavior, performance issues, call stack tracing, multi-layer validation.
version: 3.1.0
languages: all
---

# Debugging

Comprehensive debugging framework combining systematic investigation, root cause tracing, defense-in-depth validation, and verification protocols.

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

Random fixes waste time and create new bugs. Find the root cause, fix at source, validate at every layer, verify before claiming success.

## When to Use

**Always use for:** Test failures, bugs, unexpected behavior, performance issues, build failures, integration problems, before claiming work complete

**Especially when:** Under time pressure, "quick fix" seems obvious, tried multiple fixes, don't fully understand issue, about to claim success

## The Four Techniques

### 1. Systematic Debugging (`references/systematic-debugging.md`)

Four-phase framework ensuring proper investigation:
- Phase 1: Root Cause Investigation (read errors, reproduce, check changes, gather evidence)
- Phase 2: Pattern Analysis (find working examples, compare, identify differences)
- Phase 3: Hypothesis and Testing (form theory, test minimally, verify)
- Phase 4: Implementation (create test, fix once, verify)

**Key rule:** Complete each phase before proceeding. No fixes without Phase 1.

**Load when:** Any bug/issue requiring investigation and fix

### 2. Root Cause Tracing (`references/root-cause-tracing.md`)

Trace bugs backward through call stack to find original trigger.

**Technique:** When error appears deep in execution, trace backward level-by-level until finding source where invalid data originated. Fix at source, not at symptom.

**Includes:** `scripts/find-polluter.sh` for bisecting test pollution

**Load when:** Error deep in call stack, unclear where invalid data originated

### 3. Defense-in-Depth (`references/defense-in-depth.md`)

Validate at every layer data passes through. Make bugs impossible.

**Four layers:** Entry validation → Business logic → Environment guards → Debug instrumentation

**Load when:** After finding root cause, need to add comprehensive validation

### 4. Verification (`references/verification.md`)

Run verification commands and confirm output before claiming success.

**Iron law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

Run the command. Read the output. Then claim the result.

**Load when:** About to claim work complete, fixed, or passing

## Quick Reference

```
Bug → systematic-debugging.md (Phase 1-4)
  Error deep in stack? → root-cause-tracing.md (trace backward)
  Found root cause? → defense-in-depth.md (add layers)
  About to claim success? → verification.md (verify first)
```

## Red Flags

Stop and follow process if thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "Should work now" / "Seems fixed"
- "Tests pass, we're done"

**All mean:** Return to systematic process.
