# fx-breach-discovery

## Purpose

Locate compromised credential sets and exposed PII tied to a subject across known breach databases, paste aggregators, and indexed dumps. Produces a severity-ranked finding set for the case record.

## Quick Reference

| Item       | Detail                                               |
| ---------- | ---------------------------------------------------- |
| Command    | /breach-check                                        |
| Input      | Email address, username, or domain                   |
| Output     | Breach finding report with severity tiers            |
| Confidence | HIGH for indexed breaches; LOW for unverified pastes |

## Exposure Severity Table

| Data Class                    | Severity | Priority Action                      |
| ----------------------------- | -------- | ------------------------------------ |
| Email only                    | LOW      | Monitor for phishing                 |
| Email + hashed password       | MEDIUM   | Assess hash strength                 |
| Email + plaintext password    | HIGH     | Check reuse across services          |
| Full PII (name, DOB, address) | HIGH     | Cross-reference with active accounts |
| Financial or government ID    | CRITICAL | Incident response protocol           |

## Methodology

1. Query HIBP (`haveibeenpwned.com`) with subject email — note breach names and data classes
2. Query HudsonRock Cavalier API with subject email — check infostealer exposure
3. If org case: run HudsonRock domain lookup to find compromised employee URLs
4. Sweep domain variant (`@domain.com`) via HIBP domain search if org case
5. Run operator queries against paste aggregators: `site:pastebin.com "subject@domain.com"`
6. Check secondary paste indexes (psbdmp.ws, pastebinsearch.com) for dump fragments
7. Cross-reference breach dates + HudsonRock `date_compromised` to build exposure timeline
8. For each finding, assess hash type if passwords present (MD5/SHA1 = high crack risk)
9. Score cumulative severity using table above; flag credential reuse patterns
10. If HudsonRock returns a hit: auto-escalate to CRITICAL (active infostealer = live credential theft)

## Tools & Fallbacks

| Priority | Tool                     | Install                   | Notes                                                 |
| -------- | ------------------------ | ------------------------- | ----------------------------------------------------- |
| 1        | HaveIBeenPwned           | haveibeenpwned.com        | Free tier; API key for bulk                           |
| 2        | **HudsonRock Cavalier**  | hudsonrock.com (free API) | **Infostealer data — no API key**                     |
| 3        | DeHashed                 | dehashed.com              | Paid; broader breach coverage                         |
| 4        | **LeakCheck Public API** | https://leakcheck.io      | Free public API — email/username/domain breach lookup |
| 5        | Pastebin operator query  | Browser                   | Free; cover pastebin.com, gist.github.com             |
| 6        | psbdmp.ws                | Browser                   | Indexes deleted Pastebin content                      |
| 7        | IntelligenceX            | intelx.io                 | Paid; dark web paste index                            |

### HudsonRock Cavalier API (Free, No Key Required)

Checks if an email or domain appears in infostealer malware logs. Returns compromised machine details, associated credentials count, and affected services.

**Endpoints:**

| Query Type    | URL                                                                                | Use Case                                  |
| ------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| Email lookup  | `https://www.hudsonrock.com/api/json/v2/stats/website-results/email?email={EMAIL}` | Check if email found in infostealer logs  |
| Domain lookup | `https://www.hudsonrock.com/api/json/v2/stats/website-results/urls/{DOMAIN}`       | Find compromised employee URLs for domain |

**Email lookup — example:**

```bash
curl -s "https://www.hudsonrock.com/api/json/v2/stats/website-results/email?email=target@example.com"
```

**Response fields:**

- `computer_name` — infected machine identifier
- `date_compromised` — when infection occurred
- `total_corporate_services` — corporate services with stolen creds
- `total_user_services` — personal services with stolen creds

**Domain lookup — example:**

```bash
curl -s "https://www.hudsonrock.com/api/json/v2/stats/website-results/urls/example.com"
```

**Response fields:**

- `data.employees_urls` — list of corporate URLs with occurrence counts from stealer logs
- Each entry: `url`, `occurrence` count, `type` (Employee/Client)

**Integration into methodology:**

- Run HudsonRock email check as step 1b (after HIBP, before paste sweeps)
- Run HudsonRock domain check during org cases to identify compromised employee access
- If HudsonRock returns data → mark finding as CRITICAL (infostealer = active credential theft)
- Record `date_compromised` in exposure timeline

### LeakCheck Public API (Free, No Key Required for Public Endpoint)

Checks if an email, username, or domain appears in known data breaches. Returns breach source names and exposure metadata. More detailed than HIBP for some breaches; covers different breach sets.

**Public API Endpoint:**

| Query Type      | URL                                                | Use Case                            |
| --------------- | -------------------------------------------------- | ----------------------------------- |
| Email lookup    | `https://leakcheck.io/api/public?check={EMAIL}`    | Check if email found in breaches    |
| Username lookup | `https://leakcheck.io/api/public?check={USERNAME}` | Check if username found in breaches |
| Domain lookup   | `https://leakcheck.io/api/public?check={DOMAIN}`   | Check if domain has breach exposure |

**Email lookup — example:**

```bash
curl -s "https://leakcheck.io/api/public?check=target@example.com"
```

**Response fields:**

- `success` — boolean, whether the lookup succeeded
- `found` — number of breach entries found
- `fields` — data fields exposed (email, password, username, etc.)
- `sources` — list of breach sources where the data appeared

**Integration into methodology:**

- Run LeakCheck as step 2b (after HIBP, before HudsonRock)
- Cross-reference breach source names with HIBP to identify coverage gaps
- LeakCheck may return breach names not indexed by HIBP and vice versa
- If LeakCheck returns `found > 0`: document each source with exposed field types

**Rate limits:** Public API is rate-limited; add 2-second delay between requests. For bulk queries, a paid API key is available at https://wiki.leakcheck.io/en/api/public

**Docs:** https://wiki.leakcheck.io/en/api/public

---

## Output Format

```
Subject: user@example.com

Findings:
  LinkedIn (May 2016): email + SHA1 hash — MEDIUM
  Exactis (Jun 2018): email + name + phone — HIGH
  Collection #1 (Jan 2019): email + plaintext — HIGH

Exposure Timeline: 2016-05 → 2019-01
Reuse Risk: HIGH (same password pattern across 2 breaches)
Cumulative Severity: HIGH
```

## Limitations

- Breach databases capture only disclosed or discovered incidents; private breaches are not indexed
- Paste content is ephemeral — findings may disappear before verification
- Hash cracking feasibility depends on algorithm and compute resources — not performed here
- HIBP API rate-limits unauthenticated bulk requests
- Domain sweep requires administrator verification on HIBP

## Related Techniques

- [fx-leak-monitoring.md](fx-leak-monitoring.md) — ongoing alerting vs. point-in-time sweep
- [fx-email-header-analysis.md](fx-email-header-analysis.md) — validate contact addresses found in findings
- [fx-metadata-parsing.md](fx-metadata-parsing.md) — extract author fields from dumped documents
