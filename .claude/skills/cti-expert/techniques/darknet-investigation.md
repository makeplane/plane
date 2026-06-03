# Darknet Investigation Module

> **Module ID:** DARKNET-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Dark Web Search, Leak Monitoring & Ransomware Tracking

---

## 1. Overview

Darknet investigation OSINT locates threat actor activity, ransomware victim claims, data leaks, and illicit marketplace intelligence from Tor hidden services and dark web indexes. Use when a target organization, individual, or keyword needs to be monitored across dark web forums, marketplaces, and ransomware group leak sites.

**Key use cases:** Ransomware victim identification, credential and data leak discovery, threat actor attribution, dark web marketplace monitoring, incident response triage, and compliance/due diligence screening.

**Note:** Full access to `.onion` sites requires Tor Browser or a local Tor SOCKS5 proxy (port 9050 by default). Several tools in this module provide **clearnet access** to dark web intelligence without requiring Tor — these are noted explicitly.

---

## 2. Tool Inventory

### Search & Discovery

#### Ahmia.fi

**URL:** https://ahmia.fi/
**Tor access:** http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion/

Search engine for Tor hidden services. Accessible via clearnet — no Tor required for basic keyword searching. Filters out child sexual abuse material (CSAM) from its index.

- **Usage:** Enter keyword in search bar → returns `.onion` URLs with page title and snippet
- **Clearnet:** Yes — full search available without Tor
- **Best for:** Initial keyword sweep across indexed `.onion` content

#### onionsearch (CLI)

**Install:** `pip3 install onionsearch`
**Repo:** https://github.com/megadose/onionsearch

CLI tool that queries multiple `.onion` search engines simultaneously and aggregates results. Requires a running Tor proxy (SOCKS5 on 127.0.0.1:9050).

- **Searches across:** Ahmia, Torch, DarkSearch, Haystack, and others
- **Usage:** `onionsearch "target keyword" --len 10`
- **Clearnet:** No — requires Tor proxy

#### DarknetLive

**URL:** https://darknetlive.com/onions/
**Forums section:** https://darknetlive.com/forums/

Curated, actively maintained directory of verified `.onion` services. Lists marketplaces, forums, and service sites with activity status. More reliable than stale link lists.

- **Usage:** Browse by category or use browser Ctrl+F to search for specific service names
- **Clearnet:** Yes — no Tor required for the directory
- **Best for:** Identifying which platforms a target may be active on

### Ransomware & Extortion Monitoring

#### ransomwatch

**URL:** https://ransomwatch.telemetry.ltd/
**API:** https://api.ransomwatch.telemetry.ltd/

Transparent ransomware group claim tracker. Monitors leak sites for new victim posts and exposes data via a public API. Supplements ransomware.live (already in cti-expert).

- **Usage:** Browse by group, or use the API to query by keyword
- **Clearnet:** Yes — fully clearnet accessible
- **Best for:** Confirming whether a target organization appears as a ransomware victim

#### DDoSecrets (Distributed Denial of Secrets)

**URL:** https://ddosecrets.com/

Repository of leaked datasets published by hacktivist groups. Hosts publicly released data from breaches, government leaks, and corporate exposures.

- **Usage:** Browse Special:AllPages or search for organization/country
- **Clearnet:** Yes
- **Best for:** Hacktivist leak discovery; documents published after exfiltration

### Scanning & Analysis

#### OnionScan

**Repo:** https://github.com/s-rah/onionscan

Open-source scanner for analyzing `.onion` services for security misconfigurations that may deanonymize the operator (Apache server leaks, Bitcoin addresses, email addresses, linked clearnet infrastructure).

- **Usage:** `onionscan http://example.onion` — produces JSON report of linkage risks
- **Clearnet:** No — requires Tor; scans `.onion` targets directly
- **Best for:** Attribution work — identifying clearnet infrastructure linked to a dark web operator

### Additional Reference Resources

- **Torch** — One of the oldest Tor search engines; large index but low result quality. Onion-only access.
- **Hunchly Dark Web Tracker** — Commercial tool for automated dark web page capture and monitoring. Useful for long-term tracking campaigns (reference for capabilities comparison).

---

## 3. Investigation Workflow

```
Step 1: Clearnet intelligence — no Tor needed
  └─ Ahmia.fi: keyword search across indexed onion sites
       https://ahmia.fi/search/?q={keyword}
  └─ ransomwatch: check if target appears as ransomware victim
       https://ransomwatch.telemetry.ltd/
  └─ DDoSecrets: check for hacktivist leak datasets involving target
       https://ddosecrets.com/wiki/Special:AllPages
  └─ DarknetLive: identify relevant marketplaces/forums by category
       https://darknetlive.com/onions/

Step 2: Expanded keyword search via Tor (requires Tor Browser or proxy)
  └─ onionsearch CLI: query multiple search engines simultaneously
       onionsearch "target organization" --len 10
  └─ Direct .onion access for specific marketplace/forum pages
  └─ Ahmia .onion for search within Tor network

Step 3: Ransomware victim verification
  └─ ransomwatch API: query by domain or organization name
       curl "https://api.ransomwatch.telemetry.ltd/victims" | jq ...
  └─ ransomware.live (existing cti-expert tool): cross-reference
  └─ Note timestamp of first claim appearance (important for IR timelines)

Step 4: Leak site monitoring
  └─ DDoSecrets: search for datasets referencing the target
  └─ Paste site sweeps (Pastebin, Ghostbin, PrivateBin): Google dork
       site:pastebin.com "{organization}" password OR dump OR leak

Step 5: Attribution analysis (Advanced — requires Tor + OnionScan)
  └─ OnionScan target .onion service for OPSEC failures:
       - Apache server headers leaking clearnet hostname
       - Linked Bitcoin addresses (cross-reference blockchain explorers)
       - Email addresses embedded in page source
       - Linked clearnet domains or CDN origins
  └─ PGP key cross-reference: same key on dark web and clearnet?
  └─ Writing style / handle cross-reference with clearnet profiles

Step 6: Documentation (critical for legal and compliance)
  └─ Screenshot all findings with timestamp visible
  └─ archive.org does NOT index .onion — save pages locally via:
       wget --no-check-certificate -p -k http://example.onion/page
  └─ Maintain chain of custody record if findings are for legal proceedings
  └─ Log: date/time, URL, tool used, investigator identity, hash of saved file
```

---

## 4. CLI Commands & Expected Output

### Ahmia Clearnet Search

```bash
# Keyword search via clearnet — no Tor required
# Replace spaces with + in query
curl -s "https://ahmia.fi/search/?q=target+organization" \
  | python3 -c "
import sys, re
html = sys.stdin.read()
# Extract result URLs and titles
urls = re.findall(r'href=\"(http[s]?://[^\"]+\.onion[^\"]*?)\"', html)
for u in urls[:20]:
    print(u)
"
```

**Expected output:**

```
http://exampleabcdef.onion/forum/thread/12345
http://darkmarketxyz.onion/vendor/target-name
http://leaksite123.onion/post/organization-dump
```

### ransomwatch API Query

```bash
# Query ransomwatch for victims matching a keyword (clearnet, no auth)
curl -s "https://api.ransomwatch.telemetry.ltd/victims" \
  | jq '.[] | select(.post_title | test("keyword"; "i")) | {
      group: .group_name,
      victim: .post_title,
      date: .discovered,
      url: .post_url
    }'
```

**Expected output:**

```json
{
  "group": "lockbit",
  "victim": "Target Organization Inc",
  "date": "2024-03-15T14:22:00",
  "url": "http://lockbit3abcdef.onion/post/12345"
}
```

### ransomware.live Cross-Reference (existing cti-expert tool)

```bash
# Supplement with ransomware.live API
curl -s "https://api.ransomware.live/victims" \
  | jq '.[] | select(.post_title | test("keyword"; "i")) | {
      group: .group_name,
      victim: .post_title,
      date: .discovered
    }'
```

### onionsearch CLI (requires Tor proxy on 127.0.0.1:9050)

```bash
# Install
pip3 install onionsearch

# Basic search across all supported engines
onionsearch "target keyword" --len 10

# Search with specific engines only
onionsearch "target keyword" --engine ahmia --engine torch --len 20

# Output to file
onionsearch "target keyword" --len 50 > darkweb_results.txt
```

**Expected output:**

```
Searching for: target keyword
[*] Ahmia      - Found 7 results
[*] Torch      - Found 12 results
[*] DarkSearch - Found 3 results

Results:
http://examplexxx.onion/page/1 - Title: ...
http://forumyyy.onion/thread/99 - Title: ...
...
```

### OnionScan Attribution Scan

```bash
# Install Go, then:
go install github.com/s-rah/onionscan@latest

# Scan target onion service for OPSEC failures
# Requires Tor proxy running on 127.0.0.1:9050
onionscan --torProxyAddress 127.0.0.1:9050 \
          --depth 2 \
          http://targetservice.onion \
          2>/dev/null | python3 -m json.tool

# Key fields to review in output:
# - "linkedSites"       : clearnet domains referenced
# - "emailAddresses"    : operator contact leaks
# - "bitcoinAddresses"  : wallet addresses for blockchain pivot
# - "pgpKeys"           : PGP fingerprints for identity cross-reference
# - "serverVersion"     : software version (fingerprinting)
```

### Paste Site Dork (Clearnet)

```bash
# Construct Google dork queries for paste site leak monitoring
# Run these in browser — no CLI
echo 'Google dorks for paste site monitoring:'
echo ''
echo 'site:pastebin.com "{organization}" password OR dump OR leak'
echo 'site:pastebin.com "{domain.com}" credentials'
echo 'site:ghostbin.com "{organization}"'
echo 'site:rentry.co "{organization}" dump'
echo '"{organization}" filetype:txt password database dump'
```

---

## 5. Analysis & Interpretation Guidance

### Dark Web Signal Assessment

```
Ransomware claim credibility:
  HIGH:   Organization name matches exactly, sample data published, known active group
  MEDIUM: Name match only, no sample data, smaller/less active group
  LOW:    Partial name match, group has history of false claims (e.g., KelvinSecurity)

Leak freshness indicators:
  - First seen date on ransomwatch vs. organization's known breach date
  - Is the data already publicly circulating? (check BreachDirectory, DeHashed)
  - Countdown timer present: extortion still in negotiation phase

Forum post credibility:
  - Account age: older accounts with post history > newly registered
  - Vouches or trusted vendor badges on marketplace
  - PGP-signed posts: signed content is harder to fabricate
```

### Attribution Techniques

```
Handle cross-referencing:
  - Dark web handle appears on clearnet hacker forums (XSS, Exploit.in)?
  - Same handle registered on GitHub, Twitter, Telegram?
  - Reverse image search avatar/profile photo

PGP key pivoting:
  - Extract PGP key from dark web post: grep -A50 "BEGIN PGP"
  - Query key servers: https://keys.openpgp.org/search?q={fingerprint}
  - Same key on dark web and legitimate identity = deanonymization

Writing style analysis:
  - Language: native speaker patterns, regional slang
  - Timezone signals: post timestamps clustered in specific hours
  - Recurring typos or unusual phrasing → searchable fingerprint
  - Tools: JGAAP (Java Graphical Authorship Attribution Program)

Bitcoin address pivoting:
  - Extract wallet addresses from OnionScan output or page source
  - Query blockchain explorer: https://www.blockchain.com/explorer
  - Cluster addresses via wallet heuristics (common-input ownership)
  - Check exchange deposit addresses for KYC linkage
```

### OPSEC Assessment for Investigators

```
Risk levels by activity:
  LOW RISK (no Tor needed):
    - Ahmia.fi clearnet search
    - ransomwatch API queries
    - DDoSecrets browsing
    - DarknetLive directory browsing

  MEDIUM RISK (use Tor Browser, isolated VM):
    - Visiting .onion marketplaces or forums
    - onionsearch queries routed through Tor
    - Browsing ransomware group leak sites directly

  HIGH RISK (use Tails OS or Whonix, air-gapped preferred):
    - Creating accounts on dark web forums
    - Interacting with threat actors
    - Downloading files from .onion sites
    - OnionScan probing (active enumeration; may alert operators)

Absolute rules:
  - NEVER access .onion sites from personal or corporate networks without Tor
  - NEVER create accounts on dark web forums for investigation purposes
  - NEVER download executables from dark web sources to connected systems
  - NEVER screenshot content that contains your hostname, username, or IP
```

### Evidence Collection Standards

```
For incident response and legal proceedings:
  1. Hash files immediately after capture (SHA-256)
     sha256sum screenshot.png > screenshot.png.sha256

  2. Record metadata: date, time (UTC), URL, tool, investigator ID

  3. Dark web pages disappear rapidly — capture immediately:
     - Full-page screenshot (browser: Ctrl+Shift+S in Firefox)
     - Local wget mirror (for static pages)
     - Video screen capture for dynamic/JS-heavy pages

  4. Chain of custody log format:
     [UTC timestamp] | [URL] | [Tool] | [Investigator] | [File hash]
     2024-03-15T14:22:00Z | http://xxx.onion/post | browser | analyst1 | sha256:abc...
```

---

## 6. Confidence Ratings

| Finding Type              | Confidence | Notes                                                 |
| ------------------------- | ---------- | ----------------------------------------------------- |
| Ransomwatch victim claim  | MEDIUM     | Claim present; data may be fabricated or recycled     |
| DDoSecrets leak dataset   | HIGH       | Published, verifiable data exists                     |
| Ahmia search result       | MEDIUM     | Index may be stale; .onion may be offline             |
| OnionScan linked domain   | HIGH       | Technical evidence of server misconfiguration         |
| Handle cross-reference    | MEDIUM     | Requires corroborating signals                        |
| PGP key identity match    | HIGH       | Cryptographic evidence if key is verified             |
| Bitcoin address cluster   | MEDIUM     | Heuristics-based; not definitive without exchange KYC |
| Writing style attribution | LOW        | Probabilistic; not legally admissible alone           |

---

## 7. Limitations

1. **Tor required for most active investigation** — Clearnet tools (Ahmia, ransomwatch, DDoSecrets) cover initial sweep; deeper work requires Tor Browser or proxy
2. **Ahmia index staleness** — Crawled `.onion` sites may be offline; index lags by days to weeks
3. **AIS spoofing analog** — Dark web operators frequently rotate `.onion` addresses; cached URLs may be dead
4. **ransomwatch false positives** — Some ransomware groups exaggerate or fabricate victim lists for reputational pressure; always verify with organization
5. **Jurisdiction variability** — Accessing certain dark web content (weapons, CSAM, controlled substances) is illegal regardless of investigative intent in many jurisdictions; know your legal authority
6. **OnionScan maintenance** — Repository has not received major updates; some checks may be unreliable against modern `.onion` v3 addresses
7. **Evidence admissibility** — Screenshots of dark web content may face chain-of-custody challenges in legal proceedings; engage legal counsel early

---

## 8. Command Reference

| Command                     | Purpose                             | Input                              |
| --------------------------- | ----------------------------------- | ---------------------------------- |
| `/darknet-search [keyword]` | Search dark web indexes for keyword | Organization name, domain, or term |
| `/ransomware-check [org]`   | Check ransomware victim claims      | Organization name or domain        |
| `/onion-scan [url]`         | Scan .onion service for OPSEC leaks | `.onion` URL                       |

---

_Darknet Investigation Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized investigation and educational purposes only_
