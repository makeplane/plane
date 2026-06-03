# WF-Private-Investigator: Case Workflow

Open-source case workflow for licensed investigators. Emphasizes legal compliance and documentation standards.

---

## Phase Overview

| Phase              | Goal                                   | Output                       |
| ------------------ | -------------------------------------- | ---------------------------- |
| 1. Authorization   | Client scope and legal basis confirmed | Engagement letter, scope doc |
| 2. Subject Profile | Build initial subject record           | Subject registry entry       |
| 3. Locate          | Confirm current location / address     | Location finding             |
| 4. Asset Discovery | Identify subject's assets              | Asset findings log           |
| 5. Network Map     | Chart associations                     | Connection map               |
| 6. Deliver         | Report to client                       | Formatted report             |

---

## Phase 1 — Authorization

| Step | Action                                                       | Required |
| ---- | ------------------------------------------------------------ | -------- |
| 1.1  | Document client identity and legitimate purpose              | Yes      |
| 1.2  | Confirm PI license is active and applicable to jurisdiction  | Yes      |
| 1.3  | Define scope — what may and may not be investigated          | Yes      |
| 1.4  | Check for restraining orders or legal constraints on contact | Yes      |
| 1.5  | Open case workspace                                          | Yes      |

**Permissible vs. off-limits (open-source scope only):**

| Permitted                         | Not permitted                             |
| --------------------------------- | ----------------------------------------- |
| Public records, court filings     | Unauthorized account access               |
| Public social media content       | Pretexting / false identity               |
| Surveillance from public spaces   | Wiretapping / recording without consent   |
| Skip tracing via public databases | Accessing DMV records without legal basis |
| Interviewing willing contacts     | Trespassing or covert entry               |

---

## Phase 2 — Subject Profile

**Initial identifiers to collect:**

| Field                                  | Source                             |
| -------------------------------------- | ---------------------------------- |
| Full legal name (incl. middle, suffix) | Client / documents provided        |
| Date of birth                          | Client / public records            |
| Last known address                     | Client / property records          |
| Known aliases / former names           | Court records, name change filings |
| Physical description                   | Client / public photos             |
| Digital handles                        | Social media, domain registrations |

---

## Phase 3 — Locate

**Discovery path sequence:**

| Order | Path                            | Source                                  |
| ----- | ------------------------------- | --------------------------------------- |
| 1     | Property records                | County assessor, grantor/grantee index  |
| 2     | Voter registration              | State election authority                |
| 3     | Court records (recent activity) | PACER, state court search               |
| 4     | Professional license            | State licensing board                   |
| 5     | Business registrations          | Secretary of State filings              |
| 6     | Social media activity           | Public profiles, geo-tagged posts       |
| 7     | Reverse address lookup          | Public aggregators                      |
| 8     | UCC filings                     | Collateral for loans → implies location |

**Null result rule:** Log every path attempted that returned no result. Null results are findings.

---

## Phase 4 — Asset Discovery

| Asset class           | Discovery path                              |
| --------------------- | ------------------------------------------- |
| Real property         | County assessor, grantor/grantee deed index |
| Vehicles              | DMV (where legally accessible)              |
| Business interests    | SoS filings, assumed-name (DBA) records     |
| Watercraft / aircraft | Coast Guard docs, FAA registry              |
| UCC-secured assets    | Secretary of State UCC search               |
| Unclaimed property    | State treasury databases                    |

**Concealment indicators to note:**

- Recent property transfers to family or LLC
- Business dissolution shortly before case opened
- Name change in past 2 years
- Complex trust or multi-layer LLC structure

---

## Phase 5 — Network Map

**Connection types to document:**

| Type                | Discovery path                                        |
| ------------------- | ----------------------------------------------------- |
| Family              | Marriage/divorce records, court filings, social media |
| Business associates | SoS co-officers/directors, news mentions              |
| Property co-owners  | Deed records, title searches                          |
| Court co-parties    | Plaintiff/defendant search                            |
| Social network      | Public social media connections                       |

**Record each connection as:**

```
FROM: [subject ID]  TO: [associate subject ID]
Relationship: [type]  Strength: confirmed / probable / possible
Source: [finding ID]
```

---

## Phase 6 — Deliver

**Report must include:**

| Section           | Notes                                                  |
| ----------------- | ------------------------------------------------------ |
| Methodology       | Every discovery path attempted, with results and nulls |
| Findings          | Timestamped, sourced, confidence rated                 |
| Evidence exhibits | Screenshots with capture timestamp, hash               |
| Limitations       | What was not checked and why                           |
| Legal statement   | Analyst license number, compliance declaration         |

**Format:** F4 (evidentiary) for legal matters; F2 (full-analysis) for client delivery.
See [`output/reports/format-catalog.md`](../output/reports/format-catalog.md).

---

_See also: [`handbook/operator-queries.md`](../handbook/operator-queries.md) for discovery path queries_
