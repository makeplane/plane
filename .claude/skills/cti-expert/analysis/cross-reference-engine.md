# Cross-Reference Engine

Graph-based system for quantifying the strength of connections between subjects.

---

## Architecture Overview

The engine models subjects as nodes in a weighted graph. Each finding that links two nodes contributes edge weight. Confidence propagates from high-certainty anchors (email exact match, biometric match) through weaker signals using a decay function.

```
node_A ──[w=0.95]── node_B   (email exact match)
node_B ──[w=0.61]── node_C   (handle variant)
node_A ──[w=0.25]── node_C   (propagated: 0.95 × 0.61 × decay)
```

---

## 1. Matching Algorithms

### Exact Matching

| Match Type                       | Normalization Applied                    | Weight |
| -------------------------------- | ---------------------------------------- | ------ |
| Email (exact)                    | lowercase, strip dots, strip plus-suffix | 0.95   |
| Username (exact, cross-platform) | lowercase, strip punctuation             | 0.90   |
| Phone number (normalized)        | E.164 format, strip country prefixes     | 0.93   |
| Profile image (perceptual hash)  | pHash distance ≤ 4                       | 0.88   |

Email normalization:

```python
def normalize_email(raw):
    local, domain = raw.lower().split("@")
    if "gmail" in domain:
        local = local.replace(".", "")
    local = local.split("+")[0]
    return f"{local}@{domain}"
```

### Fuzzy Matching

**Handle Similarity (Levenshtein + Leet Bonus):**

```python
def handle_similarity(h1, h2):
    h1n, h2n = normalize_handle(h1), normalize_handle(h2)
    lev_distance = levenshtein(h1n, h2n)
    max_len = max(len(h1n), len(h2n))
    base_sim = 1.0 - (lev_distance / max_len)

    # Leet substitution adds signal of deliberate variation
    if leet_substitution_detected(h1n, h2n):
        base_sim = min(1.0, base_sim + 0.12)

    return base_sim

# Branch if similarity >= 0.82
```

**Content Similarity (Jaccard for short-form, TF-IDF cosine for long-form):**

```python
def content_cross_reference(text_A, text_B):
    if max(len(text_A), len(text_B)) < 280:
        # Jaccard similarity coefficient
        tokens_A = set(tokenize(text_A))
        tokens_B = set(tokenize(text_B))
        intersection = tokens_A & tokens_B
        union = tokens_A | tokens_B
        return len(intersection) / len(union)
    else:
        # TF-IDF cosine for longer content
        vec_A = tfidf_vector(text_A)
        vec_B = tfidf_vector(text_B)
        return cosine_similarity(vec_A, vec_B)
```

---

## 2. Attribute Weight Table

| Attribute                    | Match Type           | Edge Weight |
| ---------------------------- | -------------------- | ----------- |
| Email address                | Exact (normalized)   | 0.95        |
| Phone number                 | Exact (E.164)        | 0.93        |
| Profile image                | Perceptual hash ≤4   | 0.88        |
| Username                     | Exact cross-platform | 0.90        |
| Username                     | Fuzzy (sim ≥ 0.82)   | 0.62        |
| Bio text                     | Jaccard ≥ 0.70       | 0.55        |
| Location (exact)             | String match         | 0.30        |
| Posting timezone overlap     | Window ≤ 2h          | 0.35        |
| Content duplicate            | Jaccard ≥ 0.85       | 0.72        |
| Content similar              | Jaccard 0.60–0.85    | 0.42        |
| Network proximity (degree-1) | Direct follow        | 0.40        |
| Network proximity (degree-2) | Mutual connection    | 0.25        |

---

## 3. Composite Cross-Reference Score

Aggregates across all collected findings:

```python
def cross_reference_score(subject_A, subject_B, findings):
    weighted_sum = 0.0

    weighted_sum += findings.email_match     * 0.30
    weighted_sum += findings.username_match  * 0.25
    weighted_sum += findings.content_match   * 0.18
    weighted_sum += findings.temporal_match  * 0.15
    weighted_sum += findings.network_match   * 0.12

    return weighted_sum  # 0.0–1.0
```

### Interpretation

| Score     | Classification         | Recommended Action                   |
| --------- | ---------------------- | ------------------------------------ |
| 0.90–1.00 | Confirmed same subject | Merge nodes; treat as single subject |
| 0.75–0.89 | Highly probable match  | Deep verification before merge       |
| 0.55–0.74 | Probable connection    | Investigate connection type          |
| 0.35–0.54 | Possible link          | Expand findings before concluding    |
| 0.15–0.34 | Weak signal            | Monitor; do not expand yet           |
| 0.00–0.14 | No meaningful link     | Disregard                            |

---

## 4. Confidence Propagation

Confidence decays per graph hop: `weight * (0.65 ^ (hops - 1))`. A direct 0.88 edge becomes 0.57 at 2 hops and 0.37 at 3. Do not auto-branch beyond 3 hops without additional corroboration.

---

## 5. Temporal Cross-Reference

Posting synchronization across platforms is a strong link signal:

```
WHEN |post_time_A - post_time_B| < 4 minutes
AND content_jaccard > 0.65
AND occurs >= 3 times
THEN temporal_link_weight = HIGH (0.80)

WHEN daily_activity_histogram_A correlates with histogram_B (r > 0.78)
AND timezone_delta < 90_minutes
THEN operator_overlap_probability = HIGH
```

---

## 6. Network Proximity Scoring

| Proximity Type                           | Score |
| ---------------------------------------- | ----- |
| Mutual follow                            | 0.55  |
| Direct follow (one direction)            | 0.40  |
| Shared follower cluster (quality ≥ 60)   | 0.30  |
| Same community (≥ 3 shared niche spaces) | 0.20  |
| No network overlap                       | 0.00  |

---

## 7. Cross-Reference Report Template

```
CROSS-REFERENCE REPORT
Subject A: [identifier]
Subject B: [identifier]
Date: [date]

COMPOSITE SCORE: [0.00–1.00]
CLASSIFICATION: [see interpretation table]

FINDING BREAKDOWN:
- Email match:    [weight] — [detail]
- Handle match:   [weight] — [detail]
- Content match:  [weight] — [detail]
- Temporal match: [weight] — [detail]
- Network match:  [weight] — [detail]

KEY FINDINGS:
1. [Finding with source]
2. [Finding with source]

CONFIDENCE: [X%]
VERIFICATION STATUS: [confirmed / probable / needs expansion]
```

---

## Cross-References

- `analysis/auto-branch-rules.md` — triggers that spawn cross-reference evaluation
- `analysis/signature-catalog.md` — LINGUISTIC_SIGNATURES for content matching
- `engine/subject-graph.md` — graph storage and traversal
