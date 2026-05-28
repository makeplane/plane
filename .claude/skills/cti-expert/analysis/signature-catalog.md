# Signature Catalog

Reference library of observable signatures used during case analysis. Organized by detection domain.

---

## Categories

| Category              | Scope                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| TEMPORAL_SIGNATURES   | Activity timing, cadence, and scheduling regularities                 |
| BEHAVIORAL_SIGNATURES | Handle construction, platform presence, and account lifecycle markers |
| NETWORK_SIGNATURES    | Connection structure, follower quality, and coordination indicators   |
| LINGUISTIC_SIGNATURES | Writing style, vocabulary, and content fingerprinting                 |

---

## TEMPORAL_SIGNATURES

### T-01: Precision Posting Interval

Automated scheduling often produces machine-precise intervals.

| Variance Window | Interpretation              |
| --------------- | --------------------------- |
| ≤ 3 minutes     | High automation probability |
| 3–15 minutes    | Possible scheduler          |
| > 15 minutes    | Likely manual               |

Regex to detect clock-hour posting:

```regex
^(0[0-9]|[01][0-9]|2[0-3]):00:\d{2}$
```

### T-02: Off-Timezone Clustering

Posts clustered outside claimed timezone's waking hours (23:00–06:00 local).

```python
def timezone_mismatch_score(post_times, claimed_tz):
    local_times = [convert_to_tz(t, claimed_tz) for t in post_times]
    off_hours = [t for t in local_times if t.hour in range(23, 6)]
    return len(off_hours) / len(local_times)
# Score > 0.40 → significant mismatch
```

### T-03: Coordinated Multi-Account Timing

Multiple accounts posting within a tight window on a recurring basis.

```
WHEN accounts_posting_within(5_minutes) >= 3
AND common_hashtag_or_content
AND recurrence >= 4_times_in_30d
THEN classify = COORDINATED_CAMPAIGN
```

### T-04: Dormancy-Burst Cycle

Long silence followed by dense activity, then silence again.

```
WHEN gap_days > 45
AND burst_posts_in_3d > 20
AND subsequent_gap > 30_days
THEN classify = DORMANCY_BURST_CYCLE
```

---

## BEHAVIORAL_SIGNATURES

### B-01: Handle Obfuscation Variants

| Substitution Class  | Characters                     | Example                 |
| ------------------- | ------------------------------ | ----------------------- |
| Numeral-alpha swap  | 0→o, 1→l/i, 3→e, 4→a, 5→s, 7→t | `j4ck5on`               |
| Symbol injection    | @ → a, $ → s, ! → i            | `c@rter`                |
| Separator insertion | \_, ., -                       | `john.doe` vs `johndoe` |
| Prefix/suffix       | real, the, official, 1, 2      | `realjohndoe`           |

Detection regex (leet numerals):

```regex
[a-z]*[013457@$!][a-z0-9@$!]*
```

### B-02: Disposable Email Fingerprints

Common patterns:

```regex
# Random prefix (bot-generated)
^[a-z]{6,12}[0-9]{3,6}@

# Known disposable TLDs
@(mailinator|guerrillamail|10minutemail|tempmail|throwam|yopmail)\.

# Plus-aliasing (privacy-aware)
\+[a-z0-9]{3,}@
```

### B-03: Account Age Disparity

Subject claims long-standing presence but account creation timestamp is recent.

```
WHEN subject.states_active_since = "2015"
AND account.created_at > 2022-01-01
THEN flag = CLAIMED_HISTORY_MISMATCH
```

### B-04: Platform Selectivity

Flag when subject avoids all high-verification platforms (LinkedIn, verified accounts) despite professional claims. Presence only on email-only or no-auth platforms indicates deliberate identity compartmentalization.

### B-05: Catch-All Email Domain

```
# Probe: send to random@targetdomain.com
# Delivery without bounce = catch-all enabled
# Implication: any address at domain is valid; enumeration useless
```

---

## NETWORK_SIGNATURES

### N-01: Follower Quality Score

Score each follower: +2 per quality signal (profile complete, >10 posts, account age >90d, following/follower ratio <5, engagement rate >1%). Max 10 per follower. Aggregate average: score < 0.30 → low-quality base (purchased or bot).

```python
# score / (len(followers) * 10)  → 0.0–1.0; threshold 0.30
```

### N-02: Coordinated Mutual Cluster

```
WHEN account_set_A follows account_set_B AND vice versa
AND all_accounts_created_within(30_days)
AND follower_quality_score < 0.35
THEN classify = INAUTHENTIC_MUTUAL_CLUSTER
```

### N-03: Hub-Spoke Coordination

One central account followed by dozens of low-quality amplifier accounts that repost exclusively from the hub.

```regex
# Repost-only bio pattern
(bot|auto|mirror|feed|relay|posts from @)
```

---

## LINGUISTIC_SIGNATURES

### L-01: Phrase Reuse Across Accounts

Build 4-gram fingerprints per account. Compute Jaccard coefficient across combined post corpora. Jaccard > 0.35 → strong authorship link.

### L-02: Capitalization and Punctuation Habits

Machine-distinctive personal style markers (regex examples):

- Oxford comma: `,\s+and\s+\w+\.$`
- Habitual ellipsis: `\w\.\.\.` (no trailing space)
- Double punctuation: `\w[!?]{2,}`

### L-03: Non-Native Language Markers

| Construction      | Probable L1      |
| ----------------- | ---------------- |
| "I am agree"      | Russian / Slavic |
| "very much thank" | CJK              |
| "since X years"   | Romance language |

### L-04: Copy-Paste Bot Content

```
WHEN jaccard(post_A, post_B) > 0.95
AND accounts_unrelated AND time_delta < 30_minutes
THEN classify = CONTENT_SYNDICATION_BOT
```

---

## Confidence Reference

| Signature               | Confidence | Key Booster              |
| ----------------------- | ---------- | ------------------------ |
| T-01 precision interval | 78%        | Multi-week consistency   |
| T-03 coordinated timing | 85%        | Recurrence count         |
| B-01 leet handle        | 72%        | Cross-platform confirm   |
| B-02 disposable email   | 90%        | Domain in known-bad list |
| N-01 follower quality   | 80%        | Sample size              |
| L-01 phrase overlap     | 82%        | Higher Jaccard           |

---

## Cross-References

- `analysis/deviation-detector.md` — BEHAVIORAL_SHIFT triggers reference B-04
- `analysis/cross-reference-engine.md` — L-01 and L-02 feed content matching
- `techniques/username-enumeration.md` — B-01 variant generation
