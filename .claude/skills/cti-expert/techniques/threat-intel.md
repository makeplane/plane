# Threat Intelligence Module

> **Module ID:** THR-INTEL-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Educational Threat Intelligence Lookup

---

## 1. Overview

Aggregates threat reputation data for IPs, domains, URLs, and file hashes from free public feeds. Use for triage during incident response, phishing investigation, or infrastructure vetting. Always cross-reference at least two sources before drawing conclusions.

---

## 2. Tool Inventory

| Priority  | Tool                 | Target Types         | Free Limit         | Register                                           |
| --------- | -------------------- | -------------------- | ------------------ | -------------------------------------------------- |
| Primary   | AbuseIPDB            | IP                   | 1000/day           | abuseipdb.com/account/api                          |
| Primary   | VirusTotal           | Domain, URL, Hash    | 500/day, 4/min     | virustotal.com                                     |
| Primary   | MalwareBazaar        | Hash                 | Unlimited          | bazaar.abuse.ch                                    |
| Secondary | GreyNoise Community  | IP                   | 50/week            | greynoise.io                                       |
| Secondary | AlienVault OTX       | IP, Domain           | Unlimited          | otx.alienvault.com                                 |
| Secondary | URLhaus              | URL                  | Unlimited          | None required                                      |
| Secondary | ThreatFox            | Domain, IP, Hash     | Unlimited          | None required                                      |
| Secondary | **URLScan.io**       | Domain, URL, IP      | 100 scans/day free | https://urlscan.io/user/signup                     |
| Tertiary  | Pulsedive            | IP, Domain           | Limited            | pulsedive.com                                      |
| Tertiary  | HudsonRock Cavalier  | Domain               | Unlimited          | None required                                      |
| Tertiary  | **CIRCL CVE Search** | CVE, Vendor, Product | Unlimited          | None required                                      |
| Tertiary  | **NVD API v2**       | CVE, Keyword, CPE    | 5 req/30s (no key) | https://nvd.nist.gov/developers/request-an-api-key |
| Tertiary  | **Ransomware.live**  | Org name, Domain     | Unlimited          | None required                                      |

---

## 3. Investigation Workflow

**Step 1: Classify input type**

- IPv4/IPv6 address → IP path
- Domain name (no path) → Domain path
- Full URL (with scheme/path) → URL path
- MD5/SHA1/SHA256 hex string → Hash path

**Step 2: Run primary tools for input type** (parallel where possible)

**Step 3: Aggregate verdicts** — majority vote across sources, weight by source reliability

**Step 4: Escalate if** any source returns `malicious` with confidence ≥ HIGH

**Step 5: Document** findings with timestamps and source links

---

## 4. CLI Commands & Expected Output

**IP — AbuseIPDB:**

```bash
curl -sG "https://api.abuseipdb.com/api/v2/check" \
  -d "ipAddress=<IP>" -d "maxAgeInDays=90" \
  -H "Key: <YOUR_KEY>" -H "Accept: application/json" | jq .data
# Returns: abuseConfidenceScore (0-100), totalReports, countryCode, isp
```

**IP — GreyNoise Community:**

```bash
curl -s "https://api.greynoise.io/v3/community/<IP>" \
  -H "key: <YOUR_KEY>" | jq .
# Returns: noise (bool), riot (bool), classification, name, link
```

**IP — AlienVault OTX:**

```bash
curl -s "https://otx.alienvault.com/api/v1/indicators/IPv4/<IP>/general" | jq .pulse_info.count
# Returns: pulse count (threat intel hits), reputation score
```

**Domain — VirusTotal:**

```bash
curl -s "https://www.virustotal.com/api/v3/domains/<domain>" \
  -H "x-apikey: <YOUR_KEY>" | jq '.data.attributes.last_analysis_stats'
# Returns: {malicious: N, suspicious: N, harmless: N, undetected: N}
```

**URL — URLhaus:**

```bash
curl -s -d "url=<URL>" "https://urlhaus-api.abuse.ch/v1/url/" | jq '{query_status, threat, tags}'
# Returns: query_status (is_listed/not_listed), threat type, tags
```

**Domain — ThreatFox:**

```bash
curl -s -d '{"query":"search_ioc","search_term":"<domain>"}' \
  "https://threatfox-api.abuse.ch/api/v1/" | jq '.data[0] | {ioc_type, malware, confidence_level}'
```

**Hash — MalwareBazaar:**

```bash
curl -s -d "query=get_info&hash=<sha256>" "https://mb-api.abuse.ch/api/v1/" | \
  jq '.data[0] | {file_name, file_type, tags, vendor_intel}'
# Returns: file metadata, AV detections, malware family tags
```

**Domain — HudsonRock (stealer log exposure):**

```bash
curl -s "https://cavalier.hudsonrock.com/api/json/v2/osint-tools/search-by-domain?domain=<domain>"
# Returns: employee/user credential exposures from infostealer logs
```

**Domain/URL — URLScan.io (search existing scans):**

```bash
# Search for existing scans of a domain (no auth needed for search):
curl -s "https://urlscan.io/api/v1/search/?q=domain:<domain>" | jq '.results[] | {url: .page.url, ip: .page.ip, country: .page.country, server: .page.server, title: .page.title}'
# Returns: matching scan results with page metadata, IPs, technologies

# Submit a new scan (requires free API key):
curl -s -X POST "https://urlscan.io/api/v1/scan/" \
  -H "API-Key: <YOUR_KEY>" -H "Content-Type: application/json" \
  -d '{"url": "https://<domain>", "visibility": "public"}'
# Returns: {uuid, api_url, result_url} — poll result_url after ~30s

# Retrieve scan result:
curl -s "https://urlscan.io/api/v1/result/<uuid>/" | jq '{page: .page, lists: .lists, stats: .stats}'
# Returns: screenshot URL, DOM content, network requests, certificates, cookies, linked domains
```

**CVE — CIRCL CVE Search (free, no auth):**

```bash
# Lookup specific CVE:
curl -s "https://cve.circl.lu/api/cve/<CVE-ID>" | jq '{id: .id, summary: .summary, cvss: .cvss, references: .references}'
# Returns: CVE details, CVSS score, references, affected products

# Search by vendor/product:
curl -s "https://cve.circl.lu/api/search/<vendor>/<product>" | jq '.[0:5] | .[] | {id: .id, summary: .summary, cvss: .cvss}'
# Returns: list of CVEs affecting that vendor's product

# Last 30 CVEs published:
curl -s "https://cve.circl.lu/api/last" | jq '.[0:10] | .[] | {id: .id, summary: .summary}'
```

**CVE — NVD API v2 (NIST, rate-limited):**

```bash
# Search by keyword:
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=<keyword>&resultsPerPage=5" \
  | jq '.vulnerabilities[].cve | {id: .id, description: .descriptions[0].value, severity: .metrics.cvssMetricV31[0].cvssData.baseSeverity}'
# Rate: 5 req/30s without key, 50 req/30s with key

# Lookup specific CVE:
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=<CVE-ID>" \
  | jq '.vulnerabilities[0].cve | {id: .id, published: .published, description: .descriptions[0].value}'

# Search by CPE (product identifier):
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?cpeName=cpe:2.3:a:<vendor>:<product>:*:*:*:*:*:*:*:*" \
  | jq '.vulnerabilities[].cve | {id: .id, severity: .metrics.cvssMetricV31[0].cvssData.baseSeverity}'
```

**Org — Ransomware.live (ransomware victim/group tracking):**

```bash
# Search for an organization by keyword:
curl -s "https://api.ransomware.live/v2/searchvictims/<org_name>" | jq '.[0:5] | .[] | {victim: .victim, group: .group_name, date: .discovered, country: .country}'
# Returns: victim name, ransomware group, discovery date, country

# Recent victims:
curl -s "https://api.ransomware.live/v2/recentvictims" | jq '.[0:10] | .[] | {victim: .victim, group: .group_name, date: .discovered}'

# Victims by country (ISO-2 code):
curl -s "https://api.ransomware.live/v2/countryvictims/<CC>" | jq '.[0:10] | .[] | {victim: .victim, group: .group_name}'

# Victims by sector:
curl -s "https://api.ransomware.live/v2/sectorvictims/<sector>" | jq '.[0:5] | .[] | {victim: .victim, group: .group_name}'

# List all ransomware groups:
curl -s "https://api.ransomware.live/v2/groups" | jq '.[0:10] | .[] | {name: .name}'

# Specific group details + their victims:
curl -s "https://api.ransomware.live/v2/group/<group_name>" | jq '{name: .name}'
curl -s "https://api.ransomware.live/v2/groupvictims/<group_name>" | jq '.[0:5] | .[] | {victim: .victim, date: .discovered}'
```

---

## 5. Fallback Cascade

| Primary Unavailable | Use Instead                                 |
| ------------------- | ------------------------------------------- |
| AbuseIPDB (quota)   | OTX + GreyNoise manual via web UI           |
| VirusTotal (quota)  | ThreatFox + URLhaus for domains/URLs        |
| MalwareBazaar       | VirusTotal hash endpoint                    |
| GreyNoise (quota)   | Shodan web search (no key needed for basic) |
| All APIs down       | Manual web UI search on any primary tool    |

---

## 6. Output Interpretation

**AbuseIPDB score:**

- 0–24: Clean/low noise
- 25–74: Suspicious, investigate further
- 75–100: Malicious, block/alert

**GreyNoise classification:**

- `riot: true` = Known benign internet scanner (CDN, security vendor) — likely FP
- `noise: true, classification: malicious` = Active threat actor
- `noise: false` = Not observed scanning internet — could be targeted

**VirusTotal stats:**

- `malicious ≥ 3` vendors: Confirmed threat
- `malicious 1–2`: Investigate; check which vendors flagged
- `suspicious > 0, malicious 0`: Borderline; context required

**Verdict aggregation (majority vote):**

```
weight: VirusTotal=3, AbuseIPDB=3, MalwareBazaar=3, OTX=2, ThreatFox=2, URLhaus=2, GreyNoise=1
MALICIOUS  → weighted_malicious > weighted_clean
SUSPICIOUS → tie or single-source flag
CLEAN      → all sources return benign/not listed
```

---

## 7. Confidence Ratings

| Finding Type                  | Confidence | Notes                              |
| ----------------------------- | ---------- | ---------------------------------- |
| Hash malware match            | HIGH       | Cryptographic match, no ambiguity  |
| IP abuse score ≥ 75           | HIGH       | Multi-reporter consensus           |
| URL listed in URLhaus         | HIGH       | Active/recent listing              |
| Domain VirusTotal ≥ 5 vendors | HIGH       | Strong consensus                   |
| Single-source flag only       | LOW        | Possible false positive            |
| GreyNoise noise=true only     | MEDIUM     | Known scanner, not targeted threat |
| OTX pulse count only          | LOW        | Community-submitted, unverified    |

---

## 8. Limitations

- **Rate limits** — Free tiers exhaust quickly on bulk investigations; cache results locally
- **VirusTotal**: 4 req/min hard limit; bursting causes 429 errors
- **GreyNoise Community**: 50 lookups/week — reserve for high-priority IPs only
- **False positives**: CDNs, shared hosting IPs frequently flagged; validate with GreyNoise RIOT
- **False negatives**: Brand-new C2 infrastructure won't appear in any feed for 24–72 hours
- **HudsonRock**: Dataset coverage varies; absence of results does not mean clean
- **Hash matching**: Only exact matches; recompiled/packed variants evade hash lookups
- **URLhaus**: Focuses on malware distribution URLs; phishing-only URLs may not appear

---

## 9. Command Reference

| Command                   | Purpose                   | Input                               |
| ------------------------- | ------------------------- | ----------------------------------- |
| `/threat-check <IP>`      | Full IP reputation lookup | IPv4 or IPv6 address                |
| `/threat-check <domain>`  | Domain threat intel       | Domain name                         |
| `/threat-check <url>`     | URL threat lookup         | Full URL with scheme                |
| `/threat-check <hash>`    | Malware hash lookup       | MD5, SHA1, or SHA256                |
| `/vuln-check <query>`     | CVE/vulnerability lookup  | CVE ID, vendor, product, or keyword |
| `/ransomware-check <org>` | Ransomware victim lookup  | Organization name or domain         |

---

## 10. Vulnerability Lookup (`/vuln-check`)

Queries CIRCL CVE Search and NVD API v2 to surface known vulnerabilities for a product, vendor, or specific CVE ID. Use during org exposure assessment or infrastructure vetting.

**Input classification:**

- `CVE-YYYY-NNNNN` → direct CVE lookup on both CIRCL and NVD
- `vendor/product` (e.g., `apache/httpd`) → search by vendor+product on CIRCL
- Free text keyword → keyword search on NVD API v2

**Workflow:**

1. Classify input type
2. Query CIRCL CVE Search first (no auth, no rate limit)
3. Cross-reference with NVD API v2 for CVSS scores and severity
4. Aggregate results, sort by CVSS score descending
5. Flag CRITICAL/HIGH severity CVEs prominently

**Confidence:** HIGH for exact CVE match; MEDIUM for keyword/product search (may return false positives).

---

## 11. Ransomware Victim Check (`/ransomware-check`)

Queries ransomware.live API to determine if an organization has appeared on ransomware group leak sites. Critical for due diligence and incident awareness.

**Input:** Organization name or domain
**Workflow:**

1. Query `https://api.ransomware.live/v2/searchvictims/<org_name>` for direct keyword search
2. If match found: extract group name, discovery date, country, and activity status
3. Query `https://api.ransomware.live/v2/groupvictims/<group_name>` for group victim list
4. Cross-reference with recent victims endpoint for recency context
5. Document findings with direct links to ransomware.live

**Confidence:** HIGH if exact victim match; MEDIUM for partial name match (may catch unrelated orgs with similar names).

**Output fields:** victim name, ransomware group, discovery date, country, activity status, group profile URL.

---

## 12. URLScan.io Integration

URLScan.io provides passive domain/URL intelligence by searching existing scan results, or active scanning with a free API key.

**OSINT use cases:**

- Domain infrastructure mapping (IPs, ASNs, technologies, certificates)
- Phishing page detection (screenshot + DOM analysis)
- Related domain discovery (shared IPs, tracking codes)
- Historical scan data for timeline construction

**Free tier:** 100 private scans/day, 5000 results/day search, unlimited public scan viewing.
**Registration:** https://urlscan.io/user/signup

---

_Threat Intelligence Module v1.1.0 — Updated 2026-03-30_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized security research and incident response purposes only_
