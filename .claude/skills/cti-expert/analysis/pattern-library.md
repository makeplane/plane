# Pattern Library

Reference detection patterns for identity obfuscation, disposable infrastructure, and inauthentic account behaviors. Cross-referenced with `analysis/signature-catalog.md` where applicable.

---

## 1. Username Obfuscation

Cross-ref: `analysis/signature-catalog.md` B-01

### U-01: Leet Substitution

**Description:** Replaces alpha chars with visually similar numerals/symbols (a→4/@, e→3, i→1/!, o→0, s→5/$, t→7, z→2) to evade exact-match lookups.

```python
LEET_MAP = {'4':'a','@':'a','3':'e','9':'g','1':'i','!':'i',
            '0':'o','5':'s','$':'s','7':'t','2':'z'}

def normalize_leet(handle):
    return ''.join(LEET_MAP.get(c, c) for c in handle.lower())
```

**Detection regex** (flags any handle containing substitutable chars):

```regex
[a-z0-9]*[013457@$!9|][a-z0-9@$!|]*
```

**Confidence:** 72% | **FP Rate:** 18% (numeric suffixes in legitimate handles)

---

### U-02: Separator Variants

**Description:** Inserts or removes separators (`.`, `_`, `-`) between name components. Common when primary handle is taken.

**Normalization:**

```python
def strip_separators(handle):
    return re.sub(r'[._\-]', '', handle.lower())
```

**Match logic:** normalize both candidate and known handle; if stripped forms match → variant detected.

**Confidence:** 65% | **FP Rate:** 22%

---

### U-03: Prefix / Suffix Padding

**Description:** Adds common decorators to a base identity. Frequently used to claim identity affiliation or bypass platform uniqueness constraints.

**Common prefixes:** `real`, `the`, `official`, `its`, `im`, `iam`, `hi`, `hey`
**Common suffixes:** `official`, `real`, `hq`, `1`, `2`, `3`, `_`, `__`, `xo`, `tv`, `yt`

**Detection regex:**

```regex
^(real|the|official|its|im|iam|hi|hey)(.+)$
^(.+)(official|real|hq|tv|yt|xo|1|2|3|_+)$
```

**Confidence:** 60% | **FP Rate:** 28%

---

## 2. Temporary Email Detection

Cross-ref: `analysis/signature-catalog.md` B-02

### E-01: Known Disposable Domain List

**Description:** Matches email domain against a curated list of disposable/throwaway providers.

**Top disposable domains (representative sample — full list maintained separately):**

```
mailinator.com  guerrillamail.com  10minutemail.com  tempmail.com  throwam.com
yopmail.com     maildrop.cc        sharklasers.com   tempr.email   discard.email
mailnesia.com   getnada.com        trashmail.com     trashmail.io  trashmail.me
trashmail.net   spam4.me           fakeinbox.com     mohmal.com    spamgourmet.com
dayrep.com      einrot.com         filzmail.com      gustr.com     incognitomail.com
```

**Detection:**

```python
def is_disposable_domain(email):
    domain = email.split('@')[-1].lower()
    return domain in DISPOSABLE_DOMAINS
```

**Confidence:** 90% | **FP Rate:** 2%

---

### E-02: Random-Prefix Pattern

**Description:** Bot-generated addresses typically have a random alphanumeric local part followed by digits. Distinguishes from human-chosen addresses.

**Regex:**

```regex
^[a-z]{4,12}[0-9]{3,8}@
```

**Confidence:** 68% | **FP Rate:** 12% (birthday suffixes in real addresses)

---

### E-03: Plus-Aliasing

**Description:** Plus-aliasing (`user+tag@domain`) is used by privacy-conscious users or automation to create trackable unique addresses per service.

**Regex:**

```regex
^[^+@]+\+[a-z0-9._\-]{2,}@
```

**Confidence:** 55% | **FP Rate:** 30% (legitimate privacy practice)

---

## 3. Bot Account Indicators

### BA-01: Activity Timing Regularity

**Description:** Human posting patterns have natural variance. Machine-precise intervals at sub-minute granularity indicate scheduling.

Cross-ref: `analysis/signature-catalog.md` T-01

**Rule:** Coefficient of variation (CV) of inter-post intervals. CV < 0.05 → bot-like; CV > 0.30 → human-like.

```python
def posting_regularity_score(timestamps):
    intervals = [(timestamps[i+1]-timestamps[i]).seconds for i in range(len(timestamps)-1)]
    if len(intervals) < 5: return 0.0
    mean = sum(intervals)/len(intervals)
    cv = (sum((x-mean)**2 for x in intervals)/len(intervals))**0.5 / mean
    return max(0.0, 1.0 - (cv/0.30))
```

**Confidence:** 78% when score > 0.80 | **FP Rate:** 8%

---

### BA-02: Content Duplication

**Description:** Bots often post identical or near-identical content across accounts or time windows.

Cross-ref: `analysis/signature-catalog.md` L-04

**Rule:**

```python
# Jaccard similarity on 4-gram token sets
def jaccard_4gram(text_a, text_b):
    grams_a = set(zip(*[text_a.split()[i:] for i in range(4)]))
    grams_b = set(zip(*[text_b.split()[i:] for i in range(4)]))
    if not grams_a or not grams_b:
        return 0.0
    return len(grams_a & grams_b) / len(grams_a | grams_b)

# Flag when Jaccard > 0.85 across unrelated accounts
```

**Confidence:** 84% | **FP Rate:** 5%

---

### BA-03: Profile Completeness Deficit

**Description:** Bot accounts frequently have sparse profiles: no bio, default avatar, no location, zero pinned posts.

**Scoring:** bio (+2), non-default avatar (+2), location set (+1), account age >90d (+2), pinned post (+1), link in bio (+1), verified badge (+2). Max: 11.

| Score | Assessment                    |
| ----- | ----------------------------- |
| 0–3   | HIGH bot probability          |
| 4–6   | MEDIUM — review other signals |
| 7–11  | LOW bot probability           |

**Confidence:** 65% at score 0–3 | **FP Rate:** 20%

---

### BA-04: Engagement Ratio Anomaly

**Description:** Inauthentic accounts show near-zero or unnaturally uniform engagement relative to follower count.

```python
engagement_rate = (likes + replies + shares) / max(followers, 1) / post_count
# Organic: 0.01–0.05  |  Bot: < 0.001 or std_dev < 0.0005 across posts
```

Flag: `rate < 0.001` AND `followers > 500` → purchased followers.

**Confidence:** 72% | **FP Rate:** 15%

---

## Confidence Stacking

When multiple patterns fire for the same subject, confidence compounds:

```python
def combined_confidence(scores):
    # Independent evidence model: 1 - product of (1 - p_i)
    complement = 1.0
    for s in scores:
        complement *= (1.0 - s)
    return round(1.0 - complement, 3)

# Example: U-01(0.72) + E-01(0.90) + BA-01(0.78) → combined 0.985
```

---

## Cross-References

- `analysis/signature-catalog.md` — B-01 (handle obfuscation), B-02 (disposable email), T-01 (timing), L-04 (content duplication)
- `analysis/cross-reference-engine.md` — uses U-01/U-02 normalization for cross-platform matching
- `techniques/username-osint.md` — U-01 through U-03 feed variant generation
- `techniques/email-osint.md` — E-01 through E-03 integrate into email validation pipeline
