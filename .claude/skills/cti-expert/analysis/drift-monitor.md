# Drift Monitor

Tracks subject state over time using delta snapshots. Detects meaningful change and raises tiered alerts.

---

## Core Concept: Delta Snapshots

A **delta snapshot** is the diff between two consecutive captures of a subject's observable state. Drift monitoring compares deltas, not raw states. A single large change is less significant than a pattern of smaller changes compounding in the same direction.

```
snapshot_t0 → snapshot_t1 = delta_1
snapshot_t1 → snapshot_t2 = delta_2
...
drift_score = f(delta_1, delta_2, ..., delta_n, direction_consistency)
```

---

## 1. Monitoring Tiers

| Tier   | Interval     | Scope                    | Use Case                         |
| ------ | ------------ | ------------------------ | -------------------------------- |
| HOURLY | Every 60 min | Profile fields only      | Active case, subject under watch |
| DAILY  | Every 24h    | Profile + recent content | Standard case monitoring         |
| WEEKLY | Every 7d     | Full state snapshot      | Background subject, low priority |

Configure per subject:

```yaml
subject: "@handle"
tier: DAILY
scope: [profile, content_last_100, follower_delta, connection_delta]
retention_days: 365
alert_on: [DRIFT_WARNING, DRIFT_CRITICAL]
```

---

## 2. Alert Severity Levels

| Level          | Meaning                       | Trigger Condition                                 |
| -------------- | ----------------------------- | ------------------------------------------------- |
| DRIFT_NOTICE   | Minor deviation, log only     | Single field changed, low significance            |
| DRIFT_WARNING  | Notable shift, analyst review | 2+ significant fields, or 1 critical field        |
| DRIFT_CRITICAL | Major event, immediate action | Identity change, mass deletion, compromise signal |

---

## 3. Delta Snapshot Structure

```python
def build_delta(snapshot_old, snapshot_new):
    return {
        "timestamp": snapshot_new.captured_at,
        "interval_hours": hours_between(snapshot_old, snapshot_new),
        "profile_deltas": diff_profile_fields(snapshot_old, snapshot_new),
        "content_added": snapshot_new.posts - snapshot_old.posts,
        "content_removed": snapshot_old.posts - snapshot_new.posts,
        "follower_net": snapshot_new.followers - snapshot_old.followers,
        "following_net": snapshot_new.following - snapshot_old.following,
        "availability": check_availability(snapshot_new.url)
    }
```

---

## 4. Field Significance Weights

| Field                        | Change Significance | Alert Threshold                                |
| ---------------------------- | ------------------- | ---------------------------------------------- |
| Username                     | 95                  | DRIFT_CRITICAL                                 |
| Account deleted/privatized   | 95                  | DRIFT_CRITICAL                                 |
| Display name                 | 40                  | DRIFT_WARNING (if combined with other changes) |
| Profile image                | 38                  | DRIFT_WARNING (if combined)                    |
| Bio text                     | 30                  | DRIFT_NOTICE                                   |
| Location field               | 50                  | DRIFT_WARNING                                  |
| Website link                 | 22                  | DRIFT_NOTICE                                   |
| Mass content deletion (>20%) | 82                  | DRIFT_CRITICAL                                 |
| Selective deletion (themed)  | 68                  | DRIFT_WARNING                                  |
| Single post deletion         | 18                  | DRIFT_NOTICE                                   |
| Follower change >25%/week    | 55                  | DRIFT_WARNING                                  |
| Following cleared to 0       | 60                  | DRIFT_CRITICAL                                 |

---

## 5. Drift Rules

**DR-01: Username Replacement**

```
WHEN delta.profile_deltas.username IS_NOT_EMPTY
THEN alert = DRIFT_CRITICAL
action = log_identity_change + trigger_handle_reindex
```

**DR-02: Mass Content Removal**

```
removal_rate = content_removed / snapshot_old.post_count

WHEN removal_rate > 0.80
THEN alert = DRIFT_CRITICAL
action = trigger_archive_recovery

WHEN removal_rate > 0.50
THEN alert = DRIFT_WARNING
action = log_mass_removal

WHEN removal_rate > 0.20
THEN alert = DRIFT_NOTICE
action = log_partial_cleanup
```

**DR-03: Selective Themed Deletion**

```
WHEN content_removed.all_share_topic(threshold=0.65)
THEN alert = DRIFT_WARNING
action = flag_reputation_management_event
```

**DR-04: Account Unavailability**

```
WHEN availability = "404" OR "suspended" OR "private"
AND previous_availability = "public"
THEN alert = DRIFT_CRITICAL
action = trigger_full_archive_recovery + note_suspension_timestamp
```

**DR-05: Compound Profile Rewrite**

```
WHEN delta.profile_deltas.field_count >= 4
AND all_changes_within(72_hours)
THEN alert = DRIFT_CRITICAL
action = flag_rebranding_or_compromise
```

---

## 6. Drift Accumulation Score

Single deltas may be individually minor but compound to significance:

```python
def accumulation_score(deltas, window_days=30):
    total = 0
    for delta in filter_by_window(deltas, window_days):
        for field, value in delta.profile_deltas.items():
            total += FIELD_SIGNIFICANCE[field]
        total += len(delta.content_removed) * 1.5
        total += abs(delta.follower_net / subject.baseline_followers) * 40

    return min(100, total)

# Thresholds
# 0–15  → stable
# 16–40 → DRIFT_NOTICE (logging only)
# 41–65 → DRIFT_WARNING (analyst review)
# 66–100 → DRIFT_CRITICAL (immediate action)
```

---

## 7. Recovery Integration

DRIFT_CRITICAL automatically triggers archive recovery workflow:

| Recovery Source          | Priority | Reliability            |
| ------------------------ | -------- | ---------------------- |
| Internet Archive Wayback | 1        | High                   |
| Archive.today            | 2        | High                   |
| Common Crawl index       | 3        | Medium (older content) |
| Google cache             | 4        | Low (ephemeral)        |

---

## 8. Alert Output Template

```
DRIFT ALERT
Level: [DRIFT_NOTICE / DRIFT_WARNING / DRIFT_CRITICAL]
Subject: [handle]
Detected: [timestamp UTC]

DELTA SUMMARY:
- Fields changed: [list]
- Content removed: [N posts]
- Follower net: [+/- N]
- Availability: [public / private / suspended / deleted]

ACCUMULATION SCORE (30d): [X/100]
RECOMMENDED ACTION: [log / review / escalate + archive]
```

---

## Cross-References

- `analysis/deviation-detector.md` — single-event deviation scoring
- `analysis/archive-explorer.md` — recovery procedures on DRIFT_CRITICAL
- `engine/workspace-state.md` — snapshot storage and retrieval
