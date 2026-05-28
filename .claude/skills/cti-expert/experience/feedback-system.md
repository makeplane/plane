# Feedback System

Investigation quality feedback loops. Surface actionable signals during and after investigation phases.

---

## Coverage Feedback

Triggers automatically after `/validate` or `/coverage` completes.

### Trigger Condition

```
if coverage_score < 60%:
    show coverage feedback
```

### Output Template

```
Coverage: [score]% ([checked]/[total] paths)  ◀ Below 60% threshold

Unchecked high-priority paths:
  • [path_label] → try: [suggested_command]
  • [path_label] → try: [suggested_command]

Run /blind-spots for a ranked gap list with suggested commands.
```

### Suggested Commands by Path Type

| Unchecked Path Category | Suggested Command   |
| ----------------------- | ------------------- |
| Identity / name query   | `/sweep --identity` |
| Breach / exposure       | `/scan --breach`    |
| Social media            | `/scan --social`    |
| Legal / court records   | `/search --legal`   |
| Domain / DNS            | `/scan --dns`       |
| Email pivot             | `/pivot --email`    |

---

## Confidence Feedback

Flags findings with `trust_score <= 2` that lack corroborating sources.

### Trigger Condition

Evaluated after any `/scan`, `/sweep`, or `/branch` command completes.

```
for each finding where trust_score <= 2 and corroboration_count == 0:
    flag for verification
```

### Output Template

```
Low-confidence findings needing corroboration:
  [F-id]  [type]  Trust: [score]/5  —  [brief description]
           └─ Suggested: /verify-finding [F-id]

[count] finding(s) flagged. Use /verify-finding [id] to add sources.
```

### Suppression

If user runs `/verify-finding` and result is still trust_score <= 2,
show once more with note: "Corroboration attempted — confidence
remains low. Document limitation in report."

---

## Investigation Quality Score — /quality

Composite 0–100 score summarizing investigation completeness.

### Command

```
/quality
```

### Scoring Formula

| Component             | Weight | Source                              |
| --------------------- | ------ | ----------------------------------- |
| Coverage              | 30%    | coverage_score from coverage matrix |
| Source diversity      | 20%    | unique source domains / findings    |
| Finding verification  | 20%    | findings with trust_score >= 3      |
| Conflict resolution   | 15%    | flagged conflicts with resolution   |
| Citation completeness | 15%    | findings with source_url present    |

```
quality_score = (
    (coverage_score        * 0.30) +
    (source_diversity_pct  * 0.20) +
    (verification_rate     * 0.20) +
    (conflict_resolution   * 0.15) +
    (citation_completeness * 0.15)
)
```

### Score Bands

| Score  | Label        | Meaning                                    |
| ------ | ------------ | ------------------------------------------ |
| 0–39   | Insufficient | Not ready for any report format            |
| 40–59  | Developing   | Executive summary only; note major gaps    |
| 60–74  | Acceptable   | Standard report with limitations section   |
| 75–89  | Strong       | Full report; document minor gaps           |
| 90–100 | Exemplary    | All paths attempted, findings corroborated |

### Output Template

```
━━━ INVESTIGATION QUALITY ━━━━━━━━━━━━━━━━━━
  Overall:              [score]/100  ([label])

  Coverage:             [val]%  × 0.30  = [component]
  Source diversity:     [val]%  × 0.20  = [component]
  Finding verification: [val]%  × 0.20  = [component]
  Conflict resolution:  [val]%  × 0.15  = [component]
  Citation completeness:[val]%  × 0.15  = [component]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top improvement actions:
  1. [action with largest score gain]
  2. [action with second-largest gain]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Tier Display Rules

| Tier         | Coverage Feedback     | Confidence Feedback   | /quality Display            |
| ------------ | --------------------- | --------------------- | --------------------------- |
| Novice       | Always show           | Always show           | Always show                 |
| Practitioner | Show after each phase | Show after each phase | Show after each phase       |
| Specialist   | Show if score < 40%   | On demand only        | On demand only (`/quality`) |

### Phase Boundaries (Practitioner trigger points)

A "phase" ends when the user runs any of:

- `/validate`
- `/coverage`
- `/brief`
- `/report`

---

## Workspace Metadata Integration

Quality score and feedback state are persisted between sessions:

```json
{
  "feedback": {
    "last_quality_score": 82,
    "last_quality_timestamp": "<ISO-8601>",
    "low_confidence_flagged": ["F-003", "F-007"],
    "low_confidence_resolved": ["F-003"],
    "coverage_feedback_shown": true
  }
}
```

---

## Related Files

- `validation/coverage-matrix.md` — coverage_score source
- `validation/verification-checklist.md` — citation completeness data
- `analysis/confidence-scoring.md` — trust_score definitions
- `experience/skill-tiers.md` — tier display rule context
