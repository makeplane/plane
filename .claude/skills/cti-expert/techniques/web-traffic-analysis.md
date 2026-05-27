# Web Traffic Analysis Module

> **Module ID:** WEB-TRAF-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Educational Website Popularity & Traffic Estimation

---

## 1. Overview

Estimates website traffic and popularity using free public ranking datasets and crawl-frequency signals. No single source is authoritative — this module triangulates across multiple lists to produce a weighted composite score and tier classification. Use for competitive research, site vetting, or assessing target infrastructure reach.

---

## 2. Tool Inventory

| Priority  | Source                | Data Type         | Free Limit | Notes                         |
| --------- | --------------------- | ----------------- | ---------- | ----------------------------- |
| Primary   | Tranco                | Rank list         | Unlimited  | research-oriented, aggregated |
| Primary   | Cloudflare Radar      | Rank + trend      | Unlimited  | requires free CF account      |
| Primary   | Cisco Umbrella Top 1M | DNS rank          | Unlimited  | daily CSV from S3             |
| Secondary | CrUX API              | Real user metrics | Unlimited  | requires free Google API key  |
| Secondary | Majestic Million      | Link-based rank   | Unlimited  | daily CSV download            |
| Tertiary  | Wayback Machine CDX   | Crawl frequency   | Unlimited  | no key required               |
| Tertiary  | crt.sh                | CT log frequency  | Unlimited  | no key required               |

---

## 3. Investigation Workflow

1. Normalize domain — strip `www.`, scheme, trailing slash
2. Query primary sources (Tranco, Cloudflare, Umbrella) in parallel
3. Query secondary sources (CrUX, Majestic) for corroboration
4. Query tertiary signals (Wayback, crt.sh) for activity confirmation
5. Apply scoring formula — compute weighted composite score (0–100)
6. Assign tier from composite score
7. Output report with per-source ranks, composite score, tier, and caveats

---

## 4. CLI Commands & Expected Output

**Tranco rank:**

```bash
curl -s "https://tranco-list.eu/api/ranks/domain/<domain>" | jq .
# Returns: {"domain":"example.com","ranks":[{"list":"2024-01-15","rank":1523}]}
```

**Cloudflare Radar:**

```bash
curl -s "https://api.cloudflare.com/client/v4/radar/ranking/domain/<domain>" \
  -H "Authorization: Bearer <CF_FREE_TOKEN>" | jq '.result.details_0.bucket'
# Returns bucket: top200 | top1k | top5k | top10k | top50k | top100k
```

**Cisco Umbrella Top 1M:**

```bash
curl -s "http://s3-us-west-1.amazonaws.com/umbrella-static/top-1m.csv.zip" -o /tmp/umbrella.zip
unzip -p /tmp/umbrella.zip | grep -i "^[0-9]*,<domain>$"
# Returns: rank,domain line or empty
```

**CrUX API:**

```bash
curl -s -X POST "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=<GOOGLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"origin":"https://<domain>"}' | jq '.record.metrics | keys'
# Presence of record = real Chrome user traffic exists
```

**Majestic Million:**

```bash
curl -s "https://downloads.majestic.com/majestic_million.csv" -o /tmp/majestic.csv
grep -i ",<domain>," /tmp/majestic.csv | cut -d',' -f1,3
# Returns: GlobalRank,Domain or empty
```

**Wayback Machine crawl frequency:**

```bash
curl -s "https://web.archive.org/cdx/search/cdx?url=<domain>/*&output=json&limit=0&showNumPages=true"
# Returns page count; multiply by 100 for approximate snapshot count
```

**crt.sh CT log frequency:**

```bash
curl -s "https://crt.sh/?q=<domain>&output=json" | jq 'length'
# Returns integer — certificate count; high = active domain
```

---

## 5. Fallback Cascade

| Primary Unavailable      | Use Instead                                           |
| ------------------------ | ----------------------------------------------------- |
| Tranco API down          | Download weekly list CSV from tranco-list.eu manually |
| Cloudflare token missing | Use Radar web UI at radar.cloudflare.com              |
| Umbrella S3 unavailable  | Use Majestic Million as substitute (same weight)      |
| CrUX key missing         | Skip; note in report as unscored                      |
| Majestic CSV unavailable | Use crt.sh count as activity proxy                    |

---

## 6. Output Interpretation

**Scoring methodology — weighted composite (0–100):**

```
Source        Weight   Score calculation
----------    ------   --------------------------------------------------
Tranco          25%    100 × (1 - rank/1_000_000),  0 if unranked
Umbrella        25%    100 × (1 - rank/1_000_000),  0 if unranked
Cloudflare      20%    top200=100, top1k=85, top5k=70, top10k=55,
                       top50k=40, top100k=25, else=10
CrUX            15%    100 if record exists, 0 if absent
Majestic        15%    100 × (1 - rank/1_000_000),  0 if unranked

Composite = sum(source_score × weight)
```

**Normalization formula:** `normalized = 100 × (1 - (rank - 1) / 999_999)`

**Tier classification:**

| Tier         | Score  | Description                    |
| ------------ | ------ | ------------------------------ |
| Mega         | 85–100 | Top global properties          |
| Very Popular | 65–84  | Major site, broad audience     |
| Popular      | 45–64  | Established niche or regional  |
| Moderate     | 25–44  | Smaller but active site        |
| Niche        | 10–24  | Limited audience / low traffic |
| Unranked     | 0–9    | No ranking signal found        |

**Tertiary signals:** Wayback snapshots > 500 = multi-year active history; crt.sh certs > 50 = active infrastructure.

---

## 7. Confidence Ratings

| Finding                    | Confidence | Notes                              |
| -------------------------- | ---------- | ---------------------------------- |
| Tranco rank (top 10k)      | HIGH       | Aggregated from multiple sources   |
| Cloudflare bucket (top 1k) | HIGH       | Based on DNS resolver traffic      |
| CrUX record present        | HIGH       | Real Chrome user data              |
| Umbrella rank (top 100k)   | MEDIUM     | DNS-based, biased toward US        |
| Majestic rank              | MEDIUM     | Link-graph proxy, not visits       |
| Wayback frequency only     | LOW        | Crawl rate ≠ visitor traffic       |
| crt.sh count only          | LOW        | Infrastructure signal, not traffic |
| Unranked in all sources    | MEDIUM     | Likely low traffic, not certainty  |

---

## 8. Limitations

- All sources are proxies (DNS queries, links, crawls) — none measure actual visits
- **Geographic bias**: Umbrella skews US/enterprise; Cloudflare skews CF-proxied sites
- **New domains**: Sites < 3 months old rarely appear in any ranking list
- **CDN masking**: Shared CDN IPs may inherit CDN's rank, not the domain's own
- **CrUX threshold**: < ~1000 monthly Chrome users → no record; absence ≠ zero traffic
- **Majestic**: Measures inbound links; popular link farms can score falsely high
- **Tranco lag**: Updated weekly; recent popularity changes not immediately reflected
- **Cloudflare rate limits**: Free tier has undocumented soft limits; space queries 1–2 s apart

---

## 9. Command Reference

| Command                       | Purpose                           | Input       |
| ----------------------------- | --------------------------------- | ----------- |
| `/traffic <domain>`           | Full composite traffic estimate   | Domain name |
| `/traffic <domain> --sources` | Per-source raw ranks              | Domain name |
| `/traffic <domain> --history` | Wayback + crt.sh activity signals | Domain name |

Report output includes: per-source rank and normalized score, weighted composite (0–100), tier label, and tertiary activity signals (Wayback snapshot count, crt.sh cert count).

---

_Web Traffic Analysis Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
