# Quality Scoring

Scoring dimensions for assessing case output quality. Apply at case close.

---

## Scoring Dimensions

| Dimension              | Max pts | Description                             |
| ---------------------- | ------- | --------------------------------------- |
| Coverage               | 25      | Breadth of discovery paths attempted    |
| Source quality         | 20      | Reliability and independence of sources |
| Confidence calibration | 20      | Accuracy of stated confidence levels    |
| Finding documentation  | 15      | Completeness of finding records         |
| Citation integrity     | 10      | All findings citable, archived          |
| Null result logging    | 10      | Dead-end paths documented               |
| **Total**              | **100** |                                         |

---

## Dimension Rubrics

### Coverage (0–25)

| Score | Criteria                                               |
| ----- | ------------------------------------------------------ |
| 22–25 | ≥ 90% of applicable paths checked; all skips justified |
| 16–21 | 61–89% of paths checked; most skips noted              |
| 8–15  | 31–60% of paths; significant gaps undocumented         |
| 0–7   | < 30% of paths; major gaps with no justification       |

_Use [`validation/coverage-matrix.md`](./coverage-matrix.md) to calculate path percentage._

---

### Source Quality (0–20)

| Score | Criteria                                                                          |
| ----- | --------------------------------------------------------------------------------- |
| 18–20 | All findings from primary sources or independent government/official records      |
| 13–17 | Mix of primary and secondary; secondary sources corroborated                      |
| 7–12  | Heavy reliance on aggregators, people-search engines, or single secondary sources |
| 0–6   | Uncorroborated secondary or user-generated sources form basis of key findings     |

**Source tier guide:**

| Tier       | Examples                                       | Weight                      |
| ---------- | ---------------------------------------------- | --------------------------- |
| Primary    | Gov records, official filings, direct platform | Highest                     |
| Secondary  | News articles, verified reports                | High                        |
| Aggregated | People-search sites, data aggregators          | Medium                      |
| Unverified | Forums, pastes, anonymous posts                | Low — require corroboration |

---

### Confidence Calibration (0–20)

| Score | Criteria                                                               |
| ----- | ---------------------------------------------------------------------- |
| 18–20 | Confidence ratings match evidence — no over-claiming or under-claiming |
| 13–17 | Minor mis-calibration in 1–2 findings                                  |
| 7–12  | Systematic over-confidence or vague, uncalibrated ratings              |
| 0–6   | Confidence not assigned, or routinely inflated                         |

**Calibration check:** For every CONFIRMED finding, can you name 2 independent sources? For every HIGH finding, is there at least 1 reliable source with no known contrary evidence?

---

### Finding Documentation (0–15)

| Score | Criteria                                                               |
| ----- | ---------------------------------------------------------------------- |
| 14–15 | Every finding: ID, type, weight, source URL, timestamp, confidence     |
| 10–13 | Most findings fully documented; 1–2 fields missing on minor findings   |
| 5–9   | Inconsistent documentation; key fields missing on significant findings |
| 0–4   | No structured finding records                                          |

---

### Citation Integrity (0–10)

| Score | Criteria                                                 |
| ----- | -------------------------------------------------------- |
| 9–10  | Every finding has archived source; archive URLs included |
| 7–8   | Most sources archived; 1–2 non-archived with explanation |
| 4–6   | Some sources archived; several citations lack archive    |
| 0–3   | No archiving; sources cited as live URLs only            |

---

### Null Result Logging (0–10)

| Score | Criteria                                      |
| ----- | --------------------------------------------- |
| 9–10  | Every attempted path logged — including nulls |
| 7–8   | Most paths logged; minor omissions            |
| 4–6   | Null results selectively logged               |
| 0–3   | No null result documentation                  |

---

## Score Interpretation

| Total  | Grade | Meaning                                                                       |
| ------ | ----- | ----------------------------------------------------------------------------- |
| 90–100 | A     | Production-quality; suitable for legal, HR, or publication use                |
| 75–89  | B     | Solid; minor gaps; note limitations in report                                 |
| 55–74  | C     | Adequate for internal use; do not use as sole basis for significant decisions |
| 35–54  | D     | Significant gaps; treat as preliminary only                                   |
| < 35   | F     | Insufficient; extend case before reporting                                    |

---

_See also: [`validation/coverage-matrix.md`](./coverage-matrix.md) | [`validation/verification-checklist.md`](./verification-checklist.md)_
