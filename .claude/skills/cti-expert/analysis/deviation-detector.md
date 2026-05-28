# Deviation Detector

Flags subjects whose observed behavior diverges from their established baseline.

---

## Detection Categories

| Category         | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| BEHAVIORAL_SHIFT | Content type, tone, or engagement style changes materially           |
| TEMPORAL_GAP     | Posting cadence interrupted without explanation                      |
| PATTERN_BREAK    | Established routine is abandoned abruptly                            |
| VOLUME_SPIKE     | Output rate exceeds baseline by a defined multiplier                 |
| IDENTITY_DRIFT   | Profile attributes shift in ways inconsistent with natural evolution |

---

## 1. Baseline Construction

Collect a minimum two-week observation window before scoring.

| Metric                | Capture Method                  |
| --------------------- | ------------------------------- |
| Posts per day         | Rolling 14-day median           |
| Active hours          | Hour-of-day frequency histogram |
| Dominant content type | Category with >50% share        |
| Engagement rate       | (likes + replies) / impressions |
| Follower delta        | Weekly net change               |

---

## 2. Detection Rules

Format: WHEN [condition] THEN [classification] FLAG [severity]

**TEMPORAL_GAP**

```
WHEN posts_last_30d = 0
AND posts_prior_30d >= 20
THEN classify = TEMPORAL_GAP
FLAG = DRIFT_WARNING
confidence = 72%
```

```
WHEN no_activity_streak >= 14_days
AND subject_historically_posts_daily
THEN classify = TEMPORAL_GAP
FLAG = DRIFT_CRITICAL
confidence = 85%
```

**VOLUME_SPIKE**

```
WHEN posts_in_24h > (daily_median * 8)
THEN classify = VOLUME_SPIKE
FLAG = DRIFT_WARNING
confidence = 80%
```

```
WHEN posts_in_1h > (hourly_median * 20)
THEN classify = VOLUME_SPIKE
FLAG = DRIFT_CRITICAL
confidence = 90%
```

**TEMPORAL_GAP / timezone**

```
WHEN posts_clustered_between(03:00, 06:00, local_claimed_tz)
AND streak >= 5_days
THEN classify = BEHAVIORAL_SHIFT
FLAG = DRIFT_NOTICE
confidence = 65%
```

**IDENTITY_DRIFT**

```
WHEN display_name changed
AND bio changed
AND profile_image changed
AND all_within(72_hours)
THEN classify = IDENTITY_DRIFT
FLAG = DRIFT_CRITICAL
confidence = 88%
```

**PATTERN_BREAK**

```
WHEN content_category_distribution shifts > 60%
COMPARED_TO 30_day_baseline
THEN classify = PATTERN_BREAK
FLAG = DRIFT_WARNING
confidence = 70%
```

---

## 3. Deviation Thresholds

| Metric                 | Baseline Range | DRIFT_NOTICE | DRIFT_WARNING | DRIFT_CRITICAL |
| ---------------------- | -------------- | ------------ | ------------- | -------------- |
| Posts/day              | ±25% of median | 1.5x–2x      | 2x–5x         | >5x or =0      |
| Active hours           | Within window  | 2h outside   | 4h outside    | >6h outside    |
| Content type match     | >75%           | 60–75%       | 40–60%        | <40%           |
| Engagement rate        | ±25%           | ±50%         | ±75%          | >2x or <0.3x   |
| Follower weekly delta  | ±4%            | 5–10%        | 10–20%        | >20%           |
| Profile fields changed | 0–1            | 2            | 3             | 4+             |

---

## 4. Scoring

```python
def deviation_score(subject, baseline):
    score = 0

    if temporal_gap_detected(subject, baseline):
        score += 28

    if volume_spike_detected(subject, baseline):
        score += 22

    if pattern_break_detected(subject, baseline):
        score += 18

    if identity_drift_detected(subject, baseline):
        score += 20

    if behavioral_shift_detected(subject, baseline):
        score += 12

    # cross-platform confirmation raises confidence
    if cross_platform_corroboration(subject):
        score = min(100, score * 1.15)

    return score

# Interpretation
# 0–20   → within normal variance
# 21–45  → DRIFT_NOTICE — log, revisit in 72h
# 46–70  → DRIFT_WARNING — prioritize case review
# 71–100 → DRIFT_CRITICAL — immediate case action
```

---

## 5. False-Positive Filters

WHEN a deviation fires, check these suppressors before escalating:

| Deviation Type   | Common Legitimate Cause             | Suppressor Check                               |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| TEMPORAL_GAP     | Holiday, illness, device loss       | Search subject's posts for travel/OOO mentions |
| VOLUME_SPIKE     | Viral content, coordinated campaign | Check engagement source quality                |
| IDENTITY_DRIFT   | Platform rebrand, marriage          | Check for announcement posts                   |
| PATTERN_BREAK    | Life event, job change              | Cross-reference LinkedIn updates               |
| BEHAVIORAL_SHIFT | Night shift, timezone change        | Verify consistency across 2+ weeks             |

---

## 6. Report Template

```
DEVIATION DETECTION SUMMARY
Subject: [handle / identifier]
Baseline window: [date range]
Analysis date: [date]

DEVIATIONS FLAGGED:
1. [Category] — [description] — [severity] — confidence [X%]

COMPOSITE SCORE: [X/100]
VERDICT: [within variance / DRIFT_NOTICE / DRIFT_WARNING / DRIFT_CRITICAL]

SUPPRESSOR STATUS: [clear / suppressed — reason]
RECOMMENDED ACTION: [monitor / review / escalate]
```

---

## Cross-References

- `analysis/drift-monitor.md` — longitudinal tracking of deviation trends
- `analysis/signature-catalog.md` — TEMPORAL_SIGNATURES for baseline construction
- `engine/subject-graph.md` — graph context for behavioral comparison
