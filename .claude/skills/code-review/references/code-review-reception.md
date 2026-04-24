---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement
---

# Code Review Reception

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## Response Pattern

```
1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One at a time, test each
```

## Forbidden Responses

❌ "You're absolutely right!" / "Great point!" / "Thanks for [anything]"
❌ "Let me implement that now" (before verification)

✅ Restate technical requirement
✅ Ask clarifying questions
✅ Push back with technical reasoning
✅ Just start working (actions > words)

## Handling Unclear Feedback

```
IF any item unclear:
  STOP - don't implement anything
  ASK for clarification on ALL unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

## Source-Specific Handling

**Human partner:** Trusted - implement after understanding, no performative agreement

**External reviewers:**
```
BEFORE implementing:
  1. Technically correct for THIS codebase?
  2. Breaks existing functionality?
  3. Reason for current implementation?
  4. Works all platforms/versions?

IF wrong: Push back with technical reasoning
IF can't verify: State limitation, ask direction
IF conflicts with partner's decisions: Stop, discuss first
```

## YAGNI Check

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage
  IF unused: "This isn't called. Remove it (YAGNI)?"
  IF used: Implement properly
```

## Implementation Order

```
1. Clarify unclear items FIRST
2. Implement: blocking → simple → complex
3. Test each individually
4. Verify no regressions
```

## When To Push Back

- Breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for stack
- Legacy/compatibility reasons
- Conflicts with architectural decisions

**How:** Technical reasoning, specific questions, reference working tests

## Acknowledging Correct Feedback

✅ "Fixed. [Brief description]"
✅ "Good catch - [issue]. Fixed in [location]."
✅ Just fix it (actions > words)

❌ ANY gratitude or performative expression

## Correcting Wrong Pushback

✅ "You were right - checked [X], it does [Y]. Implementing."
❌ Long apology, defending, over-explaining

## Quick Reference

| Mistake | Fix |
|---------|-----|
| Performative agreement | State requirement or act |
| Blind implementation | Verify against codebase |
| Batch without testing | One at a time |
| Assuming reviewer right | Check if breaks things |
| Avoiding pushback | Technical correctness > comfort |

## Bottom Line

External feedback = suggestions to evaluate, not orders.
Verify. Question. Then implement.
