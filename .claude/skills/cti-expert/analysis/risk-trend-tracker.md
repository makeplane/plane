# Risk Trend Tracker

Spec for tracking exposure score changes over time and detecting drift direction. Powers the `/drift` command.

---

## Command

```
/drift [subject] [--window <days>]
```

**Options:**

| Option            | Default      | Description                                        |
| ----------------- | ------------ | -------------------------------------------------- |
| `[subject]`       | all subjects | Subject ID (`SUB-NNN`) or label to scope the trend |
| `--window <days>` | 30           | Number of days to include in trend window          |

---

## Score Recording

Every time `/exposure` is invoked, the resulting composite score is recorded as a trend data point. This is stored separately from the main activity ledger using action type `EXPOSURE_SCORED`.

> Note: `EXPOSURE_SCORED` is not part of the standard `activity_ledger` action enum defined in `engine/workspace-manager.md`. It is tracked in a dedicated `exposure_trend` structure within the workspace to avoid polluting the main ledger with high-frequency score events.

### Data Point Structure

```json
{
  "subject_id": "SUB-NNN",
  "timestamp": "{ISO-8601}",
  "composite_score": 62,
  "grade": "D7",
  "dimension_scores": {
    "SURFACE_EXPOSURE": 45,
    "CREDENTIAL_EXPOSURE": 78,
    "REPUTATION_EXPOSURE": 30,
    "INFRASTRUCTURE_EXPOSURE": 55
  },
  "triggered_by": "manual"
}
```

`triggered_by` values: `manual` (user ran `/exposure`), `scheduled` (automated re-score), `alert` (drift threshold breach).

### Recording Hook

```python
def on_exposure_complete(subject_id, result):
    point = ExposureTrendPoint(
        subject_id=subject_id,
        timestamp=utcnow(),
        composite_score=result.composite,
        grade=result.grade,
        dimension_scores=result.dimensions,
        triggered_by="manual"
    )
    workspace.exposure_trend.append(point)
```

---

## Trend Analysis

Given a time-windowed series of score data points, compute direction and velocity.

### Direction Classification

```python
def classify_trend(points):
    if len(points) < 2:
        return "INSUFFICIENT_DATA"
    scores = [p.composite_score for p in points]
    delta = scores[-1] - scores[0]
    if delta > 5:
        return "INCREASING"
    elif delta < -5:
        return "DECREASING"
    else:
        return "STABLE"
```

### Velocity

```python
def compute_velocity(points):
    if len(points) < 2:
        return 0.0
    delta_score = points[-1].composite_score - points[0].composite_score
    delta_days = (points[-1].timestamp - points[0].timestamp).days
    return round(delta_score / max(delta_days, 1), 2)  # points per day
```

Velocity interpretation:

| Velocity (pts/day) | Label            |
| ------------------ | ---------------- |
| > +2.0             | RAPID_INCREASE   |
| +0.5 to +2.0       | GRADUAL_INCREASE |
| -0.5 to +0.5       | STABLE           |
| -0.5 to -2.0       | GRADUAL_DECREASE |
| < -2.0             | RAPID_DECREASE   |

---

## ASCII Trend Chart

```
EXPOSURE DRIFT — {subject_label} ({subject_id})
Window: {start_date} → {end_date}  ({window_days}d)
Direction: {INCREASING|STABLE|DECREASING}  Velocity: {velocity} pts/day
════════════════════════════════════════════════════════════════

Score
 100 │
  90 │
  80 │                                        ●
  70 │                          ●─────────────
  60 │              ●───────────
  50 │  ●───────────
  40 │
  30 │
  20 │
  10 │
   0 └──────────────────────────────────────────── Time
     {d1}        {d2}        {d3}        {d4}

     ● = scored data point   ─ = interpolated

Grade:   {g1}         {g2}         {g3}         {g4}
Score:   {s1}         {s2}         {s3}         {s4}

────────────────────────────────────────────────────────────────
DIMENSION DRIFT
  SURFACE_EXPOSURE      : {d_surface_start} → {d_surface_end}  ({d_surface_delta:+d})
  CREDENTIAL_EXPOSURE   : {d_cred_start}   → {d_cred_end}    ({d_cred_delta:+d})
  REPUTATION_EXPOSURE   : {d_rep_start}    → {d_rep_end}     ({d_rep_delta:+d})
  INFRASTRUCTURE_EXPOSURE: {d_infra_start}  → {d_infra_end}   ({d_infra_delta:+d})

ALERT THRESHOLD: {alert_score}  Current: {current_score}  Headroom: {headroom}
════════════════════════════════════════════════════════════════
```

Chart renders using fixed 60-column width. Y-axis spans 0–100. Each data point is plotted at its proportional column position within the window. Gaps longer than `window_days / 4` days are shown as breaks in the line.

---

## Alert Thresholds

Drift alerts fire when:

| Condition                                      | Alert                  |
| ---------------------------------------------- | ---------------------- |
| Score crosses grade boundary (e.g., C→D)       | `GRADE_ESCALATION`     |
| Velocity > +2.0 pts/day over 7d                | `RAPID_INCREASE`       |
| Score reaches 80+ from below                   | `HIGH_EXPOSURE_BREACH` |
| Any dimension score increases by 20+ in window | `DIMENSION_SPIKE`      |

Alerts are surfaced as findings with weight `HIGH` and type `behavioral`.

---

## Cross-References

- `analysis/exposure-model.md` — score definitions, grade bands, dimension weights
- `analysis/drift-monitor.md` — related drift monitoring for behavioral changes
- `engine/workspace-manager.md` — workspace structure; `exposure_trend` stored alongside main workspace
