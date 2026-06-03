# WF-Journalist: Source Verification Workflow

Structured case workflow for journalists verifying sources before publication.

---

## Phase Overview

| Phase           | Goal                               | Output                            |
| --------------- | ---------------------------------- | --------------------------------- |
| 1. Intake       | Define what needs verification     | Subject list, scope doc           |
| 2. Verification | Confirm identity and credentials   | Verified subjects table           |
| 3. Cross-check  | Validate claims against records    | Corroboration log                 |
| 4. Report       | Produce publication-ready findings | Press-ready or evidentiary format |

---

## Phase 1 — Intake

| Step | Action                                                       | Tool / Source      |
| ---- | ------------------------------------------------------------ | ------------------ |
| 1.1  | Document source's claimed identity (name, title, org)        | Notes              |
| 1.2  | List all claims to be verified                               | Notes              |
| 1.3  | Determine classification: on-record / background / anonymous | Editorial decision |
| 1.4  | Establish legal constraints (jurisdiction, shield laws)      | Legal counsel      |
| 1.5  | Open case workspace, add source as subject                   | Case system        |

---

## Phase 2 — Verification

| Step | What to check                                          | Discovery paths                          |
| ---- | ------------------------------------------------------ | ---------------------------------------- |
| 2.1  | Employment: confirm role at claimed org                | LinkedIn, company site, press releases   |
| 2.2  | Identity: confirm real name vs. reported name          | Gov records, professional license boards |
| 2.3  | Credentials: verify degrees, certifications            | CHEA lookup, licensing board databases   |
| 2.4  | Contact channels: confirm email / phone ownership      | WHOIS, reverse lookup, header analysis   |
| 2.5  | Conflict of interest: prior employer, ownership stakes | SEC filings, SoS corporate records       |

**Confidence thresholds:**

| Level        | Criteria                                  |
| ------------ | ----------------------------------------- |
| CONFIRMED    | 2+ independent public sources agree       |
| PROBABLE     | 1 reliable source + corroborating context |
| UNVERIFIED   | Single source only, not cross-checked     |
| CONTRADICTED | Sources conflict — do not publish as fact |

---

## Phase 3 — Cross-Check

| Step | Action                                                 | Source                                      |
| ---- | ------------------------------------------------------ | ------------------------------------------- |
| 3.1  | Pull public record supporting each claim               | Court records, property records, filings    |
| 3.2  | Check for prior contradictory statements               | News archive, social media, Wayback Machine |
| 3.3  | Interview corroborating witness where possible         | Direct contact                              |
| 3.4  | Log all null results (what was checked, found nothing) | Findings log                                |
| 3.5  | Flag any claim that cannot be independently sourced    | Editorial flag                              |

---

## Phase 4 — Report

| Step | Action                                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | Produce citation list per [`output/reports/citation-guide.md`](../output/reports/citation-guide.md)                                          |
| 4.2  | Select report format: F3 (plain-summary) or F5 (press-ready) — see [`output/reports/format-catalog.md`](../output/reports/format-catalog.md) |
| 4.3  | Mark unverified claims explicitly — never omit uncertainty                                                                                   |
| 4.4  | Legal review before publication if findings carry legal exposure                                                                             |
| 4.5  | Archive all sources (Wayback Machine or local) before publish date                                                                           |

---

## Decision Gate — Publish or Hold

```
FOR each claim in article:
  IF confidence = CONFIRMED → publish with citation
  IF confidence = PROBABLE  → note "could not independently confirm" in text
  IF confidence = UNVERIFIED → hold or attribute directly to source
  IF confidence = CONTRADICTED → do not publish as fact; note dispute
```

---

## Ethical Limits

| Permitted                     | Not permitted                         |
| ----------------------------- | ------------------------------------- |
| Public records research       | Accessing private accounts            |
| Reviewing public social media | Deceiving subject to obtain info      |
| Interviewing willing contacts | Publishing PII of private individuals |
| Archiving public pages        | Pretexting (false identity)           |
