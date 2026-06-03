# Scam & Malicious Domain/URL Check Module

Free-tier domain and URL reputation checking using zero-cost public services. No API keys required.

---

## Purpose

Determine whether a domain or URL is associated with phishing, scams, malware, or other malicious activity using exclusively free, no-authentication-required services.

> **Collection enhancement:** Web scraping steps (PhishTank, CheckPhish, etc.)
> use Scrapling fetchers for resilient data collection. See
> `techniques/web-collection-scrapling.md` for auto-escalation behavior.

---

## Execution Sequence

### Step 1: PhishDestroy API (Primary — No API Key)

Free threat intelligence API with 770K+ malicious domains. Syncs hourly.

**Single domain check:**

```bash
curl -s "https://api.destroy.tools/v1/check?domain=[DOMAIN]"
```

**Response fields:**

- `threat` (boolean) — is the domain flagged as malicious
- `risk_score` (0-100) — numerical risk rating
- `severity` — critical / high / medium / low
- DNS status and matched threat keywords

**Bulk check (up to 500 domains):**

```bash
curl -s -X POST "https://api.destroy.tools/v1/check/bulk" \
  -H "Content-Type: application/json" \
  -d '{"domains":["domain1.com","domain2.com"]}'
```

### Step 2: Google Safe Browsing Transparency Report

Web-based lookup — no API key needed.

**Method:** WebSearch or WebFetch on:

```
https://transparencyreport.google.com/safe-browsing/search?url=[DOMAIN]
```

**What it checks:** Malware, social engineering, unwanted software, potentially harmful applications.

### Step 3: URLScan.io Public Search

Free public search — no API key needed for viewing existing scans.

**Method:** WebSearch for `site:urlscan.io "[DOMAIN]"` or WebFetch:

```
https://urlscan.io/search/#page.domain:[DOMAIN]
```

**What it provides:** Page screenshots, DOM snapshots, HTTP transactions, detected technologies, linked domains, IP associations.

### Step 4: VirusTotal Public Page

Free public lookup — no API key needed for basic results.

**Method:** WebSearch for `site:virustotal.com "[DOMAIN]"` or fetch via `agent-browser`; use `ck:chrome-profile` only for real logged-in Chrome state:

```
https://www.virustotal.com/gui/domain/[DOMAIN]
```

**What it provides:** Detection ratio across 70+ security engines, DNS history, WHOIS, subdomains, community comments.

### Step 5: Scamadviser Reputation

Free web-based trust score.

**Method:** WebSearch for `site:scamadviser.com "[DOMAIN]"` or WebFetch:

```
https://www.scamadviser.com/check-website/[DOMAIN]
```

**What it provides:** Trust score (0-100), country of origin, owner info, website age, risk factors.

### Step 6: PhishTank Database Check

Free — no API key required for basic lookups.

**Method:** WebSearch for `site:phishtank.org "[DOMAIN]"` or WebFetch:

```
https://phishtank.org/target_search.php?target=[DOMAIN]
```

**What it checks:** Whether the domain appears in the PhishTank verified phishing database.

### Step 7: CheckPhish Free Scan

Free URL scanning service.

**Method:** WebSearch for `site:checkphish.bolster.ai "[DOMAIN]"` to find existing scan results.

### Step 8: Domain Age & Registration Anomaly Check

Use CLI tools already available (no API key):

```bash
whois [DOMAIN]
```

**Red flags to check:**

- Domain age < 30 days — high risk for phishing/scam
- Domain age < 90 days — elevated risk
- Privacy-protected WHOIS on a site claiming to be a known brand
- Registrar known for abuse-friendly policies
- Recently updated nameservers (possible domain hijack)

### Step 9: SSL Certificate Analysis

```bash
echo | openssl s_client -connect [DOMAIN]:443 -servername [DOMAIN] 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

**Red flags:**

- Self-signed certificate on a commercial site
- Let's Encrypt cert on a site impersonating a major brand (not inherently bad, but combined with other signals)
- Certificate issued to a different domain than the one being visited
- Expired certificate

### Step 10: DNS-Based Blocklist Check

Free DNS-based blocklist services — query via `dig`:

```bash
# Spamhaus DBL (Domain Block List)
dig [DOMAIN].dbl.spamhaus.org +short

# SURBL
dig [DOMAIN].multi.surbl.org +short

# URIBL
dig [DOMAIN].multi.uribl.com +short
```

**Interpretation:** A non-empty response (typically 127.0.0.x) means the domain is listed.

---

## Output Format

```
SCAM/MALICIOUS CHECK: [DOMAIN]

VERDICT: [SAFE / SUSPICIOUS / MALICIOUS / UNKNOWN]
RISK SCORE: [0-100] (composite)

SOURCE RESULTS
┌─────────────────────┬────────────┬──────────────────────────┐
│ Source               │ Status     │ Details                  │
├─────────────────────┼────────────┼──────────────────────────┤
│ PhishDestroy API     │ [CLEAN/HIT]│ risk_score: X, severity  │
│ Google Safe Browsing │ [SAFE/FLAG]│ category if flagged      │
│ URLScan.io           │ [CLEAN/HIT]│ scan count, flags        │
│ VirusTotal           │ [X/Y]     │ detection ratio          │
│ Scamadviser          │ [SCORE]   │ trust score 0-100        │
│ PhishTank            │ [CLEAN/HIT]│ verified phishing Y/N    │
│ Domain Age           │ [DAYS]    │ registration date        │
│ SSL Certificate      │ [VALID/??]│ issuer, expiry           │
│ DNS Blocklists       │ [X/3]     │ which lists triggered    │
└─────────────────────┴────────────┴──────────────────────────┘

RISK FACTORS
- [List specific concerns: new domain, flagged by N engines, etc.]

CONFIDENCE: [🟢 HIGH / 🟡 MEDIUM / 🔴 LOW]
[Explain basis for confidence level]

RECOMMENDATION
[Clear action guidance: safe to proceed / exercise caution / do not interact]
```

---

## Composite Risk Score Calculation

| Factor                  | Weight | Scoring                             |
| ----------------------- | ------ | ----------------------------------- |
| PhishDestroy risk_score | 25%    | Direct score (0-100)                |
| VirusTotal detections   | 25%    | (detections/total_engines) \* 100   |
| Scamadviser trust       | 15%    | 100 - trust_score                   |
| Domain age              | 15%    | <30d=100, <90d=70, <1yr=40, >1yr=10 |
| DNS blocklist hits      | 10%    | (hits/3) \* 100                     |
| PhishTank/GSB flags     | 10%    | Hit=100, Clean=0                    |

**Verdict thresholds:**

- 0-20: SAFE
- 21-45: LOW RISK
- 46-70: SUSPICIOUS
- 71-100: MALICIOUS

---

## Tool Priority

1. **CLI first** — `whois`, `dig`, `openssl`, `curl` (PhishDestroy API)
2. **Web search** — for URLScan.io, VirusTotal, Scamadviser indexed results
3. **WebFetch** — for pages with static content
4. agent-browser - for JavaScript-heavy pages; ck:chrome-profile only when real user Chrome cookies are required (VirusTotal, Scamadviser)

---

## Notes

- All services used are free and require no API keys or authentication
- PhishDestroy API is the only programmatic API called directly; all others use web search/fetch
- False positives happen — a single flagged source does not confirm malicious intent
- Domain age alone is not proof of malice — correlate with other signals
- Always report which specific sources flagged the domain and which cleared it
