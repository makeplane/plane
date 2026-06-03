# OSINT Term Reference

Concise definitions for terms used throughout the skill. Grouped by function.

---

## Lookup

```
/define [term]            — look up a specific term
/define [first-letter]    — list all terms starting with that letter
/define search [keyword]  — search definitions by keyword
```

---

## Investigation & Case Terms

**Case**
A structured research effort with a defined subject and goal. Replaces the concept of a single search session.

**Subject**
The entity being researched — a person, company, domain, or image.

**Intake**
The first phase of a case: defining scope, validating the target, and confirming authorization.

**Pivot**
Advancing from one data point to a connected one. Finding an email and using it to locate social profiles is a pivot.

**Lead**
An unverified piece of information worth pursuing. Leads become findings once corroborated.

**Finding**
A confirmed data point with a source and confidence score.

**Confidence Score**
A 0–100% rating indicating how strongly a finding is supported by independent sources.

**Red Flag**
A signal that something is inconsistent, deceptive, or high-risk. Multiple red flags increase case risk level.

**Case Risk Score**
A 0–10 aggregate rating calculated from all findings and red flags in a case.

---

## People & Identity Terms

**Digital Footprint**
The accumulated online record of a subject — posts, registrations, profiles, and references across the web.

**Sock Puppet**
An account created to impersonate or deceive, typically not associated with the real person operating it.

**Catfish**
Someone who presents a fabricated identity online, usually using stolen photos and false biographical details.

**PII (Personally Identifiable Information)**
Data that can identify a specific individual: full name, address, date of birth, phone number, government ID numbers.

**Alias**
An alternate name or username used by a subject across platforms.

---

## Domain & Network Terms

**Domain**
The address of a website. example.com is a domain.

**Subdomain**
A functional division of a domain with its own address. mail.example.com and api.example.com are subdomains.

**DNS (Domain Name System)**
The system that maps domain names to IP addresses, like a directory for the internet.

**WHOIS**
A public record showing who registered a domain, when it was registered, and when it expires.

**IP Address**
A numerical identifier for a device on a network. Used to locate hosting providers and geolocate servers.

**CDN (Content Delivery Network)**
A distributed network of servers that speeds up website delivery and can obscure origin IP addresses.

**DNSSEC**
A security extension to DNS that cryptographically signs records, preventing tampering.

**Nameserver**
The server responsible for answering DNS queries for a domain.

---

## Search & Collection Terms

**Dork (Search Dork)**
A crafted search query using advanced operators to surface specific indexed data. See `techniques/search-operators.md`.

**Search Operator**
A special keyword or symbol that modifies how a search engine interprets a query. `site:`, `filetype:`, `intitle:` are operators.

**Scraper**
A tool that extracts structured data from web pages automatically.

**Crawler**
An automated program that traverses links across websites to catalog content. Also called a spider or bot.

**Cached Page**
A snapshot of a webpage stored by a search engine. Useful when the live page is altered or removed.

**Archived Data**
Historical web content preserved by services like the Wayback Machine.

---

## Image & Media Terms

**EXIF Data**
Embedded information in image files: camera model, capture timestamp, GPS coordinates, and software used.

**Metadata**
Descriptive information stored inside a file that is not part of the visible content.

**Reverse Image Search**
Using an image as the search query rather than text, to find where else it appears online.

**Geolocation**
Determining a physical location from digital signals — GPS coordinates, IP address, or image background analysis.

**Geotag**
Location data embedded in or attached to a photo, video, or post.

**AI-Generated Image**
An image created entirely by a generative model, with no real-world subject. Detection relies on artifact analysis.

---

## Security Terms

**Vulnerability**
A weakness in a system that could be exploited to gain unauthorized access or cause harm.

**CVE (Common Vulnerabilities and Exposures)**
A standardized identifier for a known software security flaw. Format: CVE-YEAR-NUMBER.

**Exposure**
Sensitive data or functionality that is unintentionally accessible to the public.

**Security Header**
An HTTP response directive that instructs browsers on how to handle content. Controls XSS, framing, MIME type handling.

**SSL/TLS**
Cryptographic protocols that encrypt data between a browser and a server. TLS is the current standard.

**HSTS (HTTP Strict Transport Security)**
A header that forces browsers to use HTTPS only, preventing protocol downgrade.

**XSS (Cross-Site Scripting)**
An attack that injects malicious scripts into a trusted site to execute in other users' browsers.

**IOC (Indicator of Compromise)**
Observable evidence that a system has been breached or targeted.

**TTPs (Tactics, Techniques, and Procedures)**
The characteristic behavioral patterns of a threat actor.

**Data Breach**
An incident where private data is accessed or released without authorization.

---

## Technical Infrastructure Terms

**API (Application Programming Interface)**
A defined contract for how software components communicate. OSINT tools often use APIs to query data sources.

**Endpoint**
A specific URL that an API exposes to receive requests and return data.

**FTP (File Transfer Protocol)**
A method for transferring files between systems. Open FTP directories can be an exposure vector.

**HTTP / HTTPS**
The protocols governing web communication. HTTPS is the encrypted version.

**JSON**
A lightweight data format used by APIs and data exports. Readable by humans and machines.

**Hash**
A fixed-length fingerprint derived from a file's contents. Identical files produce identical hashes.

**Honeypot**
A decoy system deployed to detect and study unauthorized access attempts.

**SIEM**
Security Information and Event Management — a platform that centralizes and correlates security log data.

**Token**
A temporary credential used for authentication or session management.

**User Agent**
A string sent by a browser or tool identifying itself to the server.

**VPN (Virtual Private Network)**
A service that routes traffic through an intermediary server, masking the user's IP and location.

---

## Acronym Reference

| Acronym | Full Term                                 |
| ------- | ----------------------------------------- |
| API     | Application Programming Interface         |
| CDN     | Content Delivery Network                  |
| CVE     | Common Vulnerabilities and Exposures      |
| DNS     | Domain Name System                        |
| DNSSEC  | DNS Security Extensions                   |
| EXIF    | Exchangeable Image File Format            |
| FCRA    | Fair Credit Reporting Act                 |
| FTP     | File Transfer Protocol                    |
| HSTS    | HTTP Strict Transport Security            |
| HTTP/S  | HyperText Transfer Protocol (Secure)      |
| IOC     | Indicator of Compromise                   |
| IP      | Internet Protocol                         |
| JSON    | JavaScript Object Notation                |
| OSINT   | Open Source Intelligence                  |
| PII     | Personally Identifiable Information       |
| SIEM    | Security Information and Event Management |
| TLS     | Transport Layer Security                  |
| TTP     | Tactics, Techniques, and Procedures       |
| URL     | Uniform Resource Locator                  |
| VPN     | Virtual Private Network                   |
| XSS     | Cross-Site Scripting                      |

---

## Related Files

- `experience/accessibility/accessible-mode.md` — reading and display settings
- `experience/skill-tiers.md` — how tier affects term translation
- `experience/layered-detail.md` — inline terminology rendering
