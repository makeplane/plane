# Walkthrough: Domain Sweep

Step-by-step case example. Target: `startup-example.io`
Scenario: Pre-investment due diligence sweep on an early-stage company's domain infrastructure.

---

## Setup

Open case workspace. Add `startup-example.io` as primary subject (type: domain).

---

## Step 1 — WHOIS and Registration History

**Query:**

```
WHOIS lookup: startup-example.io
Registrar history: viewdns.info/whois/?domain=startup-example.io
```

**Findings logged:**

```
FND-001  Registrant email: founders@startup-example.io  [HIGH — confirmed]
FND-002  Registered: 2023-04-11  Expires: 2025-04-11  [INFO]
FND-003  Registrar: Namecheap  Privacy: enabled  [INFO]
```

**Flag:** FND-002 — expiry < 60 days from case date. Domain at lapse risk.

---

## Step 2 — DNS Records

**Query tools:** `dig`, `dnsdumpster.com`, `securitytrails.com`

**Findings logged:**

```
FND-004  MX: mail.startup-example.io → Google Workspace  [INFO]
FND-005  SPF record absent  [HIGH — exposure: email spoofing enabled]
FND-006  DMARC record absent  [HIGH — exposure: phishing risk]
FND-007  TXT: includes verification token for Stripe  [MEDIUM — reveals payment processor]
```

---

## Step 3 — Subdomain Sweep

**Method:** Certificate transparency (crt.sh), DNS brute-force, search operator query

**Operator query:**

```
site:startup-example.io -www
```

**Subdomains discovered:**

```
SUB-002  api.startup-example.io        → responds HTTP 200  [INFO]
SUB-003  staging.startup-example.io    → responds HTTP 200  [HIGH — public staging env]
SUB-004  admin.startup-example.io      → responds HTTP 403  [MEDIUM — admin panel exists]
SUB-005  mail.startup-example.io       → responds HTTP 200  [INFO]
```

**Flag:** SUB-003 — staging environment publicly accessible.

---

## Step 4 — Exposed Files Sweep

**Operator queries:**

```
site:startup-example.io filetype:pdf
site:startup-example.io filetype:env OR filetype:log
site:startup-example.io intitle:"index of"
```

**Findings logged:**

```
FND-008  site:startup-example.io filetype:pdf → 3 results: pitch-deck-v2.pdf  [MEDIUM]
FND-009  intitle:"index of" → open directory at /uploads/  [CRITICAL]
FND-010  /uploads/ contains: user-export-2024-11.csv  [CRITICAL — PII exposure]
```

---

## Step 5 — Credential Exposure Check

**Tools:** HaveIBeenPwned (domain search), dehashed.com, pastebin operator queries

**Operator queries:**

```
"@startup-example.io" site:pastebin.com
"startup-example.io" "password" site:github.com
```

**Findings logged:**

```
FND-011  4 accounts from @startup-example.io in 2023 breach (LinkedIn scrape)  [HIGH]
FND-012  GitHub repo: employee/config-backup — contains .env with DB_PASSWORD  [CRITICAL]
```

---

## Step 6 — Exposure Summary

```
╔══ EXPOSURE SUMMARY: startup-example.io ═══════════════════════╗
║  Subjects:  5  (domain + 4 subdomains)                        ║
║  Findings:  12  (2 CRITICAL, 4 HIGH, 4 MEDIUM, 2 INFO)       ║
║  Exposure:  CRITICAL (88/100)                                 ║
╠═══════════════════════════════════════════════════════════════╣
║  CRITICAL                                                     ║
║  • Open directory /uploads/ with user PII export             ║
║  • GitHub credential leak (DB password)                       ║
║  HIGH                                                         ║
║  • No SPF or DMARC records (email spoofing)                  ║
║  • Public staging environment                                 ║
║  • 4 accounts in breach database                             ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Step 7 — Report

Format: F6 (threat-brief) for security team, F1 (leadership-brief) for investor.
See [`output/reports/format-catalog.md`](../../output/reports/format-catalog.md).

---

_See also: [`guides/walkthroughs/walkthrough-person-lookup.md`](./walkthrough-person-lookup.md)_
