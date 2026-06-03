# Exposure Model

Structured assessment of a subject's observable exposure across four dimensions. Produces a letter grade with numeric subscale.

---

## Dimensions

| Dimension               | Covers                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| SURFACE_EXPOSURE        | Breadth of public-facing identity across platforms and indices      |
| CREDENTIAL_EXPOSURE     | Presence in breach dumps, password reuse, authentication weaknesses |
| REPUTATION_EXPOSURE     | Content that creates legal, professional, or social liability       |
| INFRASTRUCTURE_EXPOSURE | Technical indicators: IPs, domains, known-malicious signals         |

---

## Grading Scale

Each dimension scores 0–100 internally. The composite converts to a letter grade with numeric subscale (1–9).

| Grade | Composite Range | Operational Meaning                           |
| ----- | --------------- | --------------------------------------------- |
| A     | 0–15            | Minimal exposure; no action warranted         |
| B     | 16–30           | Low exposure; routine monitoring              |
| C     | 31–45           | Moderate exposure; analyst review recommended |
| D     | 46–65           | Significant exposure; active case warranted   |
| F1    | 66–80           | High exposure; priority escalation            |
| F2    | 81–90           | Critical exposure; immediate response         |
| F3    | 91–100          | Severe exposure; emergency protocols          |

Example: `D7` = composite score of 62 (within D band, near the F boundary).

```python
def letter_grade(composite):
    bands = [(15,"A"),(30,"B"),(45,"C"),(65,"D"),(80,"F1"),(90,"F2"),(100,"F3")]
    for ceiling, grade in bands:
        if composite <= ceiling:
            subscale = round(1 + 8 * (composite - prev_ceiling) / (ceiling - prev_ceiling))
            return f"{grade}{subscale}"
        prev_ceiling = ceiling
```

---

## 1. SURFACE_EXPOSURE (Weight: 0.22)

Measures how widely a subject's identity is distributed.

| Indicator                                                           | Points           |
| ------------------------------------------------------------------- | ---------------- |
| 5–9 confirmed platforms                                             | 12               |
| 10–19 confirmed platforms                                           | 22               |
| 20–49 confirmed platforms                                           | 32               |
| 50+ confirmed platforms                                             | 42               |
| Presence on high-sensitivity platform (dating, extremist, dark web) | +18 per platform |
| Multiple distinct personas detected                                 | +15              |
| Cross-linked accounts (subject links them explicitly)               | +8               |

```python
# see analysis/weight-engine.md for full per-indicator scoring
```

---

## 2. CREDENTIAL_EXPOSURE (Weight: 0.30)

Measures breach involvement and authentication hygiene.

| Indicator                                                  | Points |
| ---------------------------------------------------------- | ------ |
| 0 breaches                                                 | 0      |
| 1 breach                                                   | 22     |
| 2–3 breaches                                               | 40     |
| 4+ breaches                                                | 60     |
| Breach within last 12 months                               | +18    |
| Password exposed in breach                                 | +20    |
| Credential reuse detected (same password across platforms) | +45    |
| Similar password pattern across platforms                  | +25    |
| No 2FA on any confirmed account                            | +10    |
| Security question answers exposed                          | +12    |

```python
# see analysis/weight-engine.md — breach_count_score + credential_reuse_score
```

---

## 3. REPUTATION_EXPOSURE (Weight: 0.26)

Measures content-derived liability.

| Indicator                                                | Points |
| -------------------------------------------------------- | ------ |
| Inflammatory or harassing content                        | 25     |
| Misinformation or false professional claims              | 22     |
| Content contradicting stated credentials                 | 18     |
| Mass deletion detected (cover-up signal)                 | 15     |
| Archived but deleted controversial material              | 12     |
| Documented court/legal mentions                          | 30     |
| False DMCA or defamation indicators                      | 20     |
| Association with named threat actor or criminal campaign | 35     |

```python
# see analysis/weight-engine.md — content_liability_score + legal_finding_score
```

---

## 4. INFRASTRUCTURE_EXPOSURE (Weight: 0.22)

Applies to cases with IP addresses, domains, or file hashes. Threat-intelligence sourced.

| Indicator                           | Source         | Points |
| ----------------------------------- | -------------- | ------ |
| AbuseIPDB confidence 25–74%         | AbuseIPDB      | 20     |
| AbuseIPDB confidence ≥ 75%          | AbuseIPDB      | 40     |
| GreyNoise classification: malicious | GreyNoise      | 40     |
| OTX pulse count 1–2                 | AlienVault OTX | 15     |
| OTX pulse count ≥ 3                 | AlienVault OTX | 28     |
| VirusTotal: 1–2 engine detections   | VirusTotal     | 10     |
| VirusTotal: 3–9 engine detections   | VirusTotal     | 22     |
| VirusTotal: ≥ 10 engine detections  | VirusTotal     | 40     |
| Confirmed C2 / botnet node          | Any feed       | 45     |
| Active phishing infrastructure      | Any feed       | 40     |

```python
# see analysis/weight-engine.md — threat_intel_score
```

---

## 5. Composite Formula

```python
WEIGHTS = {
    "surface":        0.22,
    "credential":     0.30,
    "reputation":     0.26,
    "infrastructure": 0.22
}

def composite_exposure(subject):
    scores = {
        "surface":        surface_exposure_score(subject),
        "credential":     credential_exposure_score(subject),
        "reputation":     reputation_exposure_score(subject),
        "infrastructure": infrastructure_exposure_score(subject)
    }
    return sum(scores[k] * WEIGHTS[k] for k in scores)
```

---

## 6. Trend Indicators

```
IMPROVING:  composite_now < composite_30d_ago * 0.80 AND duration > 30d
STABLE:     |composite_now - composite_30d_ago| < 8
WORSENING:  composite_now > composite_30d_ago * 1.25 AND new_indicators > 1
```

---

## 7. Report Template

```
EXPOSURE ASSESSMENT
Subject: [identifier]
Date: [date]

GRADE: [A–F3]  COMPOSITE: [X/100]
TREND: [Improving / Stable / Worsening]

DIMENSION SCORES:
Surface Exposure:         [X/100]  (weight 22%)
Credential Exposure:      [X/100]  (weight 30%)
Reputation Exposure:      [X/100]  (weight 26%)
Infrastructure Exposure:  [X/100]  (weight 22%)

TOP FINDINGS:
1. [Dimension] — [Description] — [Source]
2. [Dimension] — [Description] — [Source]

RECOMMENDED ACTION: [monitor / review / escalate / emergency]
NEXT ASSESSMENT: [date]
```

---

## Cross-References

- `analysis/weight-engine.md` — per-indicator scoring formulas
- `analysis/drift-monitor.md` — tracks exposure grade changes over time
- `techniques/breach-lookup.md` — credential exposure data sources
