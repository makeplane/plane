# Code Review Cycle

Interactive review-fix cycle used in code workflows.

Shared artifact contract: `../../_shared/references/workflow-artifacts.md`.

## Required Review Artifacts

Before finalize, commit, ship, push, PR, or deploy, create/update:

- `context-snippets.json`
- `risk-gate.json`
- `verification.json`
- `review-decision.json`
- `adversarial-validation.json` when auto, high-risk, large-diff, or ship-like

Artifact directory:

- Plan workflow: `plans/<plan-dir>/reports/harness/`
- No-plan workflow: `plans/reports/harness/<timestamp-slug>/`
- Active pointer: `.claude/workflow-artifacts.json`

Run:

```bash
node claude/hooks/workflow-artifact-gate.cjs --stage finalize --artifact-dir <artifact-dir>
```

## Risk Triggers

Add adversarial validation for:

| Trigger                                | Required Lens         |
| -------------------------------------- | --------------------- |
| `--auto`                               | adversarial validator |
| auth, secrets, payments                | domain-risk reviewer  |
| DB schema, migration                   | domain-risk reviewer  |
| public API, exported contract          | domain-risk reviewer  |
| CI, deploy, release, production config | domain-risk reviewer  |
| destructive filesystem operation       | domain-risk reviewer  |
| large diff or ship/push/PR/deploy      | adversarial validator |

No majority vote. Any evidenced critical issue blocks.

## Interactive Cycle (max 3 cycles)

```
cycle = 0
LOOP:
  1. Run code-reviewer -> review-decision.json
  2. If risk trigger exists, run adversarial/domain reviewer -> adversarial-validation.json/risk-gate.json
  3. Run artifact validator
  4. Display score, decision, criticals, warnings, artifact dir, validator command
  5. AskUserQuestion:
     IF validator blocks OR critical_count > 0:
       - "Fix blocking issues" -> fix, re-run tester, cycle++, LOOP
       - "Abort" -> stop
     ELSE:
       - "Approve" -> PROCEED
       - "Fix warnings/suggestions" -> fix, cycle++, LOOP
       - "Abort" -> stop
  6. IF cycle >= 3 AND user selects fix:
     -> "3 review cycles completed. Final decision required."
     -> AskUserQuestion: "Approve with noted risks" / "Abort workflow"
```

## Auto-Handling Cycle

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
     -> Auto-approve, PROCEED

  7. ELSE IF critical/blocking issue exists AND cycle < 3:
     -> Auto-fix critical issues
     -> Re-run tester and validator
     -> cycle++, LOOP

  8. ELSE:
     -> ESCALATE TO USER
```

Score is never sufficient for approval. `score >= 9.5` is only a confidence signal.

## Adversarial Validator Prompt

```
Disprove implementation claims for <phase>.
Scope: correctness, acceptance coverage, regression reachability, contracts.
Forbidden: style polish, broad rewrites, preference-only feedback.
Return JSON-ready fields:
- decision: PASS | PASS_WITH_RISK | BLOCKED
- disprovenClaims[]
- unverifiedClaims[]
- missingProof[]
- reachableRegressions[]
```

## Output Formats

- Waiting: `Step 5: Code reviewed - [decision], validator [pass|warn|block] - WAITING`
- After fix: `Step 5: Fixed [N] blockers - validator pass - Approved`
- Auto-approved: `Step 5: Review PASS - validator pass - Auto-approved`
- High-risk stop: `Step 5: High-risk auto stop - human approval required before finalize`
