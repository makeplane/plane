# Recon Vectors Playbook

This file contains detailed search playbooks for each target type. When running `/scan`, identify the target type and follow the appropriate playbook below.

---

## Table of Contents

1. Domain Recon
2. Person Recon
3. Email Recon
4. Username Recon
5. IP Address Recon
6. Organization Recon
7. Phone Number Recon

---

## 1. Domain Recon

**Goal:** Map the domain's infrastructure, ownership, history, and associated entities.

### Search Sequence

**Ownership & Registration (WHOIS — use fallback cascade):**

Use this ordered fallback cascade. Move to the next method only if the previous one fails or is unavailable:

1. **CLI first (fastest):** Run `whois example.com` via Bash. This returns structured WHOIS data in <2 seconds with no rendering overhead. Parse the output for registrant, dates, nameservers.
2. **WebSearch second:** Search `"example.com" whois registration` — search engines often surface WHOIS summary snippets directly in results without needing to fetch a full page.
3. **Lightweight API endpoints third:** Use WebFetch on JSON/text endpoints that return fast:
   - `https://rdap.verisign.com/com/v1/domain/example.com` (RDAP — structured JSON, fast)
   - `https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=example.com&outputFormat=json` (may require API key)
4. **Heavy WHOIS web UIs last resort:** Only if all above fail, try WebFetch on `who.is/whois/example.com` or `whois.domaintools.com`. These are JavaScript-heavy pages that are slow and often blocked — never use them as a first choice.

- Look for: Registrant name, organization, email, registration date, expiry, name servers
- Pivot on: Registrant email (often reveals other domains), registrant name
- **Important:** If WHOIS privacy is enabled (common), note this as a finding and pivot to other ownership indicators (SSL cert org, about pages, GitHub repos).

**DNS & Infrastructure (use CLI when available):**

Use this ordered fallback cascade:

1. **CLI first:** Run `dig example.com ANY +short` or individual queries (`dig A`, `dig MX`, `dig TXT`, `dig NS`) via Bash. Returns results in milliseconds.
2. **WebSearch second:** Search `"example.com" DNS records` or `site:securitytrails.com "example.com"`
3. **WebFetch third:** Fetch `https://dns.google/resolve?name=example.com&type=A` (Google DNS-over-HTTPS, returns JSON).

- Look for: A records (IP addresses), MX records (email provider), NS records, TXT records (SPF, DKIM)
- Pivot on: IP addresses (what else is hosted there?), email provider choice

**Microsoft 365 / Azure Tenant Recon (load `techniques/microsoft-tenant-recon.md`):**

Auto-fires when MX record ends in `protection.outlook.com` OR SPF includes `spf.protection.outlook.com`.

1. `msftrecon -d example.com -j` — full tenant enumeration (JSON output)
2. Fallback — direct curl:
   - `curl -s "https://login.microsoftonline.com/getuserrealm.srf?login=user@example.com&json=1"` — federation type
   - `curl -s "https://login.microsoftonline.com/example.com/v2.0/.well-known/openid-configuration"` — tenant ID from `issuer` field
3. SharePoint existence: `curl -I "https://{tenant}.sharepoint.com"` — 401/403 = present, 404 = not present
4. Azure App Service tenant: `curl -I "https://{tenant}.azurewebsites.net"` — same 401/403/404 logic
5. Gov cloud variant: `msftrecon -d domain.gov --gov`
6. China cloud variant: `msftrecon -d domain.cn --cn`

- Look for: Tenant ID (GUID), federation type (Managed/Federated), brand name, MDI instance, Azure services exposure
- Pivot on: Tenant ID (unique Azure identifier — query for other domains under same tenant), federation type (Federated = SSO provider present → potential SAML attack surface)

**Technology Stack:**

- Search: `site:builtwith.com "example.com"` or `"example.com" technology stack`
- Look for: CMS, frameworks, analytics tools, CDN, hosting provider
- Pivot on: Unusual technologies (might indicate the developer's preferences)

**Historical Snapshots:**

- Search: `site:web.archive.org "example.com"` or `"example.com" wayback machine`
- Look for: How the site has changed over time, old team pages, removed content
- Pivot on: Names that appeared on old versions but were removed

**Subdomains & Related Domains:**

- Search: `site:*.example.com` or `"example.com" subdomain enumeration`
- Search: `"example" site:crt.sh` (certificate transparency logs)
- Look for: dev/staging subdomains, internal tools, forgotten services

**Advanced Subdomain Enumeration (load `modules/domain-advanced.md`):**

CLI-first cascade:

1. `subfinder -d example.com -oJ` — 45+ passive sources, fast
2. `curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq '.[].name_value' | sort -u` — CT log query
3. `amass enum -passive -d example.com -json output.json` — 87 sources, slower but thorough
4. WebSearch fallback: `site:securitytrails.com "example.com" subdomains`

**Content & Exposure:**

- Search: `site:example.com filetype:pdf OR filetype:doc OR filetype:xls`
- Search: `site:example.com inurl:admin OR inurl:login OR inurl:config`
- Search: `"example.com" site:github.com` (code repos referencing the domain)
- Search: `"example.com" site:pastebin.com OR site:paste.org`
- Look for: Exposed documents, admin panels, credentials in code repos
<!-- dork-integration:phase-05 start -->
- Run: `/dork-sweep example.com --filetype --clean` — full filetype sweep (pdf/doc/xls/ppt/csv/xml) with noise reduction
- Run: `/docleak example.com` — 18-platform document leak hunt (scribd/issuu/slideshare/etc.) with severity tiers
- Details: [`../techniques/fx-dork-sweep.md`](../techniques/fx-dork-sweep.md), [`../techniques/fx-document-leak-hunt.md`](../techniques/fx-document-leak-hunt.md)
<!-- dork-integration:phase-05 end -->

**Secret Scanning (load `modules/secret-scanning.md`):**

- Search: `org:example "password" OR "secret" OR "api_key"` on GitHub
- Search: `org:example filename:.env OR filename:credentials.json`
- Search: `org:example "AKIA" OR "sk_live_" OR "ghp_"` (cloud/service key patterns)
- If repos found, clone and scan with: `gitleaks detect --source /path/to/repo --verbose`
- For deeper analysis: `trufflehog github --org=example --json` (scans entire org)
- For S3 bucket secrets: `trufflehog s3 --bucket=example-bucket --json`
- Look for: Hardcoded credentials, API keys, connection strings, private keys in git history
- Pivot on: Discovered credentials reveal services used, internal infrastructure, cloud providers

**Cloud Storage Exposure:**

- Search: `site:buckets.grayhatwarfare.com "example"` (indexed open buckets)
- Run: `s3scanner scan --bucket example-name` or `cloud_enum -k example`
- Search: `"example" site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com`
- Look for: Open S3 buckets, Azure blobs, GCS buckets with directory listing enabled

**Breach & Leak Exposure — Domain (free APIs — no key required):**

1. HudsonRock domain check: `curl -s "https://www.hudsonrock.com/api/json/v2/stats/website-results/urls/example.com"` — employee/client URLs in infostealer logs; `totalUrls > 0` = stolen credentials
2. LeakCheck domain check: `curl -s "https://leakcheck.io/api/public?check=example.com"` — breach entries mentioning the domain
3. Search: `"@example.com" site:pastebin.com` — email dumps referencing the domain

**Threat Intelligence — Domain (free APIs — no key required):**

1. URLScan.io passive: `curl -s "https://urlscan.io/api/v1/search/?q=domain:example.com&size=10"` — historical scan records, page screenshots, security verdicts
2. URLhaus malware check: `curl -s -X POST "https://urlhaus-api.abuse.ch/v1/host/" -d "host=example.com"` — malware URL hosting records
3. ThreatFox IOC: `curl -s -X POST "https://threatfox-api.abuse.ch/api/v1/" -H "Content-Type: application/json" -d '{"query":"search_ioc","search_term":"example.com"}'` — C2/malware IOC matches
4. DMARC check: `dig TXT _dmarc.example.com` — email spoofing protection posture
5. SPF check: `dig TXT example.com | grep spf` — sender policy framework
6. DKIM check: `dig TXT default._domainkey.example.com` — signing key presence

**Reputation & Mentions:**

- Search: `"example.com" -site:example.com` (what others say about it)
- Search: `"example.com" site:reddit.com`
- Search: `"example.com" review OR scam OR complaint`

---

## 2. Person Recon

**Goal:** Build a profile of the person's digital footprint, professional history, and public activity.

### Search Sequence

**Identity Basics:**

- Search: `"Full Name"` (in quotes for exact match)
- Search: `"Full Name" city OR location` (narrow by geography if known)
- Search: `"Full Name" site:linkedin.com`
- Look for: Professional title, employer, location, education
- Pivot on: Employer name, university, any usernames visible in profiles

**Professional Presence:**

- Search: `"Full Name" site:linkedin.com OR site:crunchbase.com`
- Search: `"Full Name" speaker OR conference OR presentation`
- Search: `"Full Name" author OR published OR paper`
- Search: `"Full Name" patent site:patents.google.com`
- Look for: Professional history, expertise areas, public speaking, publications

**Social Media:**

- Search: `"Full Name" site:twitter.com OR site:x.com`
- Search: `"Full Name" site:facebook.com`
- Search: `"Full Name" site:instagram.com`
- Search: `"Full Name" site:reddit.com`
- Search: `"Full Name" site:medium.com OR site:substack.com`
- Pivot on: Any usernames found (run username recon on each)

**Public Records (US-focused, adapt for other jurisdictions):**

- Search: `"Full Name" site:courtlistener.com` (court records)
- Search: `"Full Name" site:opencorporates.com` (corporate filings)
- Search: `"Full Name" site:sec.gov` (SEC filings, for executives)
- Search: `"Full Name" property records [county/state]`
- Note: Always clarify that public records may match other people with the same name

**Documents & Media:**

- Search: `"Full Name" filetype:pdf`
- Search: `"Full Name" site:youtube.com` (videos, interviews)
- Search: `"Full Name" site:slideshare.net OR site:speakerdeck.com`
<!-- dork-integration:phase-05 start -->
- Run: `/docleak "Full Name"` — cross-platform document sweep (18 doc-hosts)
- Run: `/dork-sweep "Full Name" --telegram` — Telegram ecosystem presence (t.me, tgstat, telemetr, etc.)
- Use `/docleak` on persons only with investigative authorization (journalism, HR, PI, cyber).
<!-- dork-integration:phase-05 end -->

**Breach & Leak Exposure — Person (free APIs — no key required):**

- For each email address found: run LeakCheck + HudsonRock email lookup (see Email Recon section)
- Search: `"Full Name" leak OR breach OR exposed`

---

## 3. Email Recon

**Goal:** Determine what accounts, services, and data are associated with an email address.

### Search Sequence

**Direct Presence:**

- Search: `"email@example.com"` (exact match — where does this email appear publicly?)
- Look for: Forum posts, mailing list archives, data breach mentions, code commits
<!-- dork-integration:phase-05 start -->
- Run: `/dork-sweep "email@example.com" --telegram --docs` — Telegram ecosystem + 18-platform doc-host sweep on the address
<!-- dork-integration:phase-05 end -->

**Associated Accounts:**

- Search: `"email@example.com" site:github.com`
- Search: `"email@example.com" site:gravatar.com` (profile photo link)
- Search: `"email@example.com" site:keybase.io` (crypto identity)
- Pivot on: Any usernames, real names, or profile photos found

**Domain Analysis (if custom domain):**

- If the email uses a custom domain (not gmail/outlook/yahoo), run Domain Recon on that domain
- Search: `site:example.com` to understand the organization

**Email Validation & Reputation (free APIs — no key required):**

1. Disposable check: `curl -s "https://open.kickbox.com/v1/disposable/email@example.com"` — `{"disposable":true}` flags throwaway accounts (low trust, short-lived)
2. MX record check: `dig MX example.com` — validates domain can receive email; absence = spoofed/invalid domain
3. DMARC posture: `dig TXT _dmarc.example.com` — reveals if domain enforces anti-spoofing

**Breach & Leak Exposure (free APIs — no key required):**

1. LeakCheck public API: `curl -s "https://leakcheck.io/api/public?check=email@example.com"` — breach count, exposed fields (password, SSN, DOB, phone), source list
2. HudsonRock Cavalier: `curl -s "https://www.hudsonrock.com/api/json/v2/stats/website-results/email?email=email@example.com"` — infostealer log hit; returns machine name, date compromised, services count → CRITICAL if found
3. Search: `"email@example.com" site:pastebin.com OR site:paste.org` — paste site exposure

- If disposable: mark subject credibility LOW, flag account as likely throwaway
- If LeakCheck `found > 0`: document each source name, date, and exposed fields
- If HudsonRock returns data: mark finding CRITICAL (live infostealer = active credential theft risk)

**Mailing Lists & Forums:**

- Search: `"email@example.com" site:groups.google.com`
- Search: `"email@example.com" site:lists.apache.org OR site:sourceforge.net`
- Search: `"email@example.com" forum OR community`

**Deep Email Investigation (load `modules/email-osint.md`):**

1. `holehe <email>` — check 120+ site registrations (silent, no alerts sent to target)
2. `h8mail -t <email>` — breach hunting across multiple databases
3. `curl emailrep.io/<email>` — reputation scoring (spam history, domain age, malicious flags)
4. If Gmail detected: note GHunt availability for Google account deep-dive

- Pivot on: Site registrations reveal platforms to investigate further; breach data reveals password patterns

---

## 4. Username Recon

**Goal:** Find all platforms where a username is registered and build a profile from aggregate activity.

### Search Sequence

**Cross-Platform Search:**

- Search: `"username" site:twitter.com OR site:x.com`
- Search: `"username" site:reddit.com`
- Search: `"username" site:github.com`
- Search: `"username" site:instagram.com`
- Search: `"username" site:youtube.com`
- Search: `"username" site:tiktok.com`
- Search: `"username" site:linkedin.com`
- Search: `"username" site:medium.com`
- Search: `"username" site:hackernews.com OR site:news.ycombinator.com`
- Search: `"username" site:keybase.io`
- Search: `"username" site:mastodon.social OR site:fosstodon.org`

**Username Lookup Services (via search):**

- Search: `"username" namechk OR namecheck OR social media check`
- Direct user to: namechk.com, whatsmyname.app (suggest manual checking)

**Extended Username Enumeration (load `modules/username-osint.md`):**

CLI-first cascade:

1. `maigret <username> --top-sites 500 --json` — 3000+ sites, auto-generates dossier
2. `sherlock <username> --output json` — 400+ sites, cross-verify top results
3. `blackbird -u <username>` — 600+ sites with AI profiling layer
4. Web fallback: whatsmyname.app

- Parse results: filter "Claimed" accounts, discard connection errors
- For top 10 confirmed accounts: extract bio, creation date, follower count
- Group findings by category: social, dev, forum, dating, professional

**Content Analysis:**

- For each platform where the username is found, search for recent activity
- Look for: Bio text (often reveals real name, location, interests), posting patterns, shared links
- Cross-reference: Does the bio on Platform A mention Platform B?

**Breach & Leak Exposure — Username (free APIs — no key required):**

1. LeakCheck username check: `curl -s "https://leakcheck.io/api/public?check=username"` — breach entries for this username (password, IP, DOB, phone)
2. Search: `"username" site:pastebin.com` — paste site exposure

**Pivot Extraction:**

- Real names mentioned in bios
- Emails visible in profiles
- Linked websites or other social accounts
- Location information

---

## 5. IP Address Recon

**Goal:** Determine ownership, geolocation, associated services, and reputation of an IP address.

### Search Sequence

**Geolocation & Ownership:**

- Search: `"IP_ADDRESS" geolocation OR location`
- Search: `"IP_ADDRESS" site:ipinfo.io OR site:shodan.io OR site:censys.io`
- Look for: ISP, ASN, approximate location, organization

**Hosted Services:**

- Search: `"IP_ADDRESS" site:shodan.io` (open ports, services)
- Search: `"IP_ADDRESS" hostname OR reverse DNS`
- Look for: Web servers, mail servers, open services

**Reputation:**

- Search: `"IP_ADDRESS" blacklist OR spam OR malicious OR abuse`
- Search: `"IP_ADDRESS" site:abuseipdb.com`
- Look for: Abuse reports, blacklist presence, threat intelligence mentions

**Associated Domains:**

- Search: `"IP_ADDRESS" site:securitytrails.com` (reverse IP lookup)
- Look for: All domains pointing to this IP (shared hosting reveals associations)

**Threat Intelligence Check (load `modules/threat-intel.md`):**

1. `curl -G "https://api.abuseipdb.com/api/v2/check" -d ipAddress=<IP> -H "Key: <free_key>"` — abuse confidence score + report history
2. `curl "https://api.greynoise.io/v3/community/<IP>"` — noise classification (scanner/benign/malicious)
3. `curl "https://otx.alienvault.com/api/v1/indicators/IPv4/<IP>/general"` — OTX pulse data, malware associations

- If any source returns HIGH confidence malicious: escalate to `/threat-check` for full analysis
- Pivot on: Associated malware families, attack campaigns, C2 infrastructure

**Threat Intelligence — IP (free APIs — no key required):**

1. Shodan InternetDB: `curl -s "https://internetdb.shodan.io/1.2.3.4"` — open ports, CPEs, hostnames, tags (tor/proxy/self-signed), known vulns — **no key, instant**
2. GreyNoise Community: `curl -s "https://api.greynoise.io/v3/community/1.2.3.4"` — noise/scanner/malicious classification
3. ipwho.is geo: `curl -s "https://ipwho.is/1.2.3.4"` — country, ASN, ISP, org, lat/lon
4. URLhaus: `curl -s -X POST "https://urlhaus-api.abuse.ch/v1/host/" -d "host=1.2.3.4"` — malware URL hosting
5. ThreatFox IOC: `curl -s -X POST "https://threatfox-api.abuse.ch/api/v1/" -H "Content-Type: application/json" -d '{"query":"search_ioc","search_term":"1.2.3.4"}'` — C2/IOC matches

**Breach & Leak Exposure — IP (free APIs — no key required):**

1. LeakCheck IP check: `curl -s "https://leakcheck.io/api/public?check=1.2.3.4"` — breach records containing this IP
2. Search: `"1.2.3.4" site:pastebin.com` — paste dumps referencing the IP

---

## 6. Organization Recon

**Goal:** Map the organization's structure, key personnel, digital assets, and public posture.

### Search Sequence

**Corporate Basics:**

- Search: `"OrgName" site:opencorporates.com OR site:dnb.com`
- Search: `"OrgName" incorporation OR registered OR founded`
- Look for: Registration date, jurisdiction, officers, registered agent

**Leadership & Personnel:**

- Search: `"OrgName" CEO OR founder OR director`
- Search: `"OrgName" site:linkedin.com` (employees)
- Search: `"OrgName" team OR about page`
- Pivot on: Key personnel names (run Person Recon)

**Financial & Legal:**

- Search: `"OrgName" site:sec.gov` (public company filings)
- Search: `"OrgName" funding OR investment site:crunchbase.com OR site:pitchbook.com`
- Search: `"OrgName" lawsuit OR litigation OR court`
- Search: `"OrgName" site:courtlistener.com`

**Digital Assets:**

- Identify primary domain → run Domain Recon
- Search: `"OrgName" site:github.com` (open source presence)
- Search: `"OrgName" app site:play.google.com OR site:apps.apple.com`
<!-- dork-integration:phase-05 start -->
- Run: `/docleak "OrgName"` — corp leak sweep across 18 doc-host platforms with severity classification
- Run: `/dork-sweep primary-domain.com --filetype --docs` — filetype + doc-host sweep on org's primary domain
- Run: `/dork-sweep "OrgName" --telegram` — Telegram ecosystem presence (channels, bots, groups)
<!-- dork-integration:phase-05 end -->

**Microsoft 365 / Azure Tenant Intel:**

- If org owns M365-backed domain, run `/msftrecon` on primary domain
- Tenant ID can correlate multiple domains to same organization (reverse mapping)
- See: `techniques/microsoft-tenant-recon.md`

**Reputation & News:**

- Search: `"OrgName" news` (recent coverage)
- Search: `"OrgName" site:glassdoor.com` (employee sentiment)
- Search: `"OrgName" site:bbb.org` (BBB profile)
- Search: `"OrgName" review OR complaint OR scam`

---

## 7. Phone Number Recon

**Goal:** Identify the owner and associated accounts for a phone number.

### Search Sequence

**Direct Search:**

- Search: `"phone_number"` (with country code, various formats: +1-555-123-4567, 5551234567, (555) 123-4567)
- Look for: Business listings, social media profiles, public records, ads

**Carrier & Type:**

- Search: `"phone_number" carrier lookup`
- Look for: Is it a landline, mobile, or VoIP number?

**Associated Profiles:**

- Search: `"phone_number" site:facebook.com`
- Search: `"phone_number" site:whatsapp.com OR site:telegram.org`
- Direct user to: Manual Telegram/WhatsApp lookups (add number to contacts to see profile)

**Spam/Scam Check:**

- Search: `"phone_number" spam OR scam OR robocall`
- Search: `"phone_number" site:whocalled.us OR site:800notes.com`

**Extended Phone Investigation (load `modules/phone-osint.md`):**

1. `phoneinfoga scan -n "<number>"` — carrier, line type, location, reputation scoring
2. FreeCNAM (US): `curl "https://freecnam.org/dip?q={number}"` — free CallerID lookup, no key
3. WhoCalld: `curl "http://whocalld.com/+1{number}"` — phone type, carrier, location scraping
4. USPhoneBook (US): `cloudscraper → usphonebook.com/{phone}` — reverse lookup: name, addresses, relatives, emails
5. NumVerify API: `curl "http://apilayer.net/api/validate?access_key=FREE_KEY&number=<number>"` — structured carrier data
6. Google dorks: `"<number>" site:truecaller.com OR site:whocalledme.com` — user-reported identity

- Pivot on: Carrier reveals geography; VoIP flags anonymization; truecaller results may expose registered name; USPhoneBook relatives/emails enable further pivot chaining

---

## 8. WiFi / SSID Recon

**Goal:** Geolocate wireless networks and correlate with physical locations.

### Search Sequence

**SSID Lookup:**

- Query Wigle.net API: `curl -H "Authorization: Basic ..." "https://api.wigle.net/api/v2/network/search?ssid=<SSID>"`
- Look for: GPS coordinates, encryption, channel, first/last seen dates

**BSSID Lookup (exact device):**

- Query: `curl -H "Authorization: Basic ..." "https://api.wigle.net/api/v2/network/search?netid=<MAC>"`
- More precise than SSID (MAC is unique per device)

**Vendor Identification:**

- OUI lookup: `curl "https://api.macvendors.com/<first-3-octets>"` — reveals manufacturer

**Analysis:**

- SSID naming patterns reveal identity (e.g., "John's iPhone", "ACME-Corp-5G")
- Same SSID at multiple distant locations = mobile hotspot → travel pattern
- Encryption type reveals security posture (WPA3 vs Open)
- First/last seen timestamps reveal operational period

**Web Fallback:**

- Manual: `https://wigle.net/search`
- Google dork: `"<SSID>" site:wigle.net`

---

## 9. Vehicle / License Plate Recon

**Goal:** Identify vehicle ownership, history, and specifications from VIN or plate number.

### Search Sequence

**VIN Decoding:**

- VIN Decoder: `http://www.vindecoderz.com/EN/check-lookup/<VIN>` — make, model, year, engine, plant
- NICB VINCheck: `https://www.nicb.org/vincheck` — free theft/salvage status check (official)
- FAXVIN: `https://www.faxvin.com/` — free vehicle history reports

**Theft / Salvage Check:**

- Search: `"<VIN>" stolen OR salvage OR flood`
- NICB VINCheck (free, no auth): enter VIN → check reported stolen or salvage-titled

**License Plate (limited to specific jurisdictions):**

- Search: `"<plate_number>" site:vehicleinfo.in OR site:carinfo.app` (India)
- Plate Recognizer API: `https://platerecognizer.com/` (image-based plate OCR)

**Pivot on:** VIN reveals manufacturer, model year, assembly plant. Cross-ref with insurance databases. Theft status informs fraud investigations.

---

## 10. People Search Recon (US-focused)

**Goal:** Find contact info, addresses, relatives, and public records for a person.

### Search Sequence

**People Search Engines (free, US):**

- TruePeopleSearch: `https://www.truepeoplesearch.com/` — name, phone, address, relatives, associates
- FastPeopleSearch: `https://fastpeoplesearch.com/` — similar data, different sources
- IDCrawl: `https://www.idcrawl.com/` — combined people + username search
- That's Them: `https://thatsthem.com/` — search by name, email, phone, IP, or address

**Search by name:** Enter full name + state/city → get addresses, phone numbers, relatives, associates
**Search by phone:** Enter phone number → get name, address, email associations
**Search by address:** Enter address → get current/previous residents

**Important:** These are US-focused. Results may match multiple people with the same name — always cross-reference with other OSINT data before confirming identity.

**Pivot on:** Relatives → expand investigation. Previous addresses → trace movement. Email/phone → feed to `/email-deep` or `/phone`.

---

## 11. IoT / Webcam Recon

**Goal:** Find publicly accessible webcams and IoT devices for situational awareness or location confirmation.

### Search Sequence

**Webcam Directories:**

- Insecam: `http://www.insecam.org/` — directory of publicly accessible webcams worldwide, searchable by country/city
- EarthCam: `https://www.earthcam.com/` — curated live webcams at landmarks and cities

**IoT Search:**

- Thingful: `http://www.thingful.net/` — geographic index of connected IoT devices (weather stations, air quality, energy)
- Shodan: `https://www.shodan.io/` — search for specific IoT device types by banner/port

**Google Dorks for Webcams:**

```
intitle:"Live View / - AXIS" (Axis cameras)
inurl:"/view/index.shtml" (generic IP cameras)
intitle:"webcamXP 5" (webcamXP software)
```

**Use cases:** Verify events at a location, confirm weather/time/lighting in photos, monitor areas of interest during incidents.

---

## 12. Flight / Maritime Recon

**Goal:** Track aircraft and vessel movements for investigations.

### Search Sequence

**Aircraft:**

- ADS-B Exchange: `https://globe.adsbexchange.com/` — unfiltered (shows military/government)
- Flightradar24: `https://www.flightradar24.com/` — popular, good UI, some censorship
- FAA Registry: `https://registry.faa.gov/AircraftInquiry/` — US aircraft owner lookup by N-number

**Maritime:**

- Marine Traffic: `https://www.marinetraffic.com/` — live vessel positions via AIS
- VesselFinder: `https://www.vesselfinder.com/` — ship tracker with route history

**Cross-reference:** Check vessel/aircraft owners against OFAC sanctions list: `https://sanctionssearch.ofac.treas.gov/`

**Full technique details:** See `techniques/transport-tracking.md`
