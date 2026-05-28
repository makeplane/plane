# fx-dns-cert-history

> **Module ID:** DNS-CERT-HIST-001
> **Version:** 1.0.0
> **Classification:** Historical DNS Records & Certificate Timeline Intelligence

---

## 1. Overview

Retrieves historical DNS records and SSL/TLS certificate timelines for a domain. Reveals infrastructure changes, hosting migrations, nameserver swaps, and certificate issuer patterns over time. All methods are free and require zero API keys.

**Key use cases:** Infrastructure timeline reconstruction, hosting migration detection, domain ownership change indicators, expired certificate tracking, nameserver change correlation.

**Cross-references:** `domain-advanced.md` (current DNS/subdomain enum), `web-dns-forensics.md` (WHOIS/zone analysis), `scam-check.md` (current SSL check).

---

## 2. DNS History

### 2.1 Methods (all free, no API keys)

**Primary — SecurityTrails (web search, no auth for cached results):**

```bash
# Google dork to find cached SecurityTrails DNS history
# WebSearch: site:securitytrails.com/domain/<domain>/history/a
# WebSearch: site:securitytrails.com/domain/<domain>/dns

# Returns: historical A, AAAA, MX, NS, TXT record changes with dates
```

**Secondary — ViewDNS.info (free web lookup):**

```bash
# IP History — shows historical A record → IP mappings with dates
curl -s "https://viewdns.info/iphistory/?domain=<domain>"
# Parse HTML response for IP history table

# Reverse IP — find other domains on same historical IP
# WebSearch: site:viewdns.info/reverseip/?host=<IP>
```

**Tertiary — Mnemonic PassiveDNS (free API, no key):**

```bash
# Free passive DNS lookup — returns historical resolutions
curl -s "https://api.mnemonic.no/pdns/v3/<domain>" | python3 -m json.tool

# Response includes: rrtype, rrname, rdata, first_seen, last_seen, count
```

**Quaternary — Wayback CDX API (free, no auth):**

```bash
# Find archived DNS-related pages
curl -s "https://web.archive.org/cdx/search/cdx?url=<domain>&output=json&fl=timestamp,original&limit=50"
```

### 2.2 Investigation Workflow

```
Step 1: Query Mnemonic PassiveDNS API for historical A/AAAA/MX/NS records
  └─ curl -s "https://api.mnemonic.no/pdns/v3/<domain>" → parse JSON

Step 2: WebSearch for SecurityTrails cached history
  └─ site:securitytrails.com/domain/<domain>/history/a

Step 3: Check ViewDNS IP history
  └─ WebSearch: site:viewdns.info/iphistory/?domain=<domain>

Step 4: Cross-reference IP changes with WHOIS history
  └─ WebSearch: site:web.archive.org <domain> whois

Step 5: Build DNS timeline with dated record changes
  └─ Correlate across sources for HIGH confidence transitions
```

### 2.3 Expected Output

```
═══ DNS HISTORY: example.com ═══════════════════════

A Record Changes:
  2024-03-15 → 104.21.67.89  (Cloudflare)
  2023-01-08 → 192.168.1.100 (DigitalOcean)
  2021-06-22 → 45.33.32.156  (Linode)

NS Changes:
  2024-03-15 → ns1.cloudflare.com (migration to Cloudflare)
  2021-01-01 → ns1.digitalocean.com

MX Changes:
  2023-05-10 → aspmx.l.google.com (Google Workspace)
  2021-01-01 → mail.example.com (self-hosted)

Sources: Mnemonic PassiveDNS, SecurityTrails (cached), ViewDNS
```

### 2.4 Forensic Value

| Change Type                 | What It Reveals                               | Confidence |
| --------------------------- | --------------------------------------------- | ---------- |
| A record IP change          | Hosting migration, infrastructure shift       | HIGH       |
| NS record change            | DNS provider swap, possible ownership change  | HIGH       |
| MX record change            | Email provider migration                      | HIGH       |
| Multiple domains → same IP  | Shared hosting, co-owned properties           | MEDIUM     |
| Sudden Cloudflare migration | May indicate DDoS attack or security incident | MEDIUM     |

### 2.5 Fallback Cascade

```
Mnemonic API down?
  └─> SecurityTrails cached results via Google dork
  └─> ViewDNS.info IP history
  └─> Wayback CDX for archived DNS pages
  └─> WebSearch: "<domain>" "DNS history" OR "IP history"
```

---

## 3. Certificate History

### 3.1 Methods (all free, no API keys)

**Primary — crt.sh JSON API (free, no auth, comprehensive):**

```bash
# Full certificate history — returns ALL certs ever issued for domain
curl -s "https://crt.sh/?q=<domain>&output=json" | python3 -m json.tool

# Wildcard search — includes subdomains
curl -s "https://crt.sh/?q=%25.<domain>&output=json" | python3 -m json.tool

# Key fields: issuer_name, not_before, not_after, common_name, name_value (SANs)
```

**Secondary — CertSpotter (free tier, no key for basic):**

```bash
# WebSearch for cached CertSpotter results
# WebSearch: site:sslmate.com/certspotter "<domain>"
```

**Tertiary — Google Transparency Report:**

```bash
# WebSearch: site:transparencyreport.google.com "<domain>"
# Shows certificate transparency log entries
```

### 3.2 Investigation Workflow

```
Step 1: Query crt.sh JSON API for full certificate timeline
  └─ curl -s "https://crt.sh/?q=<domain>&output=json"

Step 2: Parse and sort by not_before date (issuance date)
  └─ Extract: issuer, validity period, SANs, serial number

Step 3: Identify patterns:
  └─ Issuer changes (Let's Encrypt → DigiCert = budget → enterprise)
  └─ SAN list changes (new subdomains appearing in certs)
  └─ Validity gaps (expired periods = possible downtime/abandonment)
  └─ Short-lived certs (90-day = Let's Encrypt automation)

Step 4: Cross-reference SANs with DNS history
  └─ New SANs = new subdomains or services launched

Step 5: Build certificate timeline
```

### 3.3 Expected Output

```
═══ CERTIFICATE HISTORY: example.com ═══════════════

Cert Timeline (newest first):
  #1  2024-09-01 → 2025-09-01  Issuer: Let's Encrypt R3
      SANs: example.com, www.example.com, api.example.com
  #2  2024-06-01 → 2024-09-01  Issuer: Let's Encrypt R3
      SANs: example.com, www.example.com
  #3  2023-01-15 → 2024-01-15  Issuer: DigiCert SHA2 Extended Validation
      SANs: example.com, www.example.com, shop.example.com
  #4  2021-03-10 → 2022-03-10  Issuer: Comodo RSA DV
      SANs: example.com

Patterns Detected:
  • Issuer change: Comodo → DigiCert EV → Let's Encrypt (downgrade from EV)
  • New SAN "api.example.com" appeared 2024-06-01 (new service launched)
  • SAN "shop.example.com" removed after 2024 (shop discontinued?)
  • Certificate automation detected (90-day renewal cycle since 2024)

Total certificates issued: 4
Sources: crt.sh Certificate Transparency
```

### 3.4 Forensic Value

| Pattern                           | What It Reveals                                   | Confidence |
| --------------------------------- | ------------------------------------------------- | ---------- |
| Issuer change (EV → DV/LE)        | Budget reduction, ownership change, or automation | MEDIUM     |
| New SANs appearing                | New services/subdomains launched                  | HIGH       |
| SANs disappearing                 | Services discontinued or moved                    | MEDIUM     |
| Validity gap (no cert for period) | Site downtime, abandonment, or migration          | MEDIUM     |
| Wildcard cert introduced          | Infrastructure scaling or simplification          | LOW        |
| Very short validity (<30 days)    | Testing, staging, or misconfiguration             | LOW        |

### 3.5 Fallback Cascade

```
crt.sh API slow/down?
  └─> crt.sh web UI: https://crt.sh/?q=<domain> (parse HTML)
  └─> Google Transparency Report search
  └─> WebSearch: "<domain>" certificate transparency
  └─> Wayback Machine: site:crt.sh "?q=<domain>"
```

---

## 4. Combined DNS + Cert Timeline

When running both `/dns-history` and `/cert-history` on the same domain, correlate findings:

```
Cross-Reference Analysis:
  • DNS A record changed on 2024-03-15 (Cloudflare migration)
    → New cert issued 2024-03-15 (Let's Encrypt via Cloudflare)
    → Confirms hosting migration date

  • SAN "shop.example.com" appeared in 2023 cert
    → Subdomain A record for shop.example.com first seen 2023-01-10
    → Confirms new service launch timeline

  • MX changed to Google Workspace on 2023-05-10
    → No cert change (email doesn't require web cert)
    → Independent infrastructure decision
```

---

## 5. Limitations

1. **Mnemonic PassiveDNS** — Coverage varies by domain popularity; obscure domains may have sparse history
2. **SecurityTrails** — Free web access only via cached Google results; direct API requires paid key
3. **ViewDNS** — HTML parsing required; no structured API for free tier
4. **crt.sh** — Only shows certificates from public CT logs; private/internal CAs not included
5. **Historical gaps** — Passive DNS collection started ~2010; older records may not exist
6. **Rate limiting** — crt.sh and Mnemonic may throttle high-volume queries

---

## 6. Command Reference

| Command                  | Purpose                                   | Input       |
| ------------------------ | ----------------------------------------- | ----------- |
| `/dns-history [domain]`  | Historical DNS record changes (A, NS, MX) | Domain name |
| `/cert-history [domain]` | SSL/TLS certificate timeline from CT logs | Domain name |

---

_DNS & Certificate History Module v1.0.0_
_Part of CTI Expert Skill_
_For authorized investigation and educational purposes only_
