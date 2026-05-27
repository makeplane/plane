# Finding Framework

Structured protocol for recording, weighting, verifying, and archiving findings attached to case subjects and connections. Every data point in a case must carry a finding.

---

## Framework Overview

Findings attach to subjects and connections. They carry a type, a trust score, optional confirmation sources, and a computed strength value. Strength drives confidence level assignment.

Key properties:

| Property       | Values                                            |
| -------------- | ------------------------------------------------- |
| `type`         | PRIMARY, DERIVED, CONFIRMED, CONTESTED, ANECDOTAL |
| `trust_score`  | 1–5 integer                                       |
| `strength`     | 0.0–10.0 float (computed)                         |
| `confirmed_by` | list of finding IDs that corroborate this item    |

---

## Trust Scale

| Score | Label         | Typical Sources                                      |
| ----- | ------------- | ---------------------------------------------------- |
| 5     | Authoritative | Official registries, government records, direct API  |
| 4     | Reliable      | Established outlets, corporate websites, signed data |
| 3     | Moderate      | Blogs with verifiable history, industry publications |
| 2     | Questionable  | Anonymous forums, unverified claims                  |
| 1     | Unverified    | Cannot assess; insufficient signal                   |

### Source Reliability Scale

Complements numeric trust scores with source-level grading. Trust score rates the finding content; source reliability rates the source itself. Both recorded per finding.

| Grade | Label                | Typical Sources                           |
| ----- | -------------------- | ----------------------------------------- |
| A     | Completely Reliable  | Official registries, government records   |
| B     | Usually Reliable     | Established outlets, corporate sources    |
| C     | Fairly Reliable      | Known blogs, industry publications        |
| D     | Not Usually Reliable | Anonymous forums, unverified claims       |
| E     | Unreliable           | Known disinformation, fabricated content  |
| F     | Cannot Be Judged     | Insufficient information to assess source |

```python
def assess_source_reliability(source_url):
    """Assign source reliability grade (A-F) based on source category."""
    if is_official_registry(source_url):   return "A"
    if is_established_outlet(source_url):  return "B"
    if is_known_blog(source_url):          return "C"
    if is_anonymous_forum(source_url):     return "D"
    return "F"   # cannot judge
```

---

## Finding Types

### PRIMARY

Direct observation or primary-source record. Requires no inference.

- WHOIS records, SSL cert data, raw API output, official filings
- TypeBase: 7

```python
{
    "id": "fnd-001",
    "type": "PRIMARY",
    "source": "WHOIS lookup — target.org",
    "source_url": "https://whois.iana.org/target.org",
    "trust_score": 5,
    "content": "Registrar: Registrar Inc | Created: 2021-03-10",
    "recorded_at": "2026-01-10T09:15:00Z"
}
```

### DERIVED

Deduced from PRIMARY findings via explicit reasoning. Reasoning chain required.

- Admin email inferred from domain, location from IP geo, name from username pattern
- TypeBase: 4

```python
{
    "id": "fnd-002",
    "type": "DERIVED",
    "source": "Inference from domain ownership",
    "trust_score": 3,
    "content": "admin@target.org derived from registered domain",
    "recorded_at": "2026-01-10T09:20:00Z",
    "derivation_basis": ["fnd-001"],
    "reasoning": "Standard administrative email convention for owner-operated domains"
}
```

### CONFIRMED

Finding validated by two or more independent sources that do not share a common origin.

- Email seen on three unrelated platforms, phone in WHOIS and company registry
- TypeBase: 8

```python
{
    "id": "fnd-003",
    "type": "CONFIRMED",
    "source": "Cross-platform sweep",
    "trust_score": 5,
    "content": "analyst@target.org present on LinkedIn, GitHub, and HackerNews profiles",
    "recorded_at": "2026-01-10T10:00:00Z",
    "confirmed_by": ["fnd-004", "fnd-005"]
}
```

### CONTESTED

Directly contradicts existing case data. Triggers conflict workflow. Contributes zero strength until resolved.

- Conflicting registration dates across WHOIS providers, inconsistent name spelling
- TypeBase: 0

```python
{
    "id": "fnd-006",
    "type": "CONTESTED",
    "source": "Secondary WHOIS provider",
    "trust_score": 4,
    "content": "Domain created 2020-11-01 — conflicts with fnd-001 (2021-03-10)",
    "recorded_at": "2026-01-10T10:45:00Z",
    "contests": ["fnd-001"],
    "resolution_status": "OPEN"
}
```

### ANECDOTAL

Secondhand or unverifiable. Passed through intermediaries or from low-signal sources.

- Forum posts, unverified social media mentions, hearsay claims
- TypeBase: 2

```python
{
    "id": "fnd-007",
    "type": "ANECDOTAL",
    "source": "Reddit comment — r/netsec",
    "trust_score": 1,
    "content": "Commenter claims target.org is operated from Berlin",
    "recorded_at": "2026-01-10T11:00:00Z",
    "verification_status": "UNVERIFIED"
}
```

---

## Strength Calculation

Strength is additive, capped at 10.0.

```
Strength = TypeBase + TrustModifier + ConfirmationBonus
```

| Component         | Formula                         | Range         |
| ----------------- | ------------------------------- | ------------- |
| TypeBase          | Per-type constant (table below) | 0, 2, 4, 7, 8 |
| TrustModifier     | trust_score × 0.4               | 0.4–2.0       |
| ConfirmationBonus | +0.5 per confirming source      | max +1.5      |
| **Cap**           | min(result, 10.0)               | 0.0–10.0      |

TypeBase values:

| Type      | TypeBase |
| --------- | -------- |
| CONFIRMED | 8        |
| PRIMARY   | 7        |
| DERIVED   | 4        |
| ANECDOTAL | 2        |
| CONTESTED | 0        |

```python
TYPE_BASE = {
    "CONFIRMED":  8,
    "PRIMARY":    7,
    "DERIVED":    4,
    "ANECDOTAL":  2,
    "CONTESTED":  0,
}

def compute_strength(finding):
    base         = TYPE_BASE[finding["type"]]
    trust_mod    = finding.get("trust_score", 1) * 0.4
    confirm_cnt  = len(finding.get("confirmed_by", []))
    confirm_bonus = min(confirm_cnt * 0.5, 1.5)

    raw = base + trust_mod + confirm_bonus
    return min(raw, 10.0)
```

Strength-to-confidence mapping:

| Strength | Confidence Level |
| -------- | ---------------- |
| >= 9.0   | VERIFIED         |
| >= 7.0   | STRONG           |
| >= 5.0   | MODERATE         |
| >= 3.0   | WEAK             |
| >= 1.0   | TENTATIVE        |
| < 1.0    | CHALLENGED       |

```python
def strength_to_confidence(strength):
    if strength >= 9.0: return "VERIFIED"
    if strength >= 7.0: return "STRONG"
    if strength >= 5.0: return "MODERATE"
    if strength >= 3.0: return "WEAK"
    if strength >= 1.0: return "TENTATIVE"
    return "CHALLENGED"
```

---

## Trail Reasoning

Finding trails document the inference chain from a known subject to a conclusion.

```python
def build_finding_trail(conclusion_subject_id, steps):
    trail = {
        "id":                    generate_uuid(),
        "conclusion_subject_id": conclusion_subject_id,
        "steps": [],
        "created_at":            now(),
    }

    running_strength = 10.0
    for i, step in enumerate(steps):
        fnd = get_finding(step["finding_id"])
        step_strength = compute_strength(fnd)
        # Cumulative decay: each step erodes overall trail confidence
        running_strength = running_strength * (step_strength / 10.0)

        trail["steps"].append({
            "step_number":       i + 1,
            "subject_id":        step["subject_id"],
            "connection_id":     step.get("connection_id"),
            "finding_id":        step["finding_id"],
            "reasoning":         step["reasoning"],
            "strength_at_step":  round(running_strength, 2),
        })

    trail["trail_strength"] = round(running_strength, 2)
    return trail
```

---

## Verification Protocol

```python
def verify_finding(finding_id):
    finding = get_finding(finding_id)

    # Step 1: Recompute strength with current data
    finding["strength"] = compute_strength(finding)

    # Step 2: Cross-check confirmed_by chain integrity
    for cid in finding.get("confirmed_by", []):
        if not get_finding(cid):
            finding["confirmed_by"].remove(cid)   # prune dangling reference

    # Step 3: Flag contested findings for workflow
    if finding["type"] == "CONTESTED":
        flag_for_conflict_resolution(finding)

    # Step 4: Archive if integrity hash present
    if finding.get("content_hash"):
        validate_hash(finding["content"], finding["content_hash"])

    finding["last_verified"] = now()
    return finding


def assess_reliability(source_url):
    """Assign initial trust score based on source category."""
    if is_official_registry(source_url):   return 5
    if is_established_outlet(source_url):  return 4
    if is_known_blog(source_url):          return 3
    if is_anonymous_forum(source_url):     return 2
    return 1   # cannot assess
```

---

## Archival

Preserve findings at capture time to prevent loss or tampering.

```python
def archive_finding(source_url, content):
    ts   = now_iso()
    slug = sanitize_filename(source_url)
    path = f"./archives/{slug}_{ts}.html"

    if source_url.startswith("http"):
        ok = archive_webpage(source_url, path)
        return path if ok else None

    write_file(path, content)
    return path


def validate_archive(path, original_hash):
    content = read_file(path)
    return sha256(content) == original_hash
```

---

## Commands

```python
/record-finding   <subject_id> <type> --source <desc> --content <data>
/show-findings    <subject_id> [--detail]
/verify-finding   <finding_id>
/archive-finding  <finding_id> [url]
/show-trail       <subject_id>
/compare-findings <id1> <id2>
/flag-conflict    <finding_id> --contests <other_id>
/resolve-conflict <finding_id> --verdict <text> [--note <text>]
```

### Examples

```python
/record-finding domain-001 PRIMARY \
    --source "WHOIS lookup" \
    --content "Registrar: Registrar Inc" \
    --url "https://whois.iana.org/target.org" \
    --archive

/record-finding person-001 DERIVED \
    --source "Email pattern inference" \
    --content "admin@target.org" \
    --basis fnd-001 \
    --reasoning "Owner-operated domain standard convention"

/show-findings domain-001 --detail
/verify-finding fnd-003
/flag-conflict fnd-006 --contests fnd-001
/resolve-conflict fnd-006 --verdict "Registry A confirmed via direct query" --note "fnd-001 supersedes fnd-006"
```

---

## Strength Visualization

```
Findings for: analyst@target.org
═══════════════════════════════════════════════════════════

Overall Confidence : STRONG (strength 8.40)

Findings (3 total):
┌───────────────────────────────────────────────────────┐
│ [CONFIRMED] Cross-platform sweep                      │
│   Trust : 5/5  |  Confirmations: 2                   │
│   Strength: ███████████████████░░░ 9.50               │
└───────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────┐
│ [PRIMARY] WHOIS record                                │
│   Trust : 5/5  |  Confirmations: 0                   │
│   Strength: █████████████████░░░░░ 9.00               │
└───────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────┐
│ [DERIVED] Email pattern inference                     │
│   Trust : 3/5  |  Confirmations: 0                   │
│   Strength: ████████░░░░░░░░░░░░░░ 5.20               │
└───────────────────────────────────────────────────────┘

Recommendations:
• Seek PRIMARY finding to replace DERIVED where possible
• Archive CONFIRMED sources for preservation
```
