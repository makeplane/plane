# Flow: Person Lookup

Guided 5-step flow for locating and verifying publicly available information on an individual.

---

## Flow Metadata

| Field      | Value                                                                   |
| ---------- | ----------------------------------------------------------------------- |
| Activation | `/flow person-lookup`                                                   |
| Skill tier | Novice to Practitioner                                                  |
| Duration   | 15–30 min                                                               |
| Output     | Verification report with confidence rating                              |
| Use cases  | Dating verification, professional screening, reconnecting with contacts |

---

## Ethics Notice

```
Before starting, confirm:

  ✓ You have a lawful purpose for this lookup
  ✓ You will handle findings per applicable privacy law
  ✓ You will secure any personal data discovered

For employment or tenancy screening:
  Consent, FCRA compliance, and disclosure rules may apply.

This tool accesses PUBLIC data only.
Proceed? (yes / no)
```

---

## Step 1: Case Setup

### 1a — Lookup Purpose

```
Step 1 of 5  |  Case Setup

Why are you doing this lookup?

  1. Online connection verification (dating, social)
  2. Professional background check
  3. Reconnecting with a lost contact
  4. Business or vendor screening
  5. Personal safety concern
  6. Other — describe: _

Purpose (1–6 or describe):
```

Purpose shapes the flow's focus areas:

| Purpose           | Primary Focus                   | Special Handling             |
| ----------------- | ------------------------------- | ---------------------------- |
| Online connection | Identity, photo, consistency    | Scam pattern detection first |
| Professional      | Career history, credentials     | LinkedIn-anchored            |
| Reconnecting      | Contact information, location   | Privacy-first collection     |
| Business          | Affiliations, reputation        | Corporate context            |
| Safety            | Risk flags, behavioral patterns | Immediate risk assessment    |

### 1b — Subject Information

```
Subject details:

Required:
  Full name: _

Recommended (improves match accuracy):
  Approximate age or birth year: _
  City or region: _

Optional:
  Known aliases or nicknames: _
  Occupation or employer: _
  Email address: _
```

### 1c — Identity Disambiguation

When multiple subjects match:

```
Found 23 people named "John Smith" in Boston.

Top candidates:
  [1] John Smith, ~34, Jamaica Plain — educator
  [2] John Smith, ~29, Back Bay — marketing
  [3] John Smith, ~41, Cambridge — consultant

Can you narrow it down?
  Approximate age?  Neighborhood?  Occupation?

Additional details: _
```

---

## Step 2: Platform Discovery

System checks professional networks, social media, and public directories.

```
Step 2 of 5 — Platform Discovery
[████████░░] 80%

  ✓ LinkedIn
  ✓ Facebook
  ✓ Twitter/X
  ⏳ Instagram
  ○ TikTok
  ○ GitHub
```

### Discovery Summary

```
Platform findings for John Smith (Boston):

Strong presence:
  LinkedIn    — active, complete work history
  Twitter/X   — personal account, active
  Facebook    — personal, restricted visibility

Moderate presence:
  Instagram   — private account
  Company site — listed as employee

Not found:
  TikTok · GitHub · YouTube

Assessment: Normal footprint for age and occupation.
```

---

## Step 3: Consistency Check

Cross-references all found data for contradictions, timeline gaps, authenticity signals.

```
Step 3 of 5 — Consistency Check
[████████░░] 80%
```

### Cross-Platform Matrix

```
Check                 Result
──────────────────────────────────────
Name across platforms  ✓ Consistent
Photos across accounts ✓ Match
Location claims        ✓ Boston area
Current employer       ✓ TechCorp confirmed
Prior employer         ✓ DataInc verified
Education              ✓ BU MBA confirmed
Account ages           ✓ 2010–2015 creation
Content patterns       ✓ Organic, no copy-paste
Scam indicators        ✓ None detected
```

### Red Flag Scan

```
Social engineering signals:      ✓ None
Duplicate/similar accounts:      ✓ None
AI-generated photo indicators:   ✓ None
Crypto/investment promotion:     ✓ None
New account cluster:             ✓ None

Result: NO RED FLAGS
```

---

## Step 4: Activity Timeline

Chronological reconstruction from all sources.

```
Step 4 of 5 — Timeline Construction
[██████░░░░] 60%
```

```
Timeline: John Smith

2010    Facebook account created
2015    Twitter account created
2017    Joined DataInc
2019    BU MBA completed · promoted to Senior Analyst
2021    Address change (Boston area, same city)
2023    Joined TechCorp as Marketing Manager
        Announced role publicly on Twitter
2024    Speaker at Boston Marketing Conference
        Active on LinkedIn (ongoing)

GAPS: 2011–2014 limited activity — pre-career, expected
VERDICT: Coherent, no unexplained breaks
```

---

## Step 5: Lookup Report

```
Step 5 of 5 — Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSON LOOKUP REPORT
Subject: John Smith  |  Case date: 2026-03-30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence: HIGH (87%)
Verdict:    IDENTITY CONFIRMED  ✓
Risk level: LOW (2/10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Risk Summary

```
Positive indicators:
  + 10+ year account history
  + Employment independently verified
  + Consistent photos across platforms
  + Stable location, coherent timeline
  + Organic posting behavior

Negative indicators:  None

Neutral:
  Private Instagram — normal privacy preference
  Limited public Facebook — not a concern
```

### Recommendations (Dating Verification)

```
Confirmed:  Real person · genuine photos · background checks out

Next steps:
  • Video call before meeting
  • First meeting in public
  • Inform a trusted contact of your plans

Ongoing:
  • This lookup cannot predict future behavior
  • Verify unusual claims as they arise
  • Never send money to unverified contacts
```

### Alternative Outcomes

**Requires further verification:**

```
Confidence: MEDIUM (45%)
Concerns:
  ⚠ All accounts created within last 6 months
  ⚠ Employment unverifiable
  ⚠ Photos found on other profiles

Action: Request video call. Ask verifiable questions.
```

**Likely fabricated identity:**

```
Confidence: LOW (15%)
  !! Photos are stock images
  !! No verifiable digital history before 3 months
  !! Inconsistent details across platforms
  !! Similar fake profiles found

Action: Cease contact. Report to platform.
```

---

## Related Files

- `experience/case-templates/tpl-due-diligence.md` — company version
- `techniques/subject-profiling.md` — manual person research
- `analysis/consistency-scoring.md` — how cross-reference scores work
