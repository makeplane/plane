# tpl-due-diligence

7-phase company evaluation workflow. Produces a risk-scored report.

---

## Template Metadata

| Field           | Value                                   |
| --------------- | --------------------------------------- |
| ID              | `due-diligence`                         |
| Category        | business                                |
| Skill tier      | Practitioner                            |
| Duration        | 15–25 min (standard) · 30–45 min (deep) |
| Required inputs | Company name, domain                    |
| Optional inputs | Country/region, industry sector         |
| Output          | Risk score 0–10, prioritized findings   |

---

## Activation

```
/case-template run due-diligence

Inputs:
  Company name: _
  Domain:       _
  Region:       _ (optional)
  Industry:     _ (optional)
```

Flags:

- `--depth deep` — extended leadership and financial research
- `--depth quick` — surface only (5–10 min, core checks)
- `--focus legal` — expanded litigation and regulatory coverage

---

## Phases

### Phase 1 — Entity Registration

**Goal:** Confirm legal existence and registration status.

| Signal             | Healthy                    | Risk Flag               |
| ------------------ | -------------------------- | ----------------------- |
| Registry record    | Found in official registry | No record               |
| Registration age   | 2+ years                   | Under 6 months          |
| Registered address | Physical address           | PO box only             |
| Standing           | Active / Good standing     | Dissolved / Suspended   |
| Name changes       | Stable                     | Multiple recent changes |

```
/sweep {{company_name}} --type registration
/dork "{{company_name}}" ("registered" OR "incorporated" OR "Ltd")
/dork "{{company_name}}" "business registration" {{region}}
```

### Phase 2 — Online Footprint

**Goal:** Map web presence and verify cross-platform consistency.

| Platform  | Check                         | Risk Signal                     |
| --------- | ----------------------------- | ------------------------------- |
| Website   | Domain age, completeness      | New domain, placeholder content |
| LinkedIn  | Employee count, post activity | 0–2 employees, stale            |
| Twitter/X | Follower growth pattern       | Fake follower cluster           |
| Facebook  | Reviews, engagement           | No reviews, inactive            |

```
/sweep {{domain}}
/dork site:{{domain}} "about us" OR "team" OR "contact"
/dork "{{company_name}}" (LinkedIn OR Twitter)
/chrono "{{domain}}" --years 5
```

### Phase 3 — Key Personnel

**Goal:** Verify executives exist and have credible backgrounds.

| Check             | Healthy               | Risk Flag               |
| ----------------- | --------------------- | ----------------------- |
| LinkedIn presence | Complete history      | No profile found        |
| Prior employment  | Verifiable            | Gaps or unverifiable    |
| Education claims  | Confirmed institution | Unknown school          |
| Affiliations      | Related experience    | Unrelated, missing      |
| Press mentions    | Neutral or positive   | Negative investigations |

```
/sweep "{{exec_name}}"
/dork "{{exec_name}}" {{company_name}} LinkedIn
/dork "{{exec_name}}" (lawsuit OR fraud OR scandal)
```

### Phase 4 — Legal Record

**Goal:** Surface active litigation, regulatory action, or financial distress.

```
/dork "{{company_name}}" (lawsuit OR litigation OR "legal action")
/dork "{{company_name}}" (SEC OR regulatory OR penalty)
/dork "{{company_name}}" bankruptcy OR insolvency
```

| Record             | Normal               | Concern               |
| ------------------ | -------------------- | --------------------- |
| Minor litigation   | 1–2 small claims     | Multiple large suits  |
| Regulatory filings | Standard disclosures | Enforcement actions   |
| Bankruptcy         | None                 | Recent or repeated    |
| IP disputes        | Occasional           | Frequent infringement |

### Phase 5 — Reputation Signals

**Goal:** Assess customer sentiment, media tone, and industry standing.

```
/dork "{{company_name}}" review OR rating
/dork "{{company_name}}" scam OR fraud OR complaint
/dork "{{company_name}}" site:bbb.org OR site:trustpilot.com
/news "{{company_name}}" --sentiment
```

| Source     | Target Range        | Risk Threshold            |
| ---------- | ------------------- | ------------------------- |
| BBB        | A or B              | F + unresolved complaints |
| Trustpilot | 3.5+                | Below 2.0                 |
| Reddit     | Balanced discussion | Complaint pattern threads |
| Glassdoor  | 3.0+                | Below 2.5 + CEO comments  |

### Phase 6 — Financial Indicators

**Goal:** Validate funding claims and assess stability signals.

```
/dork "{{company_name}}" (funding OR "Series" OR "raised")
/dork "{{company_name}}" "annual report" OR revenue
/dork "{{company_name}}" Crunchbase OR Pitchbook
```

| Indicator  | Positive                           | Red Flag             |
| ---------- | ---------------------------------- | -------------------- |
| Funding    | Named investors, verifiable rounds | Unverifiable claims  |
| Revenue    | Consistent across sources          | Wildly varying       |
| Growth     | Steady trajectory                  | Declining or erratic |
| Disclosure | Transparent                        | Evasive              |

### Phase 7 — Risk Score

**Scoring matrix:**

| Category         | Weight | Score (1–10) |
| ---------------- | ------ | ------------ |
| Registration     | 20%    | \_           |
| Online footprint | 15%    | \_           |
| Personnel        | 20%    | \_           |
| Legal            | 20%    | \_           |
| Reputation       | 15%    | \_           |
| Financial        | 10%    | \_           |

**Score interpretation:**

| Score | Level     | Action                         |
| ----- | --------- | ------------------------------ |
| 0–2   | Very Low  | Proceed standard               |
| 3–4   | Low       | Document gaps                  |
| 5–6   | Medium    | Extended research recommended  |
| 7–8   | High      | Legal review before proceeding |
| 9–10  | Very High | Avoid or extreme caution       |

---

## Auto-Flags

```
Critical (auto-highlighted):
  !! No legal registration found
  !! Active fraud claims
  !! Fabricated executive profiles
  !! Recent bankruptcy

Warning (review recommended):
  ⚠ Company under 6 months old
  ⚠ Unverifiable funding
  ⚠ Pattern of customer complaints
```

---

## Report Export

```
/case-report export pdf      — full structured PDF
/case-report export csv      — findings table
/case-report export json     — machine-readable, API-ready
/case-report export actions  — priority action list only
```

---

## Related Files

- `experience/guided-flows/flow-person-lookup.md` — individual version
- `experience/case-templates/tpl-security-review.md` — domain security focus
- `techniques/corporate-intelligence.md` — manual research methods
