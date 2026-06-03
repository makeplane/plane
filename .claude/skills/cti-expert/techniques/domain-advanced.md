# Domain Advanced Module

> **Module ID:** DOM-ADV-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Advanced Subdomain Enumeration & Infrastructure Mapping

---

## 1. Overview

Performs deep subdomain discovery and infrastructure clustering using passive and semi-passive sources — certificate transparency logs, BGP/ASN data, historical URL archives, and multi-source passive DNS.

**When to use:** Attack surface mapping, org infrastructure recon, pre-pentest scope validation, exposure assessment.

**Passive vs Active:**

- **Passive** — queries third-party databases; no direct contact with target. Safe, stealthy.
- **Active** — sends DNS queries or probes directly to target infrastructure. Leaves footprint.

This module defaults to **passive** enumeration only.

---

## 2. Tool Inventory

| Priority   | Tool        | Sources                                                        | Install                                                                    |
| ---------- | ----------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Primary    | Subfinder   | 45+ passive sources                                            | `go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest` |
| Secondary  | Amass       | 87 passive sources                                             | `go install github.com/owasp-amass/amass/v4/...@master`                    |
| CT Logs    | crt.sh      | Certificate Transparency                                       | `curl` + `jq` (no install)                                                 |
| Network    | ASN Tool    | BGP/ASN/CIDR/peers                                             | `pip3 install asn` or `go install github.com/nitefood/asn@latest`          |
| Historical | **Waymore** | Wayback + Common Crawl + OTX + URLScan + VT + more (7 sources) | `pip3 install waymore`                                                     |
| Historical | GAU         | Wayback + AlienVault + Common Crawl + URLScan                  | `go install github.com/lc/gau/v2/cmd/gau@latest`                           |

---

## 3. Investigation Workflow

```
1. crt.sh query — fast, no auth, returns CT-logged subdomains (start here)
2. Subfinder — broad passive enumeration across 45+ sources
3. Amass passive — deeper coverage, slower, cross-reference with Subfinder
4. Deduplicate combined output into master list
5. ASN lookup — map IPs to network blocks, identify hosting/CDN/cloud
6. Waymore — pull archived URLs from 7 sources (replaces GAU as primary)
7. GAU — secondary historical URL discovery if waymore unavailable
8. Cluster findings by IP range, ASN, provider
9. Flag interesting targets (login panels, APIs, staging, internal-facing)
```

---

## 4. CLI Commands & Expected Output

### crt.sh — Certificate Transparency logs

```bash
curl -s "https://crt.sh/?q=%25.<domain>&output=json" \
  | jq -r '.[].name_value' \
  | sed 's/\*\.//g' \
  | sort -u \
  | tee crtsh-subdomains.txt
```

**Expected output:**

```
api.example.com
dev.example.com
mail.example.com
staging.example.com
vpn.example.com
```

### Subfinder — multi-source passive enumeration

```bash
subfinder -d <domain> -o subfinder-subdomains.txt -oJ -silent
```

**With provider config (recommended for full coverage):**

```bash
subfinder -d <domain> -pc ~/.config/subfinder/provider-config.yaml -o subfinder-subdomains.txt -oJ
```

**Expected JSON output:**

```json
{"host":"api.example.com","input":"example.com","source":"censys"}
{"host":"dev.example.com","input":"example.com","source":"certspotter"}
```

### Amass — passive-only enumeration

```bash
amass enum -passive -d <domain> -json amass-output.json -timeout 15
```

**Extract hostnames from JSON:**

```bash
cat amass-output.json | jq -r '.name' | sort -u | tee amass-subdomains.txt
```

### Deduplicate combined output

```bash
cat crtsh-subdomains.txt subfinder-subdomains.txt amass-subdomains.txt \
  | sort -u \
  | grep -v '^\*' \
  | tee all-subdomains.txt
wc -l all-subdomains.txt
```

### ASN Tool — BGP/network infrastructure mapping

```bash
asn -d <domain>
```

**Per-IP ASN lookup:**

```bash
asn <ip_address>
```

**Expected output:**

```
AS13335 | CLOUDFLARENET | US | 104.21.0.0/16 | Cloudflare
AS16509 | AMAZON-02     | US | 54.230.0.0/15 | AWS CloudFront
```

### Waymore — multi-source historical URL discovery (PRIMARY)

```bash
# All archived URLs including subdomains:
waymore -i <domain> -mode U -oU waymore-urls.txt

# Extract subdomains from discovered URLs:
cat waymore-urls.txt | grep -oP '(?<=://)[^/]+' | sort -u | grep "\.<domain>$" | tee waymore-subdomains.txt

# Download response bodies for content analysis:
waymore -i <domain> -mode R -oR ./waymore-responses/ -l 1000

# Filter by date range for targeted historical analysis:
waymore -i <domain> -mode U -from 2020 -to 2024 -oU waymore-urls.txt
```

**Install:** `pip3 install waymore` — https://github.com/xnl-h4ck3r/waymore

### GAU — historical URL discovery (FALLBACK if waymore unavailable)

```bash
echo <domain> | gau --subs --threads 5 2>/dev/null \
  | grep -oP '(?<=://)[^/]+' \
  | sort -u \
  | grep "\.<domain>$" \
  | tee gau-subdomains.txt
```

---

## 5. Fallback Cascade

```
Subfinder unavailable
  → Use amass alone: amass enum -passive -d <domain>
  → Use crt.sh + manual DNS search

Amass unavailable
  → Use Subfinder + crt.sh (covers ~70% of Amass sources)

crt.sh API down
  → Query directly: https://crt.sh/?q=<domain>&output=json
  → Use certspotter: https://api.certspotter.com/v1/issuances?domain=<domain>&include_subdomains=true

GAU unavailable
  → Wayback CDX API directly:
    curl "http://web.archive.org/cdx/search/cdx?url=*.<domain>&output=text&fl=original&collapse=urlkey"

ASN tool unavailable
  → BGP.he.net: https://bgp.he.net/dns/<domain>
  → ipinfo.io: curl https://ipinfo.io/<ip>/json
```

---

## 6. Output Interpretation

**Subdomain naming patterns to flag:**

```
dev.*, staging.*, test.*, qa.*  → Pre-production, often less hardened
admin.*, panel.*, manage.*      → Admin interfaces
api.*, v1.*, v2.*               → API endpoints
vpn.*, remote.*, citrix.*       → Remote access (high value)
mail.*, smtp.*, mx.*            → Email infrastructure
internal.*, intranet.*          → May be accidentally public
```

**Infrastructure clustering by ASN:**

- Same ASN across many subdomains = self-hosted or single cloud account
- Mixed ASNs = CDN + origin separation; CDN may mask real IP
- Single IP hosting many subdomains = shared hosting, virtual hosting attack surface

**GAU historical findings:**

- URLs present in archive but not in current DNS = decommissioned assets
- Check if old subdomains still resolve — forgotten infrastructure is often unpatched

---

## 7. Confidence Ratings

| Finding Type                 | Confidence | Notes                                     |
| ---------------------------- | ---------- | ----------------------------------------- |
| crt.sh CT log match          | HIGH       | Certificate was issued; subdomain existed |
| Subfinder verified source    | HIGH       | Cross-referenced across providers         |
| Amass passive result         | HIGH       | 87-source cross-reference                 |
| GAU historical URL           | MEDIUM     | May be decommissioned                     |
| ASN attribution              | HIGH       | BGP routing data is authoritative         |
| Inferred from naming pattern | LOW        | Guessed, not confirmed                    |

---

## 8. Limitations

- **Passive only = no brute-force:** Uncommon or internal subdomains may be missed entirely
- **Wildcard DNS:** `*.example.com` resolving causes false positives in active probing; passive unaffected
- **crt.sh rate limits:** Excessive queries may return 429; add `sleep 2` between requests
- **Subfinder free tier:** Without provider API keys, ~30% of sources active. Configure `provider-config.yaml` for full coverage (Shodan, Censys, SecurityTrails, etc.)
- **Amass speed:** Passive mode with 87 sources can take 10-30 min for large orgs; use `-timeout` flag
- **GAU completeness:** Wayback Machine coverage varies; recent subdomains may not be archived
- **CDN masking:** Cloudflare/Akamai/Fastly IPs mask origin — ASN will show CDN, not host

---

## 9. Command Reference

### `/subdomain [domain]`

**Input:** Apex domain (e.g., `example.com`)
**Process:**

1. crt.sh CT log query
2. Subfinder passive scan
3. Amass passive enum (15-min timeout)
4. GAU historical subdomain extraction
5. Deduplicate all sources into master list
6. ASN lookup on resolved IPs
7. Cluster by provider/ASN
8. Flag high-interest naming patterns

**Subfinder Provider Config** (`~/.config/subfinder/provider-config.yaml`):

```yaml
shodan:
  - YOUR_SHODAN_API_KEY
censys:
  - YOUR_CENSYS_API_ID:YOUR_CENSYS_SECRET
securitytrails:
  - YOUR_ST_API_KEY
```

All above have free tiers sufficient for OSINT use.

**Output:** Deduplicated subdomain list, ASN/provider map, flagged high-interest targets, total unique count per source.

---

_Domain Advanced Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized reconnaissance and educational purposes only_
