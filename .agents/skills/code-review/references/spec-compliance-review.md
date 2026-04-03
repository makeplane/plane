---
name: spec-compliance-review
description: First-pass review checking implementation matches spec/plan requirements before quality review
---

# Spec Compliance Review

## Purpose

Verify implementation matches what was requested BEFORE evaluating code quality.
Well-written code that doesn't match requirements is still wrong.

## When to Use

- After implementing features from a plan
- Before code quality review pass
- When plan/spec exists for the work being reviewed

## Process

1. **Load spec/plan** — Read the plan.md or phase file that defined this work
2. **List requirements** — Extract every requirement, acceptance criterion
3. **Check each requirement** against actual implementation:
   - Present? → PASS
   - Missing? → MISSING (must fix before quality review)
   - Extra (not in spec)? → EXTRA (flag for removal unless justified)
4. **Verdict:**
   - All requirements met, no unjustified extras → PASS → proceed to quality review
   - Missing requirements → FAIL → implementer fixes → re-review
   - Unjustified extras → WARN → discuss with user

## Checklist Template

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | [from spec] | PASS/MISSING/EXTRA | [evidence] |

## Red Flags

- Skipping spec review because "code looks good"
- Accepting extra features without spec justification
- Treating spec review as optional
- Reviewing code quality before confirming spec compliance
