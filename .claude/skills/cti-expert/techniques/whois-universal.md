# Universal WHOIS Investigation

> **Module ID:** WHOIS-UNI-001
> **Version:** 1.0.0
> **Phase:** Enhancement Module
> **Classification:** Domain Registration & Ownership Intelligence

---

## 1. Overview

Multi-TLD WHOIS with 4-layer fallback cascade. Covers gTLDs, ccTLDs (.vn, .th, .sg, .kr, etc.), and IP/ASN lookups. Zero API keys for core functionality.

**When to use:** Any time domain ownership, registration timeline, or registrant identity is needed — especially for ccTLDs where basic `whois` fails.

---

## 2. WHOIS Cascade

### Layer 1: whoisdomain Python Library (Primary)

Auto-detects TLD → correct WHOIS server via IANA. ~90% coverage, parsed structured output.

```bash
# Install
pip3 install whoisdomain

# Query
python3 -c "import whoisdomain; print(whoisdomain.query('example.vn'))"

# Structured fields
python3 -c "
import whoisdomain
d = whoisdomain.query('example.com')
print(f'Registrant: {d.registrant}')
print(f'Emails: {d.emails}')
print(f'Created: {d.creation_date}')
print(f'Expires: {d.expiration_date}')
print(f'Name servers: {d.name_servers}')
"
```

**Strengths:** Structured output, auto-TLD detection, no API key.
**Weakness:** Some ccTLDs return raw text only.

### Layer 2: CLI whois with TLD-Specific Server (Secondary)

Direct server specification for ccTLDs. Use when whoisdomain fails to parse or connect.

```bash
whois -h whois.vnnic.vn domain.vn
```

#### ccTLD WHOIS Server Reference

| TLD | WHOIS Server          | Country        |
| --- | --------------------- | -------------- |
| .vn | whois.vnnic.vn        | Vietnam        |
| .th | whois.thnic.co.th     | Thailand       |
| .sg | whois.sgnic.sg        | Singapore      |
| .kr | whois.kr              | South Korea    |
| .jp | whois.jprs.jp         | Japan          |
| .cn | whois.cnnic.cn        | China          |
| .tw | whois.twnic.net.tw    | Taiwan         |
| .id | whois.id              | Indonesia      |
| .my | whois.mynic.my        | Malaysia       |
| .ph | whois.dot.ph          | Philippines    |
| .in | whois.registry.in     | India          |
| .ru | whois.tcinet.ru       | Russia         |
| .br | whois.registro.br     | Brazil         |
| .za | whois.registry.net.za | South Africa   |
| .ng | whois.nic.net.ng      | Nigeria        |
| .ke | whois.kenic.or.ke     | Kenya          |
| .de | whois.denic.de        | Germany        |
| .fr | whois.nic.fr          | France         |
| .it | whois.nic.it          | Italy          |
| .es | whois.nic.es          | Spain          |
| .nl | whois.sidn.nl         | Netherlands    |
| .uk | whois.nic.uk          | United Kingdom |
| .au | whois.auda.org.au     | Australia      |
| .nz | whois.srs.net.nz      | New Zealand    |
| .mx | whois.mx              | Mexico         |
| .ar | whois.nic.ar          | Argentina      |
| .co | whois.nic.co          | Colombia       |

**Usage:** `whois -h <server> <domain>`

### Layer 3: Whoxy Free API (Tertiary)

1595+ TLD coverage, JSON response. No auth, no published rate limits.

```bash
# Standard lookup
curl -s "https://api.whoxy.com/?key=free&whois=domain.vn" | jq .

# Reverse WHOIS by email
curl -s "https://api.whoxy.com/?key=free&reverse=whois&email=target@email.com" | jq .

# WHOIS history
curl -s "https://api.whoxy.com/?key=free&history=domain.com" | jq .
```

**Strengths:** Massive TLD coverage, JSON output, reverse + history.
**Weakness:** Third-party aggregator — may have stale data.

### Layer 4: Web Scrape Fallback (Quaternary)

When all programmatic methods fail:

```bash
# who.is web UI
curl -sL "https://who.is/whois/domain.vn" | grep -A5 'Registrant'

# Google for cached WHOIS
# WebSearch: "domain.vn" whois registration registrant
```

---

## 3. Reverse WHOIS (Free)

Find all domains registered by same entity:

```bash
# Whoxy reverse by email
curl -s "https://api.whoxy.com/?key=free&reverse=whois&email=target@email.com" | jq '.search_result[]'

# Whoxy reverse by name
curl -s "https://api.whoxy.com/?key=free&reverse=whois&name=John+Doe" | jq '.search_result[]'

# ViewDNS reverse (WebSearch)
# WebSearch: site:viewdns.info/reversewhois/?q=target@email.com

# DomainBigData (WebSearch)
# WebSearch: site:domainbigdata.com "registrant" "target@email.com"
```

---

## 4. Historical WHOIS (Free)

Track ownership changes over time:

```bash
# Whoxy history
curl -s "https://api.whoxy.com/?key=free&history=domain.com" | jq '.whois_records[]'

# Wayback Machine WHOIS snapshots
# WebSearch: site:web.archive.org "domain.com" whois

# Google cache of SecurityTrails/DomainTools pages
# WebSearch: cache:securitytrails.com/domain/domain.com/dns
```

---

## 5. IP/ASN WHOIS

```bash
# IP WHOIS (find network owner)
whois 1.2.3.4
# Key fields: NetName, OrgName, CIDR range, abuse contact

# ASN lookup
whois -h whois.radb.net AS12345
# Or: https://bgp.tools/as/12345

# ARIN (North America)
curl -s "https://whois.arin.net/rest/ip/1.2.3.4" -H "Accept: application/json" | jq .

# RIPE (Europe)
curl -s "https://rest.db.ripe.net/search?query-string=1.2.3.4&source=ripe" -H "Accept: application/json" | jq .
```

---

## 6. .vn Domain WHOIS Deep Dive

Vietnam-specific WHOIS details:

- **Server:** whois.vnnic.vn (port 43)
- **Operator:** VNNIC (Vietnam Internet Network Information Center)
- **Web interface:** https://vnnic.vn/en/whois-information
- **Response fields:** registrant, admin contact, tech contact, name servers, dates
- **Parsing notes:** Vietnamese text in registrant fields common; UTF-8 encoding
- **No REST API available** — port 43 or web scrape only

```bash
# Direct query
whois -h whois.vnnic.vn example.vn

# If whois CLI unavailable, use netcat
echo "example.vn" | nc whois.vnnic.vn 43
```

---

## 7. Investigation Workflow

1. `whoisdomain.query(domain)` → if structured result → **DONE**
2. If parse fails → `whois -h <tld-server> domain` → raw text
3. If connection refused → Whoxy API → JSON
4. If all fail → web scrape who.is → HTML parse
5. Cross-reference with DNS history for timeline

Tag findings: `[whois-lib]` · `[whois-cli]` · `[whois-api]` · `[whois-scrape]`

---

## 8. Confidence Ratings

| Source             | Tag            | Confidence | Notes                     |
| ------------------ | -------------- | ---------- | ------------------------- |
| whoisdomain parsed | [whois-lib]    | HIGH       | Direct WHOIS server query |
| CLI whois raw      | [whois-cli]    | HIGH       | Authoritative server      |
| Whoxy API          | [whois-api]    | MEDIUM     | Third-party aggregator    |
| Web scrape         | [whois-scrape] | LOW        | May be cached/stale       |
