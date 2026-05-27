# Coverage Matrix

Track which discovery paths have been attempted and their yield for each subject type.

---

## Matrix — Person Subject

| Discovery path                               | Checked | Result | Finding IDs |
| -------------------------------------------- | ------- | ------ | ----------- |
| Identity: full name operator query           | ☐       |        |             |
| Identity: LinkedIn profile                   | ☐       |        |             |
| Identity: professional license lookup        | ☐       |        |             |
| Identity: government public records          | ☐       |        |             |
| Employment: company website team page        | ☐       |        |             |
| Employment: SEC / regulatory filings         | ☐       |        |             |
| Employment: LinkedIn tenure                  | ☐       |        |             |
| Credentials: degree verification (CHEA)      | ☐       |        |             |
| Credentials: certification body lookup       | ☐       |        |             |
| Legal: court record search                   | ☐       |        |             |
| Legal: regulatory enforcement search         | ☐       |        |             |
| Financial: property records                  | ☐       |        |             |
| Financial: business registration             | ☐       |        |             |
| Digital: social media platforms (list)       | ☐       |        |             |
| Digital: username trace                      | ☐       |        |             |
| Digital: email pivot                         | ☐       |        |             |
| Exposure: breach database check              | ☐       |        |             |
| Exposure: paste site search                  | ☐       |        |             |
| Network: associates / co-parties             | ☐       |        |             |
| Historical: Wayback Machine / archived pages | ☐       |        |             |

**Coverage score:** `___ / 20 paths checked = ___% `

---

## Matrix — Domain / Org Subject

| Discovery path                                    | Checked | Result | Finding IDs |
| ------------------------------------------------- | ------- | ------ | ----------- |
| WHOIS registration (universal cascade)            | ☐       |        |             |
| WHOIS reverse lookup (free)                       | ☐       |        |             |
| WHOIS historical records                          | ☐       |        |             |
| DNS records (A, MX, TXT, NS)                      | ☐       |        |             |
| Certificate transparency (crt.sh)                 | ☐       |        |             |
| Subdomain sweep                                   | ☐       |        |             |
| Open directory / exposed files                    | ☐       |        |             |
| Admin panel discovery                             | ☐       |        |             |
| API endpoint discovery                            | ☐       |        |             |
| Third-party references (GitHub, Pastebin)         | ☐       |        |             |
| Scrapling web collection (static/stealth/dynamic) | ☐       |        |             |
| Email security (SPF, DKIM, DMARC)                 | ☐       |        |             |
| Port / service scan (Shodan / Censys)             | ☐       |        |             |
| SSL certificate details                           | ☐       |        |             |
| Credential / breach exposure                      | ☐       |        |             |
| Code repository exposure                          | ☐       |        |             |
| ASN / hosting info                                | ☐       |        |             |
| Historical WHOIS / DNS                            | ☐       |        |             |
| News and press mentions                           | ☐       |        |             |
| Legal / regulatory filings                        | ☐       |        |             |
| Social media presence                             | ☐       |        |             |

**Coverage score:** `___ / 22 paths checked = ___% `

---

## Matrix — Handle / Username Subject

| Discovery path                       | Checked | Result | Finding IDs |
| ------------------------------------ | ------- | ------ | ----------- |
| Platform sweep (10+ platforms)       | ☐       |        |             |
| GitHub profile + commit email        | ☐       |        |             |
| Email pivot from extracted address   | ☐       |        |             |
| Paste site mentions                  | ☐       |        |             |
| Forum presence                       | ☐       |        |             |
| Real name correlation attempt        | ☐       |        |             |
| Profile creation date analysis       | ☐       |        |             |
| Cross-platform consistency check     | ☐       |        |             |
| Breach database — extracted email    | ☐       |        |             |
| Associate network (followers, teams) | ☐       |        |             |

**Coverage score:** `___ / 10 paths checked = ___% `

---

## Coverage Scoring Guide

| Score   | Status        | Action                                   |
| ------- | ------------- | ---------------------------------------- |
| 0–30%   | Minimal       | Major gaps — continue before reporting   |
| 31–60%  | Partial       | Significant gaps — note limitations      |
| 61–80%  | Solid         | Minor gaps — document and justify skips  |
| 81–95%  | Thorough      | Few gaps — acceptable for most reports   |
| 96–100% | Comprehensive | All paths attempted — highest confidence |

---

## Null Result Policy

A discovery path that returns no finding is still a completed path. Log as:

```
Path: [label]  Checked: ✓  Result: NULL  Finding IDs: —
```

Null results improve coverage score and document due diligence.

---

---

## Automated Gap Analysis — /blind-spots

Reads the coverage matrix and surfaces unchecked paths, ranked by investigation priority.

### Command

```
/blind-spots [--subject <id>] [--priority high|medium|low]
```

- `--subject <id>` — limit analysis to one subject (default: primary subject)
- `--priority` — filter output to one priority band (default: all)

### Priority Classification

| Priority | Discovery Path Categories                      |
| -------- | ---------------------------------------------- |
| HIGH     | Identity, breach/exposure, legal/court records |
| MEDIUM   | Employment, credentials, financial             |
| LOW      | Historical/archived pages, media/news mentions |

### Path-to-Priority Mapping (Person Subject)

| Discovery Path                        | Priority |
| ------------------------------------- | -------- |
| Identity: full name operator query    | HIGH     |
| Identity: LinkedIn profile            | HIGH     |
| Identity: professional license lookup | HIGH     |
| Identity: government public records   | HIGH     |
| Exposure: breach database check       | HIGH     |
| Exposure: paste site search           | HIGH     |
| Legal: court record search            | HIGH     |
| Legal: regulatory enforcement search  | HIGH     |
| Employment: company website team page | MEDIUM   |
| Employment: SEC / regulatory filings  | MEDIUM   |
| Employment: LinkedIn tenure           | MEDIUM   |
| Credentials: degree verification      | MEDIUM   |
| Credentials: certification body       | MEDIUM   |
| Financial: property records           | MEDIUM   |
| Financial: business registration      | MEDIUM   |
| Digital: social media platforms       | MEDIUM   |
| Digital: username trace               | MEDIUM   |
| Digital: email pivot                  | MEDIUM   |
| Network: associates / co-parties      | MEDIUM   |
| Historical: Wayback / archived pages  | LOW      |

### Implementation

```python
def blind_spots(subject_id=None, priority_filter=None):
    matrix = load_coverage_matrix(subject_id or get_primary_subject())
    gaps   = [p for p in matrix if not p["checked"]]

    ranked = sorted(gaps, key=lambda p: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}[p["priority"]])

    if priority_filter:
        ranked = [p for p in ranked if p["priority"] == priority_filter.upper()]

    return ranked
```

### ASCII Output Template

```
━━━ BLIND SPOTS: [subject_label] ━━━━━━━━━━━━━━━━━━━━
  [checked]/[total] paths completed  |  [gaps] gaps found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIGH PRIORITY
  1. [path_label]
     └─ Suggested: [command]
  2. [path_label]
     └─ Suggested: [command]

MEDIUM PRIORITY
  3. [path_label]
     └─ Suggested: [command]

LOW PRIORITY
  4. [path_label]
     └─ Suggested: [command]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run /coverage to update the matrix after completing paths.
```

---

_See also: [`validation/quality-scoring.md`](./quality-scoring.md) | [`validation/verification-checklist.md`](./verification-checklist.md)_
