# Tool Cascade Reference

Quick reference for all CLI tools used by Free OSINT Expert modules. Covers installation, invocation, and fallback order per category.

---

## Installation Commands

| Tool                 | Install Command                                                                                          | Language | Category                            |
| -------------------- | -------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| Maigret              | `pip3 install maigret`                                                                                   | Python   | Username                            |
| Sherlock             | `pipx install sherlock-project`                                                                          | Python   | Username                            |
| Blackbird            | `pip3 install blackbird-osint`                                                                           | Python   | Username + AI                       |
| PhoneInfoga          | `go install github.com/sundowndev/phoneinfoga/v2/cmd/phoneinfoga@latest`                                 | Go       | Phone                               |
| Holehe               | `pip3 install holehe`                                                                                    | Python   | Email                               |
| h8mail               | `pip3 install h8mail`                                                                                    | Python   | Email breaches                      |
| theHarvester         | `pip3 install theHarvester`                                                                              | Python   | Email/domain harvest                |
| TruffleHog           | `pip3 install trufflehog`                                                                                | Python   | Secrets                             |
| Gitleaks             | `go install github.com/gitleaks/gitleaks@latest`                                                         | Go       | Secrets                             |
| Subfinder            | `go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest`                               | Go       | Subdomains                          |
| Amass                | `go install github.com/owasp-amass/amass/v4/...@master`                                                  | Go       | Subdomains                          |
| GAU                  | `go install github.com/lc/gau/v2/cmd/gau@latest`                                                         | Go       | URL discovery                       |
| ASN                  | `bash <(curl -sL https://raw.githubusercontent.com/nitefood/asn/master/asn)`                             | Bash     | Network                             |
| Xeuledoc             | `pip3 install xeuledoc`                                                                                  | Python   | Google Doc Intel                    |
| ShareTrace           | `git clone https://github.com/7onez/sharetrace.git && cd sharetrace && pip3 install -r requirements.txt` | Python   | Share Link Analysis                 |
| **Waymore**          | `pip3 install waymore`                                                                                   | Python   | Archive URL Mining                  |
| **cloudscraper**     | `pip3 install cloudscraper`                                                                              | Python   | Anti-bot bypass (USPhoneBook)       |
| **whoisdomain**      | `pip3 install whoisdomain`                                                                               | Python   | Universal WHOIS (IANA auto-detect)  |
| **Scrapling**        | `pip3 install scrapling`                                                                                 | Python   | Adaptive web scraping (static)      |
| **Scrapling (full)** | `pip3 install "scrapling[fetchers]" && scrapling install`                                                | Python   | Anti-bot + JS rendering             |
| **AgentFlow**        | `pip3 install agentflow-py`                                                                              | Python   | Orchestration (parallel enrichment) |

> Last updated: 2026-04-16. Always verify install commands against upstream repos.

---

## Fallback Cascades Per Category

### Username Enumeration

| Priority         | Tool                                    | Sites | Notes                           |
| ---------------- | --------------------------------------- | ----- | ------------------------------- |
| 1 (Primary)      | `maigret <user> --top-sites 500 --json` | 3000+ | Best coverage, produces dossier |
| 2 (Secondary)    | `sherlock <user> --output json`         | 400+  | Cross-verify top hits           |
| 3 (Tertiary)     | `blackbird -u <user>`                   | 600+  | AI profiling layer              |
| 4 (Web fallback) | whatsmyname.app                         | 600+  | Manual browser check            |

### Google Document Intelligence

| Priority         | Tool                           | Method                                                       | Notes                               |
| ---------------- | ------------------------------ | ------------------------------------------------------------ | ----------------------------------- |
| 1 (Primary)      | `xeuledoc <google-doc-url>`    | CLI                                                          | Owner, dates, permissions — no auth |
| 2 (Secondary)    | Manual Drive API query         | `curl "https://clients6.google.com/drive/v2beta/files/<ID>"` | Raw API fallback                    |
| 3 (Web fallback) | Google cache / Wayback Machine | Manual                                                       | Snapshot of document state          |

### Share Link Analysis

| Priority         | Tool                                | Method | Notes                             |
| ---------------- | ----------------------------------- | ------ | --------------------------------- |
| 1 (Primary)      | `python -m sharetrace <url> --json` | CLI    | 11 platforms, identity extraction |
| 2 (Web fallback) | Manual URL inspection + curl        | Manual | Follow redirects, parse response  |

### Phone Investigation

| Priority         | Tool                             | Method                                           | Notes                                   |
| ---------------- | -------------------------------- | ------------------------------------------------ | --------------------------------------- |
| 1 (Primary)      | `phoneinfoga scan -n "<number>"` | CLI                                              | Carrier, type, reputation               |
| 2 (Secondary)    | FreeCNAM                         | `curl "https://freecnam.org/dip?q={number}"`     | Free CallerID, US only, no key          |
| 3 (Tertiary)     | WhoCalld                         | `curl "http://whocalld.com/+1{number}"` + scrape | Phone type, carrier, location           |
| 4 (Quaternary)   | USPhoneBook                      | `cloudscraper → usphonebook.com/{phone}`         | Name, addresses, relatives, emails (US) |
| 5 (Quinary)      | NumVerify API                    | `curl "http://apilayer.net/api/validate?..."`    | Free tier: 100/month                    |
| 6 (Web fallback) | Google dorks                     | `"<number>" site:truecaller.com`                 | Manual search                           |

### WiFi / SSID Geolocation

| Priority         | Tool             | Method                                                                                         | Notes                         |
| ---------------- | ---------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| 1 (Primary)      | Wigle.net API v2 | `curl -H "Authorization: Basic ..." "https://api.wigle.net/api/v2/network/search?ssid=<SSID>"` | Free: 50 queries/day          |
| 2 (BSSID)        | Wigle.net API v2 | `curl ... "https://api.wigle.net/api/v2/network/search?netid=<MAC>"`                           | Exact device match            |
| 3 (Vendor)       | MAC Vendors API  | `curl "https://api.macvendors.com/<OUI>"`                                                      | First 3 octets → manufacturer |
| 4 (Web fallback) | Wigle Web UI     | `https://wigle.net/search`                                                                     | Manual, limited results       |

### Infostealer / Breach Intelligence

| Priority         | Tool                | Method                                                                                    | Notes                          |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| 1 (Primary)      | HudsonRock Cavalier | `curl "https://www.hudsonrock.com/api/json/v2/stats/website-results/email?email=<EMAIL>"` | Free, no key, infostealer data |
| 2 (Domain)       | HudsonRock Cavalier | `curl "https://www.hudsonrock.com/api/json/v2/stats/website-results/urls/<DOMAIN>"`       | Compromised employee URLs      |
| 3 (Tertiary)     | HaveIBeenPwned      | haveibeenpwned.com                                                                        | Traditional breach database    |
| 4 (Web fallback) | h8mail              | `h8mail -t <email>`                                                                       | Breach hunting CLI             |

### Email Account Discovery

| Priority         | Tool                | Method                                                                                    | Notes                   |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| 1 (Primary)      | `holehe <email>`    | CLI                                                                                       | 120+ sites, silent mode |
| 2 (Secondary)    | `h8mail -t <email>` | CLI                                                                                       | Breach hunting          |
| 3 (Tertiary)     | emailrep.io         | `curl emailrep.io/<email>`                                                                | Reputation scoring      |
| 4 (Quaternary)   | HudsonRock          | `curl "https://www.hudsonrock.com/api/json/v2/stats/website-results/email?email=<EMAIL>"` | Infostealer check       |
| 5 (Web fallback) | haveibeenpwned.com  | Manual                                                                                    | Breach confirmation     |

### Subdomain Enumeration

| Priority         | Tool                                                   | Method    | Notes                     |
| ---------------- | ------------------------------------------------------ | --------- | ------------------------- |
| 1 (Primary)      | `subfinder -d <domain> -oJ`                            | CLI       | 45+ passive sources, fast |
| 2 (Secondary)    | `curl -s "https://crt.sh/?q=%25.<domain>&output=json"` | API       | CT log query              |
| 3 (Tertiary)     | `amass enum -passive -d <domain>`                      | CLI       | 87 sources, thorough      |
| 4 (Web fallback) | `site:securitytrails.com "<domain>"`                   | WebSearch | No install needed         |

### Secret / Credential Scanning

| Priority         | Tool                                                 | Method    | Notes                    |
| ---------------- | ---------------------------------------------------- | --------- | ------------------------ |
| 1 (Primary)      | `trufflehog github --repo=<url> --json`              | CLI       | Git history entropy scan |
| 2 (Secondary)    | `gitleaks detect --source <path> --verbose`          | CLI       | Local repo scan          |
| 3 (Web fallback) | Google dork: `site:github.com "<domain>" "password"` | WebSearch | No install needed        |

### Threat Intelligence (IP/Domain/URL/Hash)

| Priority         | Tool           | Method                                                                               | Notes                   |
| ---------------- | -------------- | ------------------------------------------------------------------------------------ | ----------------------- |
| 1 (Primary)      | AbuseIPDB      | `curl -G "https://api.abuseipdb.com/api/v2/check" -d ipAddress=<IP> -H "Key: <key>"` | Free tier: 1000 req/day |
| 2 (Secondary)    | GreyNoise      | `curl "https://api.greynoise.io/v3/community/<IP>"`                                  | Free community API      |
| 3 (Tertiary)     | OTX AlienVault | `curl "https://otx.alienvault.com/api/v1/indicators/IPv4/<IP>/general"`              | No key needed for basic |
| 4 (Web fallback) | VirusTotal     | `https://www.virustotal.com/gui/ip-address/<IP>`                                     | Manual browser          |

---

### Archive URL Mining

| Priority     | Tool                                       | Sources                                                                   | Notes                                |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------ |
| 1 (Primary)  | `waymore -i <domain> -mode U -oU urls.txt` | Wayback + Common Crawl + OTX + URLScan + VT + GhostArchive + IntelX       | 7 sources, downloads response bodies |
| 2 (Fallback) | `echo <domain> \| gau --subs --threads 5`  | Wayback + OTX + Common Crawl + URLScan                                    | 4 sources, URL listing only          |
| 3 (Manual)   | Wayback CDX API                            | `curl "http://web.archive.org/cdx/search/cdx?url=*.<domain>&output=text"` | Single source, no install            |

### Threat Intelligence (Vulnerability / CVE)

| Priority         | Tool             | Method                                                                   | Notes                    |
| ---------------- | ---------------- | ------------------------------------------------------------------------ | ------------------------ |
| 1 (Primary)      | CIRCL CVE Search | `curl "https://cve.circl.lu/api/cve/<CVE-ID>"`                           | Free, no auth, unlimited |
| 2 (Secondary)    | NVD API v2       | `curl "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=<CVE-ID>"` | 5 req/30s without key    |
| 3 (Web fallback) | NVD Web UI       | `https://nvd.nist.gov/vuln/detail/<CVE-ID>`                              | No install, manual       |

### Ransomware Victim Lookup

| Priority         | Tool                   | Method                                                   | Notes         |
| ---------------- | ---------------------- | -------------------------------------------------------- | ------------- |
| 1 (Primary)      | Ransomware.live API    | `curl "https://api.ransomware.live/victims"` + jq filter | Free, no auth |
| 2 (Web fallback) | ransomware.live Web UI | `https://www.ransomware.live`                            | Manual search |

### Domain/URL Scanning

| Priority         | Tool              | Method                                                       | Notes                   |
| ---------------- | ----------------- | ------------------------------------------------------------ | ----------------------- |
| 1 (Primary)      | URLScan.io Search | `curl "https://urlscan.io/api/v1/search/?q=domain:<domain>"` | Free, no key for search |
| 2 (Secondary)    | URLScan.io Scan   | `POST https://urlscan.io/api/v1/scan/`                       | Free key: 100 scans/day |
| 3 (Web fallback) | urlscan.io Web UI | `https://urlscan.io/search/#domain:<domain>`                 | Manual                  |

### Breach / Leak Detection

| Priority         | Tool                 | Method                                                 | Notes                          |
| ---------------- | -------------------- | ------------------------------------------------------ | ------------------------------ |
| 1 (Primary)      | HaveIBeenPwned       | `haveibeenpwned.com`                                   | Free tier; API key for bulk    |
| 2 (Secondary)    | LeakCheck Public API | `curl "https://leakcheck.io/api/public?check=<email>"` | Free, rate-limited             |
| 3 (Tertiary)     | HudsonRock Cavalier  | `curl "https://www.hudsonrock.com/api/json/v2/..."`    | Free, no key, infostealer data |
| 4 (CLI)          | h8mail               | `h8mail -t <email>`                                    | CLI breach hunting             |
| 5 (Web fallback) | Pastebin dorks       | `site:pastebin.com "<email>"`                          | Manual                         |

---

### Image Forensics / Face Search

| Priority      | Tool          | Method                                      | Notes                                      |
| ------------- | ------------- | ------------------------------------------- | ------------------------------------------ |
| 1 (Primary)   | FaceCheck.id  | `https://facecheck.id/` — upload face image | Best free face search engine               |
| 2 (Secondary) | TinEye        | `https://tineye.com/` — upload or paste URL | Reverse image search, find oldest instance |
| 3 (Tertiary)  | FotoForensics | `https://fotoforensics.com/` — upload image | ELA manipulation detection                 |
| 4 (Tertiary)  | Forensically  | `https://29a.ch/photo-forensics/`           | Clone detection, noise analysis            |
| 5 (Geo)       | picarta.ai    | `https://www.picarta.ai/` — upload photo    | AI photo geolocation                       |
| 6 (Geo)       | GeoSpy        | `https://geospy.web.app/` — upload photo    | AI location prediction                     |
| 7 (EXIF)      | Pic2Map       | `https://www.pic2map.com/` — upload photo   | GPS extraction + map                       |

### Blockchain / Crypto Investigation

| Priority   | Tool           | Method                                                                   | Notes                             |
| ---------- | -------------- | ------------------------------------------------------------------------ | --------------------------------- |
| 1 (BTC)    | Blockchair     | `curl -s "https://api.blockchair.com/bitcoin/dashboards/address/<ADDR>"` | Multi-chain, SQL-like queries     |
| 2 (ETH)    | Etherscan      | `https://etherscan.io/address/<ADDR>`                                    | Standard Ethereum explorer        |
| 3 (BTC)    | WalletExplorer | `https://www.walletexplorer.com/address/<ADDR>`                          | Wallet clustering + entity labels |
| 4 (Visual) | OXT.me         | `https://oxt.me/`                                                        | Bitcoin transaction graph         |
| 5 (Scam)   | Chainabuse     | `https://www.chainabuse.com/address/<ADDR>`                              | Scam/fraud address reports        |
| 6 (Multi)  | Breadcrumbs    | `https://www.breadcrumbs.app/`                                           | Visual multi-chain investigation  |

### Dork Generation

| Priority   | Tool       | Method                                                     | Notes                            |
| ---------- | ---------- | ---------------------------------------------------------- | -------------------------------- |
| 1 (Web)    | DorkSearch | `https://dorksearch.com/`                                  | Pre-built dork queries for OSINT |
| 2 (GitHub) | GitDorker  | `python3 GitDorker.py -t <token> -d dorks.txt -q <target>` | Automated GitHub secret dorking  |

### Unified / Meta OSINT Tools

| Priority        | Tool      | Method                                 | Notes                                   |
| --------------- | --------- | -------------------------------------- | --------------------------------------- |
| 1 (Email/Phone) | Epieos    | `https://epieos.com/`                  | Multi-source email+phone reverse lookup |
| 2 (Multi)       | SynapsInt | `https://synapsint.com/`               | Aggregated multi-source OSINT search    |
| 3 (Domain)      | web-check | `https://github.com/Lissy93/web-check` | All-in-one website analysis             |

### WHOIS / Domain Registration

| Priority       | Tool          | Method                                                                  | Notes                       |
| -------------- | ------------- | ----------------------------------------------------------------------- | --------------------------- |
| 1 (Primary)    | whoisdomain   | `python3 -c "import whoisdomain; print(whoisdomain.query('<domain>'))"` | IANA auto-detect, ~90% TLDs |
| 2 (Secondary)  | CLI whois     | `whois -h <tld-server> <domain>`                                        | Direct ccTLD server query   |
| 3 (Tertiary)   | Whoxy API     | `curl "https://api.whoxy.com/?key=free&whois=<domain>"`                 | 1595+ TLDs, free            |
| 4 (Quaternary) | who.is web    | `who.is/whois/<domain>`                                                 | Web UI, manual or scrape    |
| 5 (Reverse)    | Whoxy reverse | `curl "https://api.whoxy.com/?key=free&reverse=whois&email=<email>"`    | Free reverse WHOIS          |

### Web Collection / Page Fetching

| Priority        | Tool                               | Method                                                            | Notes                                   |
| --------------- | ---------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| 1 (Screenshots) | agent-browser or ck:chrome-profile | Browser automation; use chrome-profile only for real user cookies | Interactive, visual evidence            |
| 2 (JS-heavy)    | Scrapling DynamicFetcher           | `DynamicFetcher.get(url)`                                         | Playwright-backed, JS rendering         |
| 3 (Anti-bot)    | Scrapling StealthyFetcher          | `StealthyFetcher.get(url)`                                        | Cloudflare bypass, fingerprint spoofing |
| 4 (Fast static) | Scrapling Fetcher                  | `Fetcher.get(url)`                                                | ~2ms parse, adaptive selectors          |
| 5 (CLI)         | WebFetch                           | Claude tool                                                       | Built-in, no deps                       |
| 6 (Search)      | WebSearch                          | Claude tool                                                       | Google results only                     |
| 7 (Raw)         | curl                               | `curl -sL url`                                                    | Last resort                             |

---

## Free API Key Registry

| Service             | Registration URL                                   | Free Tier                               |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| AbuseIPDB           | https://www.abuseipdb.com/register                 | 1,000 checks/day                        |
| GreyNoise Community | https://viz.greynoise.io/signup                    | Community API, no key needed            |
| OTX AlienVault      | https://otx.alienvault.com                         | Unlimited public indicators             |
| emailrep.io         | https://emailrep.io/key                            | 1,000 req/day                           |
| NumVerify           | https://numverify.com/signup                       | 100 req/month                           |
| VirusTotal          | https://www.virustotal.com/gui/join-us             | 500 lookups/day                         |
| URLScan.io          | https://urlscan.io/user/signup                     | 100 private scans/day, unlimited search |
| NVD API             | https://nvd.nist.gov/developers/request-an-api-key | 50 req/30s (vs 5 without key)           |
| LeakCheck           | https://leakcheck.io                               | Public API free, rate-limited           |
| Wigle.net           | https://wigle.net/account                          | 50 queries/day                          |
| FreeCNAM            | https://freecnam.org                               | Free, no key needed (US only)           |
