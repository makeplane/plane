# Phone OSINT Module

> **Module ID:** PHN-OSINT-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Phone Number Intelligence & Carrier Analysis

---

## 1. Overview

Phone OSINT extracts carrier, location, line type, and registration intelligence from phone numbers. Use when a target's phone number is known and you need to determine validity, owner identity, geographic origin, or VoIP/disposable status.

**Key use cases:** Fraud detection, identity verification, social engineering awareness, contact tracing, disposable number detection.

---

## 2. Tool Inventory

### Primary — PhoneInfoga

```bash
# Docker (recommended)
docker pull sundowndev/phoneinfoga
docker run --rm sundowndev/phoneinfoga scan -n "+12025551234"

# Go install
go install github.com/sundowndev/phoneinfoga/v2/cmd/phoneinfoga@latest
```

### Secondary — FreeCNAM (US CallerID)

```bash
# Free, no key required — US numbers only
curl "https://freecnam.org/dip?q=2025551234"
```

Returns caller ID name for US phone numbers. Lightweight, fast, no authentication.

### Tertiary — WhoCalld (Phone Type + Carrier Scraping)

```bash
# No install required — scrape phone type, carrier, location
curl "http://whocalld.com/+12025551234" | python3 -c "
from bs4 import BeautifulSoup; import sys
soup = BeautifulSoup(sys.stdin.read(), 'html.parser')
for div in soup.find_all('div', class_='info'): print(div.text.strip())
"
```

Returns phone type (mobile/virtual/unknown), carrier, location. Complements PhoneInfoga.

### Quaternary — USPhoneBook (Reverse Person Lookup)

```bash
# Requires cloudscraper (pip3 install cloudscraper)
# Search by phone number — returns name, addresses, relatives, emails
python3 -c "
import cloudscraper, json
from bs4 import BeautifulSoup
s = cloudscraper.create_scraper()
r = s.get('https://usphonebook.com/202-555-1234', headers={'Referer': 'https://www.google.com/'})
soup = BeautifulSoup(r.text, 'html.parser')
for script in soup.find_all('script', type='application/ld+json'):
    data = json.loads(script.string)
    if 'name' in data: print(json.dumps(data, indent=2))
"
```

US-only. Extracts: name, current/previous addresses, related persons, emails, phone numbers from JSON-LD structured data. Useful for identity correlation and pivot chaining.

**Also supports name-based search:**

```bash
# Search by name + state (optional city)
# URL: https://usphonebook.com/{fullname}/{state}/{city}
```

### Quinary — Moriarty-Project

```bash
git clone https://github.com/AzizKpln/Moriarty-Project
cd Moriarty-Project
pip3 install -r requirements.txt
python3 moriarty.py
```

### Senary — NumVerify API (free tier: 100 requests/month)

```bash
# Free key at apilayer.com/marketplace/number_verification-api
curl "http://apilayer.net/api/validate?access_key=YOUR_FREE_KEY&number=+12025551234&format=1"
```

### Web Fallback — Google Dork

```
No install required; manual browser search
```

---

## 3. Investigation Workflow

```
Step 1: Normalize to E.164 format
  └─ +[country code][number] — no spaces, dashes, or parentheses
  └─ Example: (202) 555-1234 → +12025551234

Step 2: Validate format and carrier lookup
  └─ PhoneInfoga scan confirms country, carrier, line type

Step 3: CallerID lookup (US numbers)
  └─ FreeCNAM: curl "https://freecnam.org/dip?q={number}"
  └─ WhoCalld: scrape phone type, carrier, location from whocalld.com

Step 4: Reverse person lookup (US numbers)
  └─ USPhoneBook: name, addresses, relatives, emails
  └─ Enables identity correlation and pivot chaining

Step 5: Check NumVerify for line type classification
  └─ Distinguishes mobile / landline / VoIP / toll-free

Step 6: Run Moriarty for social/app registrations
  └─ Checks WhatsApp, Telegram, Signal presence

Step 7: Google dork for public references
  └─ Pastes, forums, classifieds, WHOIS contact records

Step 8: Assess disposable/VOIP risk
  └─ Flag Twilio, Google Voice, TextNow, Hushed prefixes
```

---

## 4. CLI Commands & Expected Output

### PhoneInfoga

```bash
# Basic scan
phoneinfoga scan -n "+12025551234"

# Scan with HTTP server for web UI
phoneinfoga serve -p 8080
# Then visit: http://localhost:8080

# JSON output
phoneinfoga scan -n "+12025551234" --output json > phone_results.json
```

**Expected output:**

```
Results for +12025551234
├── Raw local: 2025551234
├── Local: (202) 555-1234
├── E.164: +12025551234
├── International: +1 202-555-1234
├── Country: United States (US)
├── Carrier: AT&T Mobility
├── Line type: mobile
└── Timezone: America/New_York

Google search: "2025551234" OR "+12025551234"
Bing search: https://www.bing.com/search?q=%2B12025551234
...
```

### NumVerify API

```bash
# Validate and classify line type
curl "http://apilayer.net/api/validate?access_key=FREE_KEY&number=+12025551234&format=1"
```

**Expected JSON response:**

```json
{
  "valid": true,
  "number": "12025551234",
  "local_format": "2025551234",
  "international_format": "+12025551234",
  "country_prefix": "+1",
  "country_code": "US",
  "country_name": "United States",
  "location": "Washington D.C.",
  "carrier": "AT&T Mobility LLC",
  "line_type": "mobile"
}
```

### Google Dork Fallback

```bash
# Paste into browser
"+12025551234"
site:pastebin.com "+12025551234"
"+12025551234" contact OR listing OR owner
intext:"202-555-1234" -site:yellowpages.com
```

### Moriarty (interactive)

```bash
cd Moriarty-Project
python3 moriarty.py
# Enter phone number when prompted
# Checks: WhatsApp, Telegram, Instagram, Snapchat, Twitter
```

---

## 5. Fallback Cascade

```
PhoneInfoga unavailable (no Docker/Go)?
  └─> FreeCNAM (US only): curl "https://freecnam.org/dip?q={number}"
  └─> WhoCalld scrape: curl "http://whocalld.com/+1{number}"

CallerID/carrier found but need identity?
  └─> USPhoneBook reverse lookup (US): cloudscraper → usphonebook.com/{phone}
  └─> Returns: name, addresses, relatives, emails — excellent for pivot chaining

NumVerify quota exhausted?
  └─> Use Twilio Lookup (free trial credits)
       curl -X GET "https://lookups.twilio.com/v1/PhoneNumbers/+12025551234" \
            -u ACCOUNT_SID:AUTH_TOKEN

No API keys available?
  └─> Google dork: "+12025551234" site:truecaller.com
  └─> Check: sync.me, whitepages.com, spokeo.com (manual)

All automated tools blocked?
  └─> WHOIS dork: the number as contact in domain registrations
       intext:"+12025551234" site:who.is
```

---

## 6. Output Interpretation

### Line Type Significance

```
mobile    → SIM card; can receive SMS 2FA; trackable via SS7
landline  → Fixed location; geo-reliable; not SMS-capable
voip      → Internet-based; low geographic reliability; often anonymous
toll-free → Business/service number; rarely tied to individual
premium   → Pay-per-call; often scam infrastructure
unknown   → Ported number or carrier data unavailable
```

### Disposable Number Detection

```
High-risk carriers (VoIP/disposable):
  - Google Voice (US: 646/929/850 area codes common)
  - Twilio (multiple ranges; check carrier name = "Twilio")
  - TextNow / TextFree
  - Hushed / Burner app
  - MySudo
  - NumberBarn

Detection signal: carrier name contains "LLC" + unknown location
```

### VoIP vs. Mobile Significance

```
VoIP findings mean:
  - Number may be ephemeral (cancel anytime)
  - Owner likely privacy-conscious
  - Geographic location unreliable
  - Cannot receive SS7-based location pings

Mobile findings mean:
  - Tied to physical SIM
  - More reliable geo (based on area code/MNP)
  - Likely registered to an identity (KYC in most countries)
```

### E.164 Normalization Rules

```
Input variations to normalize before scanning:
  (202) 555-1234    → +12025551234
  202.555.1234      → +12025551234
  +44 20 7946 0958  → +442079460958
  0044 20 7946 0958 → +442079460958

Rule: strip all non-digits, prepend "+" and country code
```

---

## 7. Confidence Ratings

| Finding Type                | Confidence | Notes                       |
| --------------------------- | ---------- | --------------------------- |
| Country code identification | HIGH       | E.164 standard              |
| Carrier name                | HIGH       | MNP database lookup         |
| Line type (mobile/landline) | HIGH       | Carrier-reported            |
| VoIP classification         | HIGH       | Carrier name match          |
| Geographic location         | MEDIUM     | Area code; may be ported    |
| Owner identity              | LOW        | Requires public records     |
| Social app registration     | MEDIUM     | App-dependent; may be stale |
| Disposable number flag      | MEDIUM     | Known carrier list only     |

---

## 8. Limitations

1. **Number portability** — MNP means area code no longer implies geography
2. **Free API quotas** — NumVerify free = 100/month; Twilio requires account
3. **Privacy laws** — GDPR, CCPA restrict carrier data disclosure in some regions
4. **WhatsApp/Telegram checks** — Moriarty requires target to have accepted terms; may trigger alerts
5. **Spoofed caller ID** — Caller ID ≠ actual originating number; SIP trunking allows any display
6. **Prepaid SIMs** — Often unregistered in countries without KYC requirements
7. **PhoneInfoga Docker** — Requires Docker daemon running; add user to docker group

---

## 9. Command Reference

| Command                    | Purpose                                 | Input                     |
| -------------------------- | --------------------------------------- | ------------------------- |
| `/phone [number]`          | Full phone intelligence scan            | Phone number (any format) |
| `/phone-validate [number]` | Format validation + carrier lookup only | Phone number              |
| `/phone-type [number]`     | Classify VoIP / mobile / landline       | Phone number              |

---

_Phone OSINT Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized investigation and educational purposes only_
