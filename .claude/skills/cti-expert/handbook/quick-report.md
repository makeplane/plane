# Quick Report

One-page case summary template for rapid turnaround. Plain language, no jargon.

---

## Template

```
QUICK REPORT
────────────────────────────────────────────────────────────────
Case:       [ID or label]
Subject:    [Name / handle / domain]
Date:       [YYYY-MM-DD]
Analyst:    [Name]
────────────────────────────────────────────────────────────────

BOTTOM LINE
[2–3 sentences. What did you find and does it matter?]

────────────────────────────────────────────────────────────────

FINDINGS

✓ CONFIRMED
  • [Finding in plain language — source in brackets]
  • [Finding — source]

⚠ FLAGS (unconfirmed or concerning)
  • [Finding — note confidence level]
  • [Finding — note confidence level]

○ NOTHING FOUND
  • [What was checked and returned null]
  • [What was checked and returned null]

────────────────────────────────────────────────────────────────

EXPOSURE LEVEL:   [ CRITICAL / HIGH / MODERATE / LOW / NONE ]

────────────────────────────────────────────────────────────────

RECOMMENDED ACTIONS
1. [Most urgent — do this first]
2. [Next priority]
3. [Optional / when time allows]

────────────────────────────────────────────────────────────────

GLOSSARY (add only terms used above)

Term          Plain meaning
──────────── ────────────────────────────────────────────────────
WHOIS         Domain ownership lookup
Subdomain     Secondary section of a website (e.g. mail.site.com)
Operator      Search engine filtering command (e.g. site:, filetype:)
Sweep         Systematic check across a set of discovery paths
Exposure      Degree to which a subject is at risk or publicly visible
Finding       A piece of information gathered during a case

────────────────────────────────────────────────────────────────

CONFIDENCE KEY

CONFIRMED    — 2+ independent sources agree
PROBABLE     — 1 reliable source, consistent with other findings
SUSPECTED    — single source, not cross-checked
CONTRADICTED — sources conflict, do not treat as fact
```

---

## Usage Notes

| Situation          | Adaptation                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Legal or HR matter | Switch to F4 (evidentiary) format instead — see [`output/reports/format-catalog.md`](../output/reports/format-catalog.md) |
| Exec audience      | Shorten findings to top 3 only; remove glossary                                                                           |
| Technical audience | Replace glossary with full citation list                                                                                  |
| Urgent brief       | Complete only Bottom Line + Findings + Actions                                                                            |

---

## Exposure Level Decision Guide

| Evidence type                                              | Exposure level |
| ---------------------------------------------------------- | -------------- |
| Active credential exposure (plaintext passwords, API keys) | CRITICAL       |
| Confirmed data in breach database, identity confirmed      | HIGH           |
| Suspicious findings, unconfirmed exposure                  | MODERATE       |
| Informational findings only, no confirmed harm             | LOW            |
| No concerning findings                                     | NONE           |

---

_For full multi-section reports, see [`output/reports/format-catalog.md`](../output/reports/format-catalog.md)_
