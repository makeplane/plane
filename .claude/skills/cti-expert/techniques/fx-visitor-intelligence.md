# Visitor Intelligence Module

> **Module ID:** VIS-INT-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** External Visitor Analytics, Technology Fingerprinting, Traffic Source Analysis

---

## 1. Overview

Gathers visitor statistics, technology profiles, geographic distribution, traffic sources, referral data, and competitor intelligence for a target domain — all from external OSINT sources. No internal analytics access required. Triangulates across 11+ free sources in 4 reliability tiers.

**Commands:** `/visitors <domain>`, `/techstack <domain>`, `/competitors <domain>`

---

## 2. Tool Inventory

| Priority  | Source                           | Data Type                                    | Free Tier   | Confidence | Auto-Install                                                    |
| --------- | -------------------------------- | -------------------------------------------- | ----------- | ---------- | --------------------------------------------------------------- |
| Primary   | Tranco + existing traffic module | Rank, composite score                        | Unlimited   | HIGH       | N/A (existing)                                                  |
| Primary   | BuiltWith Free API               | Tech stack (CMS, analytics, frameworks)      | 1 req/sec   | HIGH       | N/A (API)                                                       |
| Primary   | Netcraft Site Report             | Hosting, SSL, server, uptime                 | Unlimited   | HIGH       | N/A (web)                                                       |
| Primary   | PublicWWW                        | Analytics ID cross-domain linking            | Top 3M free | VERY HIGH  | N/A (web)                                                       |
| Secondary | httpx                            | HTTP fingerprinting, headers, tech inference | Unlimited   | MODERATE   | `go install github.com/projectdiscovery/httpx/cmd/httpx@latest` |
| Secondary | SimilarWeb (extension API)       | Visits, bounce, geography, sources           | ~10 req/min | MODERATE   | N/A (web)                                                       |
| Secondary | SE Ranking Traffic Checker       | Traffic by country, keywords                 | Unlimited   | MODERATE   | N/A (web)                                                       |
| Tertiary  | HypeStat                         | Visitor estimates, pageviews                 | Unlimited   | LOW        | N/A (web)                                                       |
| Tertiary  | StatsCrop                        | Traffic breakdown, worth                     | Unlimited   | LOW        | N/A (web)                                                       |
| Tertiary  | SiteWorthTraffic                 | Monthly visits, worth estimate               | Unlimited   | LOW        | N/A (web)                                                       |
| Bonus     | SpyFu / SEMrush free             | Organic/paid keywords, competitors           | Limited     | MODERATE   | N/A (web)                                                       |

---

## 3. Investigation Workflow

### Phase 1: Technology Fingerprinting

**Goal:** Identify what technologies the target uses (CMS, analytics, frameworks, CDN, ad networks).

**Cascade:**

| Step | Method               | Command                                                                                                                                    | Confidence |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1    | BuiltWith Free API   | `curl -s "https://api.builtwith.com/free-api?lookup=<domain>"`                                                                             | HIGH       |
| 2    | httpx fingerprint    | `httpx -u https://<domain> -tech-detect -json`                                                                                             | MODERATE   |
| 3    | HTTP header analysis | `curl -sI https://<domain>` → parse Server, X-Powered-By, X-Generator                                                                      | MODERATE   |
| 4    | HTML source scan     | `curl -s https://<domain> \| grep -oiE '(wp-content\|drupal\|joomla\|shopify\|wix\|squarespace\|gatsby\|next\|nuxt\|react\|angular\|vue)'` | MODERATE   |
| 5    | Netcraft report      | Fetch `https://sitereport.netcraft.com/?url=<domain>`                                                                                      | HIGH       |

**Extract these categories:**

- CMS (WordPress, Drupal, Shopify, Wix, etc.)
- Analytics (Google Analytics 4, Matomo, Plausible, etc.)
- Frameworks (React, Vue, Angular, Next.js, etc.)
- CDN (Cloudflare, Akamai, Fastly, etc.)
- Ad Networks (Google Ads, Meta Pixel, etc.)
- Server (Apache, Nginx, IIS, etc.)
- Hosting Provider (AWS, GCP, Azure, Cloudflare, etc.)
- SSL Provider (Let's Encrypt, DigiCert, etc.)

### Phase 2: Visitor Geography & Volume

**Goal:** Estimate monthly visitors, geographic distribution, and engagement metrics.

**Cascade:**

| Step | Method                  | Command                                                         | Confidence |
| ---- | ----------------------- | --------------------------------------------------------------- | ---------- |
| 1    | Existing traffic module | `/traffic <domain>` — Tranco, Cloudflare, Umbrella composite    | HIGH       |
| 2    | SimilarWeb data         | WebSearch `site:similarweb.com "<domain>"` → scrape summary     | MODERATE   |
| 3    | HypeStat scrape         | WebFetch `https://hypestat.com/<domain>` → extract visitor data | LOW        |
| 4    | StatsCrop scrape        | WebFetch `https://statscrop.com/<domain>` → extract stats       | LOW        |

**Output fields:**

- Monthly visits (estimated range)
- Bounce rate (%)
- Pages per visit
- Avg. visit duration
- Top 5 countries (% share)
- Device split (desktop/mobile estimate)

### Phase 3: Traffic Sources

**Goal:** Determine where the traffic comes from.

**Cascade:**

| Step | Method                       | Data                                             | Confidence |
| ---- | ---------------------------- | ------------------------------------------------ | ---------- |
| 1    | SimilarWeb summary           | Direct / Referral / Search / Social / Paid split | MODERATE   |
| 2    | Backlink analysis via search | `"<domain>" backlinks` → infer referral sources  | LOW        |
| 3    | Social media presence check  | Search for domain mentions across platforms      | MODERATE   |

**Standard traffic source categories:**

- **Direct** — Typed URL / bookmarks
- **Search** — Organic search engines (Google, Bing, etc.)
- **Referral** — Links from other websites
- **Social** — Social media platforms
- **Paid** — Advertising (Google Ads, Meta Ads, etc.)
- **Email** — Newsletter / email campaigns
- **Display** — Banner / programmatic ads

### Phase 4: Analytics & Advertising ID Cross-Domain Linking

**Goal:** Find other domains owned by the same entity using shared tracking, analytics, and advertising IDs.

**Method (VERY HIGH confidence):**

```bash
# Step 1: Extract ALL tracking IDs from target page source
curl -s "https://<domain>" | grep -oP '(G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+|fbq\(.init.,.\K[0-9]+|pub-[0-9]+|ca-pub-[0-9]+|AW-[0-9]+|DC-[0-9]+)'

# Step 2: Extract additional tracking IDs (secondary pass)
curl -s "https://<domain>" | grep -oP '(hj\(.hjid.,\K[0-9]+|hs-script\.com/\K[0-9]+|cdn\.segment\.com/analytics\.js/v1/\K[a-zA-Z0-9]+|cdn\.mxpnl\.com/libs/\K[a-zA-Z0-9]+|static\.klaviyo\.com/onsite/js/klaviyo\.js\?company_id=\K[a-zA-Z0-9]+|tag=\K[a-zA-Z0-9_-]+)'

# Step 3: Search PublicWWW for each discovered ID
# Visit: https://publicwww.com/?query=G-XXXXXXXXXX
# Visit: https://publicwww.com/?query=pub-XXXXXXXXXX
# All returned domains share the same account → same owner

# Step 4: Verify with secondary search
# WebSearch: "G-XXXXXXXXXX" site:publicwww.com OR "G-XXXXXXXXXX"
# WebSearch: "pub-XXXXXXXXXX" site:publicwww.com OR "pub-XXXXXXXXXX"
```

**Supported tracking IDs:**

| ID Pattern                             | Service                             | Confidence | Example                   |
| -------------------------------------- | ----------------------------------- | ---------- | ------------------------- |
| `G-XXXXXXXXX`                          | Google Analytics 4                  | VERY HIGH  | `G-A1B2C3D4E5`            |
| `GTM-XXXXXXX`                          | Google Tag Manager                  | VERY HIGH  | `GTM-ABCD123`             |
| `UA-XXXXX-X`                           | Google Analytics Universal          | VERY HIGH  | `UA-12345-1`              |
| `pub-XXXXXXXXXX` / `ca-pub-XXXXXXXXXX` | **Google AdSense**                  | VERY HIGH  | `pub-1234567890`          |
| `AW-XXXXXXXXX`                         | Google Ads                          | HIGH       | `AW-123456789`            |
| `DC-XXXXXXXX`                          | Google DoubleClick/Campaign Manager | HIGH       | `DC-12345678`             |
| `fbq('init', 'XXXXX')`                 | Meta/Facebook Pixel                 | VERY HIGH  | `fbq('init', '12345')`    |
| `hj('hjid', XXXXX)`                    | Hotjar                              | HIGH       | Session recording service |
| `hs-script.com/XXXXX`                  | HubSpot                             | HIGH       | Marketing automation      |
| `klaviyo.js?company_id=XXXXX`          | Klaviyo                             | HIGH       | Email marketing           |
| `segment.com/.../XXXXX`                | Segment                             | MEDIUM     | Customer data platform    |
| `mxpnl.com/.../XXXXX`                  | Mixpanel                            | MEDIUM     | Product analytics         |
| `tag=XXXXX`                            | Amazon Associates                   | HIGH       | Affiliate tracking        |

**Why this is powerful:** Shared tracking IDs are almost never coincidental. Finding the same ID on multiple domains is VERY HIGH confidence evidence of shared ownership. AdSense publisher IDs (`pub-`) are especially valuable — they're tied to a single Google account and rarely change.

### Phase 5: Competitor & Related Sites

**Goal:** Identify competitor and related websites.

**Methods:**

| Method                        | Command                                                                            | Confidence |
| ----------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| SimilarWeb "similar sites"    | WebSearch `site:similarweb.com "<domain>" similar`                                 | MODERATE   |
| Shared hosting / IP neighbors | `dig +short <domain>` → `curl -s "https://api.hackertarget.com/reverseip/?q=<IP>"` | LOW        |
| Shared analytics (PublicWWW)  | Same GA/GTM ID → co-owned sites                                                    | VERY HIGH  |
| Category competitors          | WebSearch `"<domain>" competitors alternatives`                                    | LOW        |
| SEMrush competitor data       | WebSearch `site:semrush.com "<domain>" competitors`                                | MODERATE   |

---

## 4. CLI Commands & Expected Output

### `/visitors <domain>` — Full visitor intelligence report

```bash
# Technology detection
curl -s "https://api.builtwith.com/free-api?lookup=<domain>" | jq '.Result.Attributes'

# HTTP fingerprinting
curl -sI "https://<domain>" | grep -iE '^(server|x-powered|x-generator|x-cdn|via|cf-ray):'

# Analytics ID extraction
curl -s "https://<domain>" | grep -oP '(G-[A-Z0-9]+|GTM-[A-Z0-9]+|UA-[0-9]+-[0-9]+)'

# HypeStat visitor data
# WebFetch https://hypestat.com/<domain> → parse visitor stats

# Netcraft hosting intel
# WebFetch https://sitereport.netcraft.com/?url=<domain> → parse server info
```

### `/techstack <domain>` — Technology stack analysis only

```bash
# BuiltWith
curl -s "https://api.builtwith.com/free-api?lookup=<domain>" | jq '.'

# httpx (if installed)
command -v httpx >/dev/null && httpx -u "https://<domain>" -tech-detect -json

# Header analysis
curl -sI "https://<domain>"

# Source code scan for frameworks
curl -s "https://<domain>" | grep -oiE '(wp-content|drupal|shopify|wix|react|angular|vue|next|gatsby|laravel|django|rails|flask)'
```

### `/competitors <domain>` — Competitor and related site discovery

```bash
# IP neighbors
IP=$(dig +short <domain> | head -1)
curl -s "https://api.hackertarget.com/reverseip/?q=${IP}"

# Analytics cross-reference
GAID=$(curl -s "https://<domain>" | grep -oP 'G-[A-Z0-9]+' | head -1)
echo "Search PublicWWW for: ${GAID}"

# Similar sites via search
# WebSearch: "<domain>" alternatives OR similar sites OR competitors
```

---

## 5. Stats Dashboard Output (ASCII)

### `/visitors` output format:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         VISITOR INTELLIGENCE REPORT                          ║
║                         Domain: [TARGET DOMAIN]                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  TRAFFIC OVERVIEW                                                            ║
║  ─────────────────────────────────────────────────────────────────           ║
║  Monthly Visits:    [N]           Composite Score: [0-100]                   ║
║  Bounce Rate:       [N]%          Tier: [Mega/Popular/Moderate/Niche]        ║
║  Pages/Visit:       [N]           Avg Duration: [N]s                         ║
║                                                                              ║
║  TRAFFIC SOURCES                                                             ║
║  ─────────────────────────────────────────────────────────────────           ║
║  Direct:   ████████████░░░░░░░░  55%                                         ║
║  Search:   ██████████░░░░░░░░░░  25%                                         ║
║  Referral: ████░░░░░░░░░░░░░░░░  10%                                         ║
║  Social:   ██░░░░░░░░░░░░░░░░░░   7%                                         ║
║  Paid:     █░░░░░░░░░░░░░░░░░░░   3%                                         ║
║                                                                              ║
║  TOP COUNTRIES                                                               ║
║  ─────────────────────────────────────────────────────────────────           ║
║  🇺🇸 United States    ████████████████████  45%                              ║
║  🇬🇧 United Kingdom   ██████████░░░░░░░░░░  15%                              ║
║  🇩🇪 Germany          ████████░░░░░░░░░░░░  12%                              ║
║  🇫🇷 France           ██████░░░░░░░░░░░░░░   8%                              ║
║  🇯🇵 Japan            ████░░░░░░░░░░░░░░░░   5%                              ║
║                                                                              ║
║  TECHNOLOGY STACK                                                            ║
║  ─────────────────────────────────────────────────────────────────           ║
║  ┌─────────────────┬──────────────────────────────────────────────┐          ║
║  │ Category        │ Technologies                                 │          ║
║  ├─────────────────┼──────────────────────────────────────────────┤          ║
║  │ CMS             │ [WordPress 6.4]                              │          ║
║  │ Analytics       │ [Google Analytics 4, Hotjar]                 │          ║
║  │ Frameworks      │ [React 18, Next.js 14]                      │          ║
║  │ CDN             │ [Cloudflare]                                 │          ║
║  │ Server          │ [Nginx 1.24]                                 │          ║
║  │ Hosting         │ [AWS (us-east-1)]                            │          ║
║  │ SSL             │ [Let's Encrypt, expires 2026-06-15]          │          ║
║  │ Ad Networks     │ [Google Ads, Meta Pixel]                     │          ║
║  └─────────────────┴──────────────────────────────────────────────┘          ║
║                                                                              ║
║  ANALYTICS CROSS-DOMAIN (shared tracking IDs)                                ║
║  ─────────────────────────────────────────────────────────────────           ║
║  GA4 ID: G-XXXXXXXXXX                                                        ║
║    → also found on: related-site.com, blog.target.com, shop.target.com      ║
║  GTM ID: GTM-YYYYYYYY                                                        ║
║    → also found on: partner-site.com                                        ║
║                                                                              ║
║  RELATED / COMPETITOR SITES                                                  ║
║  ─────────────────────────────────────────────────────────────────           ║
║  • competitor-a.com     (same category, similar traffic tier)                ║
║  • competitor-b.com     (shared referral sources)                            ║
║  • partner-site.com     (shared analytics — likely same owner)              ║
║                                                                              ║
║  CONFIDENCE: [MODERATE] — Triangulated across [N] sources                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 6. Fallback Cascades

### Technology Detection

| Primary Failed      | Fallback                                      |
| ------------------- | --------------------------------------------- |
| BuiltWith API down  | Use httpx + header analysis + source scanning |
| httpx not installed | Skip; use curl header analysis only           |
| Netcraft blocked    | Use WebSearch for cached report               |

### Visitor Volume

| Primary Failed            | Fallback                                         |
| ------------------------- | ------------------------------------------------ |
| SimilarWeb blocked        | Use HypeStat + StatsCrop triangulation           |
| HypeStat down             | Use SiteWorthTraffic                             |
| All estimation sites fail | Report Tranco/Umbrella rank only with tier label |

### Geography

| Primary Failed             | Fallback                                                   |
| -------------------------- | ---------------------------------------------------------- |
| SimilarWeb geo unavailable | Use SE Ranking or server location as proxy                 |
| No geo data at all         | Report "Geography: Unavailable" — note as intelligence gap |

### Competitors

| Primary Failed        | Fallback                                |
| --------------------- | --------------------------------------- |
| PublicWWW unavailable | Use WebSearch for analytics ID          |
| No analytics ID found | Use IP neighbor reverse lookup          |
| Reverse IP fails      | Use WebSearch category competitors only |

---

## 7. Confidence Ratings

| Finding                     | Confidence | Source             | Notes                       |
| --------------------------- | ---------- | ------------------ | --------------------------- |
| Tech stack (BuiltWith)      | HIGH       | Direct detection   | 250M+ site database         |
| Tech stack (httpx/headers)  | MODERATE   | Header analysis    | Headers can be spoofed      |
| Shared analytics ID         | VERY HIGH  | PublicWWW          | Near-certain ownership link |
| Monthly visits (SimilarWeb) | MODERATE   | Estimation         | ±25-50% error margin        |
| Monthly visits (HypeStat)   | LOW        | Estimation         | ±100% error — rough only    |
| Geography (SimilarWeb)      | MODERATE   | Estimation         | ±15% per country            |
| Traffic sources split       | MODERATE   | Estimation         | Varies by domain size       |
| Competitors (search)        | LOW        | Inference          | Contextual, not definitive  |
| Server/hosting (Netcraft)   | HIGH       | Direct observation | Authoritative source        |

---

## 8. Limitations

- **All visitor stats are estimates** — no external source can measure actual visits accurately
- **Small sites** (< 50k monthly) rarely appear in SimilarWeb or ranking lists
- **CDN masking** — Cloudflare/Akamai IPs return CDN neighbors, not true co-hosted sites
- **Analytics IDs** — Sites using server-side analytics (Plausible, Matomo self-hosted) won't have extractable client-side IDs
- **Geographic bias** — SimilarWeb skews toward English-speaking markets
- **Rate limits** — BuiltWith 1 req/sec, SimilarWeb ~10 req/min; space queries accordingly
- **HypeStat/StatsCrop accuracy** — Use only as directional signals, never cite as precise figures

---

## 9. Command Reference

| Command                          | Purpose                             | Input       | Output                       |
| -------------------------------- | ----------------------------------- | ----------- | ---------------------------- |
| `/visitors <domain>`             | Full visitor intelligence dashboard | Domain name | Stats dashboard + all data   |
| `/visitors <domain> --tech`      | Technology stack only               | Domain name | Tech table                   |
| `/visitors <domain> --geo`       | Geographic breakdown only           | Domain name | Country bar chart            |
| `/visitors <domain> --sources`   | Traffic sources only                | Domain name | Source breakdown             |
| `/visitors <domain> --analytics` | Analytics cross-domain linking      | Domain name | Shared ID + co-owned domains |
| `/techstack <domain>`            | Shortcut for tech detection only    | Domain name | Tech categories table        |
| `/competitors <domain>`          | Related and competitor sites        | Domain name | Competitor list + evidence   |

---

## 10. JSON Data Schema (for DOCX Report Integration)

When running `/visitors` as part of a `/case` or `/report`, the following data structure is added to the report JSON:

```json
{
  "visitor_stats": {
    "domain": "example.com",
    "monthly_visits": 150000,
    "bounce_rate": 45.2,
    "pages_per_visit": 3.1,
    "avg_duration_seconds": 125,
    "traffic_sources": {
      "direct": 55,
      "search": 25,
      "referral": 10,
      "social": 7,
      "paid": 3
    },
    "top_countries": [
      { "country": "United States", "share": 45 },
      { "country": "United Kingdom", "share": 15 },
      { "country": "Germany", "share": 12 },
      { "country": "France", "share": 8 },
      { "country": "Japan", "share": 5 }
    ],
    "technology": {
      "cms": ["WordPress 6.4"],
      "analytics": ["Google Analytics 4", "Hotjar"],
      "frameworks": ["React 18", "Next.js 14"],
      "cdn": ["Cloudflare"],
      "server": ["Nginx 1.24"],
      "hosting": ["AWS (us-east-1)"],
      "ssl": ["Let's Encrypt"],
      "ad_networks": ["Google Ads", "Meta Pixel"]
    },
    "shared_analytics_ids": [
      { "id": "G-XXXXXXXXXX", "type": "GA4", "co_domains": ["related-site.com", "blog.target.com"] },
      { "id": "GTM-YYYYYYYY", "type": "GTM", "co_domains": ["partner-site.com"] }
    ],
    "competitors": [
      { "domain": "competitor-a.com", "evidence": "same category, similar traffic tier" },
      { "domain": "partner-site.com", "evidence": "shared GA4 ID — likely same owner" }
    ],
    "data_sources": ["BuiltWith", "Netcraft", "SimilarWeb", "HypeStat", "PublicWWW"],
    "confidence": "MODERATE"
  }
}
```

---

_Visitor Intelligence Module v1.0.0_
_Part of CTI Expert Skill — Phase 5_
