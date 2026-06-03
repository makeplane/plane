# Email OSINT Module

> **Module ID:** EML-OSINT-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Deep Email Intelligence & Account Enumeration

---

## 1. Overview

Email OSINT maps an email address to platform registrations, breach exposure, professional presence, and identity signals. Use when a target email is known and you need to enumerate linked accounts, verify validity, or assess breach history.

**Cross-references:** `email-forensics.md` (header/routing analysis), `breach-intel.md` (HIBP deep dive).
**Key use cases:** Account discovery, breach correlation, identity verification, phishing source investigation.

---

## 2. Tool Inventory

### Primary — Holehe (120+ sites)

```bash
pip3 install holehe
```

### Secondary — h8mail (breach hunting + chasing)

```bash
pip3 install h8mail
```

### Tertiary — GHunt (Gmail-specific intelligence)

```bash
pip3 install ghunt
ghunt login   # OAuth setup required (one-time)
```

### Domain-wide — theHarvester

```bash
pip3 install theHarvester
# or: already included in Kali Linux
```

### API Tools (no install)

```bash
# EmailRep — free, no key required for basic tier
curl https://emailrep.io/user@example.com

# Hunter.io — 50 requests/month free
curl "https://api.hunter.io/v2/email-finder?domain=example.com&api_key=YOUR_KEY"

# HIBP web — no API key needed for manual checks
# https://haveibeenpwned.com/
```

---

## 3. Investigation Workflow

```
Step 1: Validate email format and domain MX
  └─ Confirm deliverable before investing scan time

Step 2: Run Holehe (account enumeration across 120+ sites)
  └─ Fastest signal for platform registration footprint

Step 3: Run EmailRep API (reputation + breach flag)
  └─ Returns risk score, known breaches, deliverability

Step 4: Check HIBP manually or via h8mail
  └─ h8mail --chase flag follows breach chains

Step 5: Run theHarvester on the email's domain
  └─ Discovers other addresses at same org

Step 6: If Gmail — run GHunt for Google ecosystem data
  └─ Maps Google Photos, Maps reviews, Calendar visibility

Step 7: Cross-reference breach-intel.md findings
  └─ Correlate breach dates with platform registration timeline
```

---

## 4. CLI Commands & Expected Output

### Holehe

```bash
# Standard account scan
holehe user@example.com

# Export results to CSV
holehe user@example.com --only-used --csv

# Verbose output
holehe user@example.com -v
```

**Expected output:**

```
[+] adobe.com        - user@example.com - USED
[+] twitter.com      - user@example.com - USED
[-] github.com       - user@example.com - NOT USED
[+] spotify.com      - user@example.com - USED
[*] Rate limit hit   - instagram.com    - SKIPPED
...
[*] 23 used, 89 not used, 8 skipped
```

**Holehe rate-limit handling:**

```bash
# Add delay between requests
holehe user@example.com --timeout 3

# If blocked: rotate IP or wait 15-30 minutes
# Instagram, Twitter enforce stricter limits — expect SKIPPED results
```

### h8mail

```bash
# Basic breach search
h8mail -t user@example.com

# Chase mode — follows breach data to find linked emails/passwords
h8mail -t user@example.com --chase

# Use local breach file (e.g., downloaded combo list)
h8mail -t user@example.com -bc /path/to/breach.txt

# Multiple targets from file
h8mail -t targets.txt
```

**Expected output:**

```
[>] TARGET: user@example.com
[>] SOURCE: HaveIBeenPwned
    [!] Breach: LinkedIn (2016) — email, password hash
    [!] Breach: Adobe (2013)   — email, username, encrypted password
[>] SOURCE: LeakCheck
    [!] Found: 3 entries
[*] Saved results to h8mail_results.json
```

### GHunt (Gmail targets only)

```bash
# One-time login
ghunt login

# Email investigation
ghunt email user@gmail.com

# Profile enrichment
ghunt gaia <GAIA_ID>
```

**Expected output:**

```
Name: John Doe
Profile picture: https://lh3.googleusercontent.com/...
Last profile edit: 2023-08-14
Google Maps reviews: 12 reviews (public)
YouTube channel: Linked
Google Calendar: Partially public
Hangouts: Active
```

### theHarvester (domain-wide)

```bash
# Harvest all emails from a domain
theHarvester -d example.com -b google,bing,duckduckgo

# With LinkedIn source
theHarvester -d example.com -b linkedin

# Export to HTML report
theHarvester -d example.com -b all -f report.html

# Limit results
theHarvester -d example.com -b google -l 200
```

### EmailRep API

```bash
# Basic reputation check (no key for 10 req/day)
curl https://emailrep.io/user@example.com

# With API key header (higher limits)
curl -H "Key: YOUR_API_KEY" https://emailrep.io/user@example.com
```

**Expected JSON response:**

```json
{
  "email": "user@example.com",
  "reputation": "high",
  "suspicious": false,
  "references": 24,
  "details": {
    "blacklisted": false,
    "malicious_activity": false,
    "malicious_activity_recent": false,
    "credentials_leaked": true,
    "credentials_leaked_recent": false,
    "data_breach": true,
    "days_since_domain_creation": 4521,
    "first_seen": "07/2015",
    "last_seen": "03/2024",
    "domain_exists": true,
    "domain_reputation": "high",
    "new_domain": false,
    "free_provider": false,
    "disposable": false,
    "deliverable": true,
    "spoofable": false,
    "spf_strict": true,
    "dmarc_enforced": true,
    "profiles": ["twitter", "linkedin", "github"]
  }
}
```

---

## 5. Fallback Cascade

```
Holehe rate-limited?
  └─> Wait 15 min or rotate IP via VPN/Tor
  └─> Run manually on top 20 sites (Twitter, Instagram, GitHub, Adobe, Spotify)

h8mail no results?
  └─> Check HIBP manually: https://haveibeenpwned.com/
  └─> Try DeHashed (paid) or IntelX (limited free)

GHunt OAuth broken?
  └─> Use Google search: site:google.com/maps/contrib "<email>"
  └─> Check calendar: https://calendar.google.com/calendar/embed?src=<email>

theHarvester blocked?
  └─> Google dork: site:example.com "@example.com" -www
  └─> LinkedIn: company search + employee filter

EmailRep quota hit (10/day free)?
  └─> Use Hunter.io email verifier (50/month free)
       curl "https://api.hunter.io/v2/email-verifier?email=user@example.com&api_key=KEY"
  └─> MXToolbox deliverability check: https://mxtoolbox.com/emailhealth/
```

---

## 6. Output Interpretation

### Holehe Result Signals

```
USED     → Email registered on that service (strong signal)
NOT USED → No account or account uses different email
SKIPPED  → Rate limited or site structure changed

False positives: Some sites return USED for any input (bad detection logic)
Verify top hits manually by attempting password reset flow
```

### EmailRep Tier Behavior

```
Free (no key):  10 requests/day, basic fields only
Basic key:      1000/month, full details including profiles[]
Commercial:     Unlimited, real-time breach feeds included

Key field to check: "profiles" array — reveals linked social accounts
Risk signals: disposable=true, credentials_leaked_recent=true, spoofable=true
```

### h8mail Chase Feature

```
--chase follows breach entries to discover:
  - Linked emails (same password used on breached service)
  - Password patterns (even if hash, shows reuse)
  - Additional accounts tied to same credential set

Use chase output to feed back into Holehe for new email addresses found
```

### Cross-Reference with breach-intel.md

```
After h8mail run:
  1. Note breach names and dates
  2. Open breach-intel.md → Section 5: Exposure Timeline
  3. Build timeline: when was this email first exposed?
  4. Cross with Holehe hits: accounts created after breach date
     may use fresh credentials; accounts before = higher reuse risk

Cross-reference with email-forensics.md:
  If analyzing received email from target, combine:
    - Holehe account list (what services they use)
    - Header analysis (sending server, timezone)
    - GHunt Google profile data
  → Builds full sender identity picture
```

---

## 7. Confidence Ratings

| Finding Type                      | Confidence | Notes                                 |
| --------------------------------- | ---------- | ------------------------------------- |
| Email deliverability              | HIGH       | MX record + SMTP verify               |
| Holehe account hit                | MEDIUM     | Verify via password reset manually    |
| EmailRep reputation score         | HIGH       | Aggregated from multiple feeds        |
| Breach membership (HIBP)          | HIGH       | Cryptographic k-anonymity model       |
| h8mail credential chain           | MEDIUM     | Depends on source database quality    |
| GHunt Google profile              | HIGH       | Direct Google API data                |
| theHarvester domain emails        | MEDIUM     | May include outdated/former employees |
| Linked social profiles (EmailRep) | MEDIUM     | Feed freshness varies                 |

---

## 8. Proton Mail Account Intelligence

**Method:** Query the Proton HKP keyserver (free, no auth, no API key).

```bash
# Step 1: Fetch raw PGP public key for any Proton email
curl -s "https://mail-api.proton.me/pks/lookup?op=get&search=username@proton.me"

# Step 2: Parse key creation timestamp
# The PGP key contains creation date = Proton account creation date
# Use gpg to extract:
curl -s "https://mail-api.proton.me/pks/lookup?op=get&search=username@proton.me" | gpg --show-keys 2>/dev/null

# Step 3: Alternative — use online decoder
# Visit: https://kriztalz.sh/proton-date/
# Paste the raw PGP key to extract account creation timestamp
```

**What it reveals:**

| Field                 | Forensic Value                                  | Confidence |
| --------------------- | ----------------------------------------------- | ---------- |
| Account creation date | When Proton account was created (UTC)           | HIGH       |
| Key algorithm         | RSA vs ECC — technical sophistication indicator | LOW        |
| Key size              | 2048 vs 4096 — security consciousness indicator | LOW        |
| Associated emails     | If multiple UIDs on key, reveals alt addresses  | MEDIUM     |

**Integration:** Feed creation date into `/timeline`. If Proton account was created shortly before suspicious activity, this is a strong temporal correlation signal.

---

## 9. PGP Key Search (Technical Targets)

**Method:** Query OpenPGP keyserver (free, no auth).

```bash
# Search by email address
curl -s "https://keys.openpgp.org/vks/v1/by-email/user@example.com"

# Search on MIT keyserver (broader, older keys)
# WebSearch: site:pgp.mit.edu "user@example.com"

# Search on Ubuntu keyserver
# WebSearch: site:keyserver.ubuntu.com "user@example.com"
```

**What it reveals:**

| Field                 | Forensic Value                                    | Confidence |
| --------------------- | ------------------------------------------------- | ---------- |
| Key creation date     | When key was generated (account origin timeline)  | HIGH       |
| User IDs (UIDs)       | Names, emails, comments embedded in key           | HIGH       |
| Key signatures        | Who signed their key = trust network / associates | MEDIUM     |
| Keyserver upload date | When they published the key                       | MEDIUM     |

**When to use:** Target is a developer, security professional, journalist, or technically sophisticated individual. PGP keys are uncommon for general users but reveal rich identity data for technical targets.

---

## 10. Email Permutation Generation

**Method:** Pure logic — Claude generates permutations, no external tool needed.

Given a discovered name (e.g., "John Smith") and domain (e.g., "company.com"), generate:

```
Common patterns (test all with email verifier):
  john.smith@company.com
  johnsmith@company.com
  john_smith@company.com
  jsmith@company.com
  j.smith@company.com
  smithj@company.com
  smith.john@company.com
  john.s@company.com
  johns@company.com
  john@company.com
  smith@company.com
```

**Verification:** After generating permutations, verify each using:

1. Holehe (account check)
2. EmailRep API (deliverability)
3. Hunter.io email verifier (SMTP check)

**When to use:** When you know a person's name and their employer/domain but not their exact email format. Especially useful for corporate email discovery.

**Web-based permutators (manual fallback):**

- Thunderbit: https://thunderbit.com/tool/email-permutator
- Mailmeteor: https://mailmeteor.com/email-permutator
- Metric Sparrow: http://metricsparrow.com/toolkit/email-permutator

---

## 11. Forgot Password Account Verification

**Method:** Use password reset pages to confirm account existence. **Never complete the reset — observe response only.**

| Platform      | Reset URL                                           | Positive Signal                        | Negative Signal         |
| ------------- | --------------------------------------------------- | -------------------------------------- | ----------------------- |
| **Facebook**  | https://www.facebook.com/login/identify             | Shows partial info / reset options     | "No account found"      |
| **Instagram** | https://www.instagram.com/accounts/password/reset   | Sends reset link / shows partial email | "No user found"         |
| **Google**    | https://accounts.google.com/signin/usernamerecovery | Shows recovery options                 | "Couldn't find account" |

**Reverse technique (phone → email):**

```
Google Account Recovery: https://accounts.google.com/signin/usernamerecovery
→ Enter phone number → may reveal associated Gmail address and name
```

**IMPORTANT:** This technique requires manual execution (CAPTCHAs, JS rendering). Claude generates the URLs and instructions; the analyst visits them.

**Ethics:** Do NOT complete password resets. Do NOT attempt unauthorized access. This is strictly for existence verification.

---

## 12. Manual Reference Tools (Web UI Only)

These tools provide valuable intelligence but require manual browser interaction. Claude generates URLs with the target pre-filled where possible.

| Tool                    | URL                                               | What It Reveals                                             | Automation     |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------------------- | -------------- |
| **Epieos**              | https://epieos.com                                | Google ID, social links, breaches — multi-source aggregator | Manual (JS)    |
| **IntelBase**           | https://intelbase.is                              | Registered accounts, breach data, profile metadata          | Manual (JS)    |
| **Reverse Contact**     | https://app.reversecontact.com                    | Social media profiles from email                            | Manual (JS)    |
| **Mailmeteor Reverse**  | https://mailmeteor.com/tools/reverse-email-lookup | Linked social accounts                                      | Manual (JS)    |
| **Mailmeteor Verifier** | https://mailmeteor.com/email-checker              | Email deliverability check                                  | Manual (JS)    |
| **Gmail OSINT Tool**    | https://gmail-osint.activetk.jp                   | Gravatar image, Google profile from username                | Manual (JS)    |
| **Google Chat**         | https://chat.google.com                           | Profile picture from email (requires Google login)          | Manual (login) |
| **Microsoft OneDrive**  | https://onedrive.live.com                         | Share file with email → reveals real name                   | Manual (login) |

**Workflow integration:** During `/email-deep`, Claude lists applicable manual URLs for the analyst to check in parallel while automated tools run.

---

## 13. Limitations

1. **Holehe rate limiting** — Instagram, Twitter, Facebook aggressively throttle; expect gaps
2. **EmailRep free tier** — 10 req/day; "profiles" field empty without API key
3. **Hunter.io quota** — 50 searches/month free; domain searches consume quota faster
4. **GHunt OAuth dependency** — Requires valid Google account login; breaks on Google policy changes
5. **h8mail public sources only** — Does not access dark web dumps; misses private breach markets
6. **HIBP API key** — v3 API requires paid key for programmatic access; web UI is free
7. **Disposable email detection** — New disposable providers not immediately flagged; check domain age
8. **False negatives** — Target may use email aliases (+tag, dots in Gmail) that Holehe won't match

---

## 14. Command Reference

| Command                          | Purpose                                                           | Input           |
| -------------------------------- | ----------------------------------------------------------------- | --------------- |
| `/email-deep [email]`            | Full enumeration + breach + reputation + Proton/PGP + manual URLs | Email address   |
| `/email-accounts [email]`        | Holehe account discovery only                                     | Email address   |
| `/email-breach [email]`          | h8mail + HIBP breach history                                      | Email address   |
| `/email-rep [email]`             | EmailRep reputation score                                         | Email address   |
| `/email-harvest [domain]`        | theHarvester domain-wide email collection                         | Domain name     |
| `/email-permute [name] [domain]` | Generate email permutations from name + domain                    | Name and domain |
| `/proton-check [email]`          | Proton Mail account creation date via PGP key                     | Proton email    |
| `/pgp-lookup [email]`            | PGP key search — creation date, UIDs, signatures                  | Any email       |

---

_Email OSINT Module v1.1.0_
_Part of CTI Expert Skill_
_For authorized investigation and educational purposes only_
