# Review Cycle

Mode-aware review handling for fixes.

Shared artifact contract: `../../_shared/references/workflow-artifacts.md`.

## Required Review Artifacts

Before finalize, commit, ship, push, PR, or deploy, produce:

- `context-snippets.json`: root cause, repro, blast radius, contracts
- `risk-gate.json`: high-risk classification and auto-stop state
- `verification.json`: exact repro rerun, tests, side-effect sweep
- `review-decision.json`: code-reviewer decision
- `adversarial-validation.json`: required for auto/high-risk/large-diff/ship-like work

Run:

```bash
node claude/hooks/workflow-artifact-gate.cjs --stage finalize --artifact-dir <artifact-dir>
```

## Autonomous Mode

```
cycle = 0
LOOP:
  1. Run code-reviewer -> review-decision.json
  2. Run risk gate -> risk-gate.json
  3. If auto/high-risk/large-diff/ship-like, run adversarial validator
  4. Run artifact validator

  5. IF risk-gate.autoStopRequired == true AND humanApproved != true:
     -> STOP via AskUserQuestion before finalize/commit/ship

  6. IF review-decision.decision == PASS
     AND validator passes
     AND risk-gate.autoStopRequired == false:
     -> Output: "Review PASS - validator pass - Auto-approved"
     -> PROCEED

  7. ELSE IF blocking issue exists AND cycle < 3:
     -> Output: "Auto-fixing blocking issues (cycle [cycle+1]/3)"
     -> Fix issues
     -> Re-run exact repro, tests, side-effect sweep, validator
     -> cycle++, GOTO LOOP

  8. ELSE:
     -> ESCALATE to user via AskUserQuestion
```

Score is advisory. It never approves by itself.

## Human-in-the-Loop Mode

```
ALWAYS:
  1. Run code-reviewer -> review-decision.json
  2. Run adversarial/domain reviewers when risk triggers exist
  3. Run artifact validator
  4. Display findings:
     - review decision, score, criticals
     - validator status and blocking reasons
     - artifact dir and manual validator command
  5. Use AskUserQuestion:
     IF validator blocks OR critical_count > 0:
       - "Fix blocking issues"
       - "Abort"
     ELSE:
       - "Approve"
       - "Fix warnings/suggestions"
       - "Abort"
  6. Handle response:
     - Fix -> implement, re-test, re-review (max 3 cycles)
     - Approve -> proceed
     - Abort -> stop workflow
```

## Quick Mode Review

Quick mode may skip adversarial validation only when all are true:

- low risk
- small diff
- no finalize/commit/ship/push/PR/deploy action requested
- exact repro and regression test pass

Otherwise use the autonomous artifact flow above.

## Critical Issues (Always Block)

- Security vulnerabilities (XSS, SQL injection, OWASP)
- Performance bottlenecks (O(n^2) when O(n) possible)
- Architectural violations
- Data loss risks
- Breaking changes without migration
- Missing proof for original symptom or blast-radius side effects
