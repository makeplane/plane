# Walkthrough: Person Lookup

Step-by-step case example. Target: "Morgan Hale" — claimed executive at a financial services firm.
Scenario: Journalist verifying background of a source before publication.

---

## Setup

Open case workspace. Add "Morgan Hale" as primary subject (type: person). Linked subject: claimed employer `veridian-capital.com`.

---

## Step 1 — Identity Anchoring

**Operator queries:**

```
"Morgan Hale" site:linkedin.com
"Morgan Hale" "Veridian Capital"
"Morgan Hale" filetype:pdf
```

**Findings logged:**

```
FND-001  LinkedIn: linkedin.com/in/morgan-hale-vcap — title "VP Operations, Veridian Capital"  [PROBABLE]
FND-002  Press release 2022-09-14 on veridian-capital.com names Morgan Hale as VP Ops  [CONFIRMED]
FND-003  Conference speaker bio (fintech-summit.org, 2023): matches claimed role  [CONFIRMED]
```

**Confidence after Step 1:** PROBABLE → CONFIRMED (2 independent sources match)

---

## Step 2 — Employment Verification

**Discovery paths:**

- Company website → About page, team page
- SEC filings (if applicable) → `site:sec.gov "Veridian Capital"`
- LinkedIn company page connections

**Findings logged:**

```
FND-004  veridian-capital.com/team page lists Morgan Hale with photo  [CONFIRMED]
FND-005  SEC Form ADV (2024): Morgan Hale listed as supervised person  [CONFIRMED]
FND-006  LinkedIn employer tenure: 2021–present, matches claim  [CONFIRMED]
```

---

## Step 3 — Background Sweep

**Operator queries:**

```
"Morgan Hale" site:courtlistener.com
"Morgan Hale" "Veridian Capital" lawsuit OR judgment OR SEC
"Morgan Hale" site:finra.org
```

**Findings logged:**

```
FND-007  FINRA BrokerCheck: no disciplinary record  [CONFIRMED — clean]
FND-008  courtlistener.com: no results for "Morgan Hale"  [NULL]
FND-009  SEC enforcement search: no results  [NULL]
```

---

## Step 4 — Social and Digital Footprint

**Discovery paths:**

| Platform        | Handle found     | Notes                                 |
| --------------- | ---------------- | ------------------------------------- |
| LinkedIn        | morgan-hale-vcap | Active, consistent with resume        |
| X (Twitter)     | @morganhale_fin  | Public, professional posts since 2019 |
| GitHub          | None found       | NULL result                           |
| Personal domain | None found       | NULL result                           |

**Findings logged:**

```
FND-010  @morganhale_fin: posts consistent with claimed expertise  [CORROBORATED]
FND-011  No personal site or blog found  [NULL]
```

---

## Step 5 — Conflict of Interest Check

**Operator queries:**

```
"Morgan Hale" "board" OR "director" OR "advisor" site:sec.gov
"Morgan Hale" "investment" site:opencorporates.com
```

**Findings logged:**

```
FND-012  opencorporates.com: no separate business registrations under name  [NULL]
FND-013  SEC: Morgan Hale listed as affiliated person in competitor firm's 2019 ADV  [MEDIUM — prior affiliation, now 5 years ago]
```

**Note:** FND-013 warrants direct question to source. Not disqualifying, but disclose if relevant to story angle.

---

## Step 6 — Summary

```
┌─[ SUBJECT RECORD: Morgan Hale ]───────────────────────────────┐
│ Type: person                                                   │
│ Confidence: CONFIRMED (87/100)                                 │
│ Identity verified: Yes — 3+ independent sources               │
│ Employment verified: Yes — LinkedIn, SEC, company site        │
│ Disciplinary record: None found                               │
│ Conflicts: Prior affiliation (2019) — disclose if relevant    │
│ Exposure: LOW                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Report format:** F5 (press-ready) for publication use.
See [`output/reports/format-catalog.md`](../../output/reports/format-catalog.md).

---

_See also: [`guides/walkthroughs/walkthrough-username-trace.md`](./walkthrough-username-trace.md)_
