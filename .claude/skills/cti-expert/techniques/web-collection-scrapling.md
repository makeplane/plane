# Web Collection via Scrapling

> **Module ID:** WEB-COL-001
> **Version:** 1.0.0
> **Phase:** Enhancement Module
> **Classification:** Adaptive Web Data Collection

---

## 1. Overview

Scrapling provides adaptive, resilient web data collection for OSINT. Three fetcher tiers auto-escalate based on site behavior. Headless browser opens BY DEFAULT for JS-heavy targets.

**When to use:** Any time web page content needs to be collected during investigation — replaces manual curl/WebFetch for structured scraping.

---

## 2. Collection Cascade

### Tier 1: Fetcher (Fast Static)

For: Static HTML pages, APIs returning HTML/JSON, simple forms.
Speed: ~2ms parse time. No browser needed.

```python
# Install (base, no browser)
# pip3 install scrapling

from scrapling.fetchers import Fetcher

page = Fetcher.get('https://who.is/whois/example.com')
registrant = page.css('.whois-data .registrant').text

# Extract all links
links = [a.attrib['href'] for a in page.css('a[href]')]
```

### Tier 2: StealthyFetcher (Anti-Bot Bypass)

For: Cloudflare-protected sites, rate-limited services, bot-detection pages.
Method: Playwright + fingerprint spoofing.

```python
# Install (requires browser)
# pip3 install "scrapling[fetchers]" && scrapling install

from scrapling.fetchers import StealthyFetcher

page = StealthyFetcher.get('https://cloudflare-protected-osint.com')
data = page.css('.results').text
```

### Tier 3: DynamicFetcher (JavaScript Rendering) — DEFAULT for JS Sites

For: React/Vue/Angular SPAs, infinite scroll, client-rendered content.
Method: Full Playwright browser with JS execution.
**THIS IS THE DEFAULT** when target is detected as JS-heavy.

```python
from scrapling.fetchers import DynamicFetcher

page = DynamicFetcher.get('https://react-osint-tool.com')
results = page.css('.dynamic-content').getall()

# Wait for specific element before extracting
page = DynamicFetcher.get('https://spa-target.com', wait_for='div.loaded')
```

---

## 3. Auto-Escalation Logic

When collecting data from a URL:

1. Try `Fetcher.get(url)` — if response has content, use it
2. If 403/429/captcha detected → escalate to `StealthyFetcher`
3. If content empty or JS-placeholder detected → escalate to `DynamicFetcher`
4. If all fail → fall back to WebFetch/WebSearch
5. Tag finding: `[scrapling-static]` / `[scrapling-stealth]` / `[scrapling-dynamic]`

**JS-heavy detection heuristic:**

- Response body contains `<div id="root"></div>` or `<div id="app"></div>` with no content
- Response body < 1KB but Content-Length header suggests larger page
- Known JS-heavy domains: social media, modern OSINT tools, dashboards

---

## 4. Headless Browser Auto-Open Policy

DEFAULT BEHAVIOR when a URL is fetched during investigation:

| Condition                       | Fetcher Used                               | Browser?               |
| ------------------------------- | ------------------------------------------ | ---------------------- |
| Static content (HTML with data) | Fetcher                                    | No                     |
| 403/bot-block response          | StealthyFetcher                            | Headless (stealth)     |
| JS-heavy/SPA detected           | DynamicFetcher                             | Headless (full render) |
| Screenshot needed               | agent-browser or project-native Playwright | Full browser           |

---

## 5. Session Management

For multi-page collection (paginated results, login-required):

```python
from scrapling.fetchers import StealthyFetcher

# Session persists cookies across requests
session = StealthyFetcher()
page1 = session.get('https://target.com/results?page=1')
page2 = session.get('https://target.com/results?page=2')
# Cookies, headers persist automatically
```

---

## 6. Adaptive Selectors

Scrapling's adaptive selectors auto-relocate when site structure changes. Critical for OSINT durability — selectors that worked last week keep working even if the target site redesigns.

```python
# First run: learns selector location
page = Fetcher.get('https://target.com')
name = page.css('#profile-name').text  # Scrapling memorizes context

# Later: site changes #profile-name to .user-name
# Scrapling auto-finds the equivalent element
```

---

## 7. Integration with Existing Techniques

Scrapling enhances these investigation modules:

| Technique                    | Enhancement                                  |
| ---------------------------- | -------------------------------------------- |
| `scam-check.md`              | Steps 2-7: PhishTank, CheckPhish scraping    |
| `phone-osint.md`             | USPhoneBook scraping (replaces cloudscraper) |
| `fx-visitor-intelligence.md` | SimilarWeb data extraction                   |
| `image-forensics`            | FaceCheck.id result scraping                 |
| `social-media-platforms.md`  | Profile data extraction                      |
| `whois-universal.md`         | who.is web scrape fallback (Layer 4)         |

---

## 8. Full Fallback Cascade

```
agent-browser or project-native Playwright → DynamicFetcher → StealthyFetcher → Fetcher → WebFetch → WebSearch → curl
```

---

## 9. Confidence Ratings

| Collection Method         | Tag                 | Confidence |
| ------------------------- | ------------------- | ---------- |
| Scrapling Fetcher         | [scrapling-static]  | HIGH       |
| Scrapling StealthyFetcher | [scrapling-stealth] | HIGH       |
| Scrapling DynamicFetcher  | [scrapling-dynamic] | HIGH       |
| WebFetch                  | [fetch]             | MEDIUM     |
| WebSearch                 | [search]            | MEDIUM     |
| curl                      | [manual]            | MEDIUM     |
