# WF-Threat-Analyst: Threat Intelligence Case Workflow

Analyst-centric workflow for building threat intelligence from open-source discovery.

---

## Phase Overview

| Phase            | Goal                                 | Output            |
| ---------------- | ------------------------------------ | ----------------- |
| 1. Tasking       | Define intelligence requirement      | IR card           |
| 2. Collection    | Gather raw indicators and actor data | Raw findings log  |
| 3. Processing    | Structure, tag, and score findings   | Findings table    |
| 4. Analysis      | Attribute, pattern-match, assess     | Analysis memo     |
| 5. Dissemination | Produce actionable output            | Threat brief (F6) |

---

## Phase 1 — Tasking

**Define the Intelligence Requirement (IR):**

| Field            | Content                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Question         | Specific, answerable (e.g., "What initial access TTPs target FS sector Q2 2026?") |
| Priority         | CRITICAL / HIGH / MEDIUM / LOW                                                    |
| Consumer         | Who receives the output (SOC, CISO, response team)                                |
| Deadline         | Hard date                                                                         |
| Success criteria | What constitutes a complete answer                                                |

---

## Phase 2 — Collection

**Discovery paths by indicator type:**

| Indicator type         | Discovery paths                                                  |
| ---------------------- | ---------------------------------------------------------------- |
| IP address             | Shodan, Censys, AbuseIPDB, passive DNS, BGP data                 |
| Domain                 | WHOIS history, DNS records, certificate transparency, VirusTotal |
| File hash              | VirusTotal, MalwareBazaar, Hybrid Analysis, Any.run              |
| Email                  | Header analysis, breach exposure, domain ownership               |
| Handle / alias         | Username sweep across platforms, forum indexing                  |
| Infrastructure cluster | ASN pivot, SSL cert pivot, registrar pivot                       |

**Collection rules:**

- Log every query: tool, query string, timestamp, result count
- Archive all source pages before closing
- Mark null results explicitly — absence of finding is a finding

---

## Phase 3 — Processing

**For each raw indicator collected:**

| Step | Action                                                            |
| ---- | ----------------------------------------------------------------- |
| 3.1  | Assign finding ID (`FND-NNN`)                                     |
| 3.2  | Tag type: IP / domain / hash / credential / behavioral / identity |
| 3.3  | Score weight: CRITICAL / HIGH / MEDIUM / LOW                      |
| 3.4  | Rate confidence: 0–100                                            |
| 3.5  | Link to subject (`SUB-NNN`) — create subject if new               |
| 3.6  | Note first-seen / last-seen dates                                 |
| 3.7  | Check false-positive risk (known-good lists)                      |

**IOC quality gate:**

| Score  | Action                                   |
| ------ | ---------------------------------------- |
| 85–100 | Operationalize: block, detect, alert     |
| 65–84  | Monitor: watchlist, hunting query        |
| 40–64  | Context only: do not block on this alone |
| < 40   | Discard or archive pending corroboration |

---

## Phase 4 — Analysis

| Task              | Method                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Map TTPs          | MITRE ATT&CK technique IDs                                                     |
| Attribute actor   | Compare infra, code, timing patterns to known profiles                         |
| Assess confidence | Apply attribution levels (Strategic 90%+ / Tactical 70–89% / Suspected 50–69%) |
| Find gaps         | List what is unknown; do not speculate past findings                           |
| Premortem         | What alternative explanations exist?                                           |

**Attribution documentation (required):**

```
Actor hypothesis:    [name or "unknown"]
Confidence level:    [%]
Supporting findings: [FND-IDs]
Counter-indicators:  [list or "none"]
Intelligence gaps:   [list]
```

---

## Phase 5 — Dissemination

**Select output format by consumer:**

| Consumer          | Format              | See                                                                       |
| ----------------- | ------------------- | ------------------------------------------------------------------------- |
| SOC / IR team     | F6 threat-brief     | [`output/reports/format-catalog.md`](../output/reports/format-catalog.md) |
| CISO              | F1 leadership-brief |                                                                           |
| Analyst archive   | F2 full-analysis    |                                                                           |
| Sharing community | STIX 2.1 export     | [`output/reports/export-specs.md`](../output/reports/export-specs.md)     |

**Pre-release checklist:**

- [ ] No active source or method revealed
- [ ] Attribution confidence stated explicitly
- [ ] Victim identifiers removed (unless necessary)
- [ ] IOCs marked with freshness date (stale IOCs noted)
- [ ] All claims traceable to a finding ID

---

## Analyst Bias Controls

| Bias              | Mitigation                                                         |
| ----------------- | ------------------------------------------------------------------ |
| Confirmation bias | List counter-findings before writing conclusion                    |
| Attribution creep | Require 2+ independent indicators per attribution claim            |
| Over-confidence   | Default to lower confidence tier when findings are borderline      |
| Availability bias | Check that finding weight reflects findings, not how recently seen |
