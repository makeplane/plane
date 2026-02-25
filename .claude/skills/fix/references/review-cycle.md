# Review Cycle

Mode-aware review handling for code-reviewer results.

## Autonomous Mode

```
cycle = 0
LOOP:
  1. Run code-reviewer → score, critical_count, warnings, suggestions

  2. IF score >= 9.5 AND critical_count == 0:
     → Output: "✓ Review [score]/10 - Auto-approved"
     → PROCEED to next step

  3. ELSE IF critical_count > 0 AND cycle < 3:
     → Output: "⚙ Auto-fixing [N] critical issues (cycle [cycle+1]/3)"
     → Fix critical issues
     → Re-run tests
     → cycle++, GOTO LOOP

  4. ELSE IF cycle >= 3:
     → ESCALATE to user via AskUserQuestion
     → Display findings
     → Options: "Fix manually" / "Approve anyway" / "Abort"

  5. ELSE (score < 9.5, no critical):
     → Output: "✓ Review [score]/10 - Approved with [N] warnings"
     → PROCEED (warnings logged, not blocking)
```

## Human-in-the-Loop Mode

```
ALWAYS:
  1. Run code-reviewer → score, critical_count, warnings, suggestions

  2. Display findings:
     ┌─────────────────────────────────────┐
     │ Review: [score]/10                  │
     ├─────────────────────────────────────┤
     │ Critical ([N]): [list]              │
     │ Warnings ([N]): [list]              │
     │ Suggestions ([N]): [list]           │
     └─────────────────────────────────────┘

  3. Use AskUserQuestion:
     IF critical_count > 0:
       - "Fix critical issues"
       - "Fix all issues"
       - "Approve anyway"
       - "Abort"
     ELSE:
       - "Approve"
       - "Fix warnings/suggestions"
       - "Abort"

  4. Handle response:
     - Fix → implement, re-test, re-review (max 3 cycles)
     - Approve → proceed
     - Abort → stop workflow
```

## Quick Mode Review

Uses same logic as Autonomous but:
- Lower threshold: score >= 8.5 acceptable
- Only 1 auto-fix cycle before escalate
- Focus on: correctness, security, no regressions

## Critical Issues (Always Block)

- Security vulnerabilities (XSS, SQL injection, OWASP)
- Performance bottlenecks (O(n²) when O(n) possible)
- Architectural violations
- Data loss risks
- Breaking changes without migration
