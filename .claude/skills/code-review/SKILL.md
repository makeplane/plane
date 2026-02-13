---
name: code-review
description: Review code quality, receive feedback with technical rigor, verify completion claims. Use before PRs, after implementing features, when claiming task completion. Includes scout-based edge case detection.
---

# Code Review

Guide proper code review practices emphasizing technical rigor, evidence-based claims, and verification over performative responses.

## Core Principle

**YAGNI**, **KISS**, **DRY** always. Technical correctness over social comfort.
**Be honest, be brutal, straight to the point, and be concise.**

Verify before implementing. Ask before assuming. Evidence before claims.

## Three Practices

| Practice | When | Reference |
|----------|------|-----------|
| Receiving feedback | Unclear feedback, external reviewers, needs prioritization | `references/code-review-reception.md` |
| Requesting review | After tasks, before merge, stuck on problem | `references/requesting-code-review.md` |
| Verification gates | Before any completion claim, commit, PR | `references/verification-before-completion.md` |
| **Edge case scouting** | After implementation, before review | `references/edge-case-scouting.md` |

## Quick Decision Tree

```
SITUATION?
│
├─ Received feedback → STOP if unclear, verify if external, implement if human partner
├─ Completed work → Scout edge cases → Request code-reviewer subagent
└─ About to claim status → RUN verification command FIRST
```

## Receiving Feedback

**Pattern:** READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT

**Rules:**
- ❌ No performative agreement: "You're absolutely right!", "Great point!"
- ❌ No implementation before verification
- ✅ Restate, ask questions, push back with reasoning, or just work
- ✅ YAGNI check: grep for usage before implementing "proper" features

**Source handling:**
- Human partner: Trusted - implement after understanding
- External reviewers: Verify technically, check breakage, push back if wrong

**Full protocol:** `references/code-review-reception.md`

## Requesting Review

**When:** After each task, major features, before merge

**Process:**
1. **Scout edge cases first** (see below)
2. Get SHAs: `BASE_SHA=$(git rev-parse HEAD~1)` and `HEAD_SHA=$(git rev-parse HEAD)`
3. Dispatch code-reviewer subagent with: WHAT, PLAN, BASE_SHA, HEAD_SHA, DESCRIPTION
4. Fix Critical immediately, Important before proceeding

**Full protocol:** `references/requesting-code-review.md`

## Edge Case Scouting (NEW)

**When:** After implementation, before requesting code-reviewer

**Purpose:** Proactively find edge cases, side effects, and potential issues using scout skill.

**Process:**
1. Invoke `/scout` with edge-case-focused prompt
2. Scout analyzes: affected files, data flows, error paths, boundary conditions
3. Review scout findings for potential issues
4. Address critical gaps before code review

**Full protocol:** `references/edge-case-scouting.md`

## Verification Gates

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

**Gate:** IDENTIFY command → RUN full → READ output → VERIFY confirms → THEN claim

**Requirements:**
- Tests pass: Output shows 0 failures
- Build succeeds: Exit 0
- Bug fixed: Original symptom passes
- Requirements met: Checklist verified

**Red Flags:** "should"/"probably"/"seems to", satisfaction before verification, trusting agent reports

**Full protocol:** `references/verification-before-completion.md`

## Integration with Workflows

- **Subagent-Driven:** Scout edge cases → Review after EACH task → Verify before next
- **Pull Requests:** Scout → Verify tests → Code-reviewer review → Merge
- **General:** Verification gates before any status claims

## Bottom Line

1. Technical rigor over social performance
2. Scout edge cases before review
3. Evidence before claims

Verify. Scout. Question. Then implement. Evidence. Then claim.
