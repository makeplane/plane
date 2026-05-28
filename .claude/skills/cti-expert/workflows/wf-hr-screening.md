# WF-HR-Screening: Employment Candidate Screening Workflow

Structured workflow for HR teams conducting pre-hire screening using open-source methods.

---

## Phase Overview

| Phase                   | Goal                                | Output                       |
| ----------------------- | ----------------------------------- | ---------------------------- |
| 1. Consent & Scope      | Legal authorization secured         | Signed disclosure, scope doc |
| 2. Identity Check       | Confirm candidate is who they claim | Verified subject record      |
| 3. Employment History   | Validate stated roles and dates     | Employment findings log      |
| 4. Credential Check     | Verify degrees, licenses            | Credential findings log      |
| 5. Public Profile Sweep | Check open-source exposure          | Finding summary              |
| 6. Decision             | Compile findings, recommend         | Decision matrix              |

---

## Phase 1 — Consent & Scope

| Step | Action                                        | Notes                              |
| ---- | --------------------------------------------- | ---------------------------------- |
| 1.1  | Obtain written authorization from candidate   | FCRA-compliant form                |
| 1.2  | Define scope: what roles trigger which checks | Policy doc                         |
| 1.3  | Document jurisdiction constraints             | FCRA, EEOC, state ban-the-box laws |
| 1.4  | Open candidate record as subject in workspace |                                    |

---

## Phase 2 — Identity Check

| Check           | Discovery path                           | Confidence threshold |
| --------------- | ---------------------------------------- | -------------------- |
| Full legal name | Gov records, professional license lookup | CONFIRMED            |
| DOB match       | Cross-check against stated CV dates      | CORROBORATED         |
| Photo match     | LinkedIn vs. submitted ID                | PROBABLE             |
| Address history | Property records, voter registration     | CORROBORATED         |

---

## Phase 3 — Employment History

**Verify last 7 years. For each listed employer:**

| Check                | Source                                                 | Flag if                      |
| -------------------- | ------------------------------------------------------ | ---------------------------- |
| Employment dates     | Employer HR / payroll records                          | Gap > 3 months unexplained   |
| Job title            | HR department (call main line, not candidate-provided) | Title differs by ≥ 1 level   |
| Reason for departure | HR (if disclosed)                                      | Termination for cause        |
| Rehire eligibility   | HR                                                     | Not eligible, no explanation |

**Gap analysis flags:**

- Unexplained gaps > 3 months: request explanation
- Overlapping dates: verify both employers
- Tenure < 6 months at 3+ roles in 5 years: note pattern, do not assume

---

## Phase 4 — Credential Check

| Credential             | Verification source                                              |
| ---------------------- | ---------------------------------------------------------------- |
| University degree      | Registrar direct contact; CHEA accreditation DB                  |
| Professional license   | State licensing board database                                   |
| Industry certification | Certifying body lookup                                           |
| Security clearance     | Self-reported only; verify via adjudication agency if applicable |

**Red flags:**

- Institution not accredited (check CHEA.org)
- License number does not match name
- Degree date predates institution's founding
- Certification lists no expiry on a time-limited cert

---

## Phase 5 — Public Profile Sweep

**Scope: public-only, job-relevant criteria only, consistent across all candidates.**

| Platform              | Check                                                     |
| --------------------- | --------------------------------------------------------- |
| LinkedIn              | Matches CV? Endorsements consistent?                      |
| Public social media   | Job-relevant red flags only                               |
| News / press mentions | Litigation, misconduct, public statements                 |
| Court records         | Civil suits, criminal (jurisdiction-specific rules apply) |

**Do not record:**

- Protected characteristics (race, religion, disability, etc.)
- Medical information
- Political affiliation (unless job-relevant per policy)
- Private posts (never request access)

---

## Phase 6 — Decision Matrix

| Factor                  | Weight | Score (0–10) | Notes |
| ----------------------- | ------ | ------------ | ----- |
| Identity verification   | 15%    |              |       |
| Employment history      | 30%    |              |       |
| Credential verification | 25%    |              |       |
| Reference quality       | 20%    |              |       |
| Public profile sweep    | 10%    |              |       |
| **Total**               | 100%   |              |       |

**Thresholds:**

- 8.0–10: Proceed
- 6.0–7.9: Proceed with conditions / additional verification
- Below 6.0: Pre-adverse action process per FCRA

---

## Adverse Action Process (if applicable)

1. Send candidate copy of findings + summary of FCRA rights
2. Allow minimum 5 business days to respond
3. Review candidate response
4. Document final decision rationale
5. Send final adverse action notice if proceeding with rejection

---

_See also: [`output/reports/format-catalog.md`](../output/reports/format-catalog.md) — use F4 (evidentiary) for HR records_
