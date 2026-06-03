# Workflow Review Artifacts

`ck:fix` and `ck:cook` use these JSON artifacts to make review and finalize gates deterministic. Scores are advisory. Approval comes from structured proof plus the validator.

## Artifact Directory

- Plan workflow: `plans/<plan-dir>/reports/harness/`
- No-plan workflow: `plans/reports/harness/<timestamp-slug>/`
- Active pointer: `.claude/workflow-artifacts.json`

The pointer stores only metadata:

```json
{
  "artifactDir": "plans/example/reports/harness",
  "planPath": "plans/example",
  "skill": "ck:cook",
  "mode": "auto",
  "updatedAt": "2026-05-19T00:00:00.000Z"
}
```

Do not commit generated pointer files or artifact contents unless a plan explicitly calls for archived evidence.

## Required Files

### `context-snippets.json`

```json
{
  "skill": "ck:cook",
  "mode": "auto",
  "task": "Add workflow artifact gate",
  "acceptanceCriteria": ["validator blocks high-risk auto without approval"],
  "touchpoints": ["claude/hooks/workflow-artifact-gate.cjs"],
  "publicContracts": [
    "manual command: node claude/hooks/workflow-artifact-gate.cjs --stage finalize --artifact-dir <dir>"
  ],
  "blastRadius": ["Claude hook execution", "fix/cook review cycle"],
  "scoutSummary": "Existing hooks are zero-dependency Node scripts with config-gated fail-open behavior."
}
```

Invalid: missing `mode`, empty `acceptanceCriteria`, or no `touchpoints`.

### `risk-gate.json`

```json
{
  "highRisk": true,
  "reasons": ["deploy workflow touched"],
  "autoStopRequired": true,
  "humanApproved": false,
  "largeDiff": false
}
```

High-risk means auth, secrets, payments, DB schema, public API contracts, CI/deploy/release, migrations, destructive filesystem operations, or production config. In `--auto`, `autoStopRequired: true` blocks finalize/commit/ship until `humanApproved: true`.

### `verification.json`

```json
{
  "commands": [
    {
      "command": "npm test",
      "status": "pass",
      "exitCode": 0,
      "timestamp": "2026-05-19T00:00:00.000Z",
      "summary": "All hook tests passed."
    }
  ],
  "beforeAfter": {
    "before": "score-only auto approval",
    "after": "validator-gated approval"
  }
}
```

Invalid: raw command logs, missing command summaries, or failed commands without a blocking review decision.

### `review-decision.json`

```json
{
  "decision": "PASS",
  "score": 9.6,
  "criticalCount": 0,
  "acceptanceCoverage": ["all acceptance criteria mapped to tests or manual proof"],
  "regressionProof": ["npm test passed"],
  "contractStatus": "OK",
  "blockingReasons": []
}
```

Valid decisions: `PASS`, `PASS_WITH_RISK`, `BLOCKED`. Any critical issue, blocking reason, or `BLOCKED` decision blocks hard stages.

### `adversarial-validation.json`

```json
{
  "decision": "PASS",
  "disprovenClaims": [],
  "unverifiedClaims": [],
  "missingProof": [],
  "reachableRegressions": []
}
```

Low-risk finalize may warn when this file is absent. High-risk, large-diff, auto, ship, push, PR, and deploy flows must produce it. Any disproven claim or reachable regression blocks hard stages.

## Redaction Policy

Artifacts must not contain raw secrets, API keys, bearer tokens, cookies, authorization headers, private keys, or dotenv lines. Command output must be summarized. If a snippet is needed, redact first:

```json
{
  "summary": "Request failed with Authorization header redacted.",
  "redacted": true
}
```

The validator reports only artifact field paths for secret-like content, never the value.

## Approval Rules

- Score never approves by itself.
- Any evidenced critical issue blocks.
- `PASS_WITH_RISK` may continue only on soft stages with the risk surfaced.
- Hard stages (`ship`, `push`, `pr`, `deploy`) require all five artifacts and `PASS`.
- High-risk `--auto` requires explicit human approval before finalize/commit/ship.
- If artifact generation fails, retry once. If it still fails, escalate to the user instead of bypassing.
