# Flow: Domain Sweep

Guided 6-step flow for comprehensive domain intelligence collection and risk assessment.

---

## Flow Metadata

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Activation | `/flow domain-sweep`                                   |
| Skill tier | Novice to Practitioner                                 |
| Duration   | 8–20 min depending on scope                            |
| Output     | Risk score + prioritized action list                   |
| Use cases  | Pre-purchase checks, routine monitoring, vendor review |

---

## Step 1: Target & Authorization

### 1a — Domain Entry

```
Domain Sweep  |  Step 1 of 6

Enter the target domain (e.g., example.com):
> _
```

Validation runs automatically:

```
✓ Format valid: example.com
✓ Resolves to IP: 203.0.113.45
✓ Server responds
Proceeding…
```

### 1b — Sweep Scope

```
Select sweep depth:

  1. Surface  (3 min)  — registration, SSL, headers
  2. Standard (8 min)  — + subdomains, tech stack, exposure
  3. Full     (20 min) — + enumeration, vuln testing, dorks

Scope (1/2/3):
```

| Scope    | Duration | Checks                                   |
| -------- | -------- | ---------------------------------------- |
| Surface  | 3 min    | Reg · SSL · headers                      |
| Standard | 8 min    | + Subdomains · tech · common exposure    |
| Full     | 20 min   | + Directory enum · dork suite · CVE scan |

### 1c — Authorization Confirmation

```
⚠ Authorization required

You are about to sweep: example.com

Valid authorization includes:
  ✓ You own this domain
  ✓ Written consent from the owner
  ✓ Active bug bounty program covers it
  ✗ No authorization → do not proceed

Do you have authorization? (yes / no)
```

If no:

```
Without authorization, active scanning may violate laws and ToS.
Passive reconnaissance (WHOIS, public records) is still available.

Continue with passive-only sweep? (yes / no)
```

---

## Step 2: Registration & Infrastructure

System collects: registrar, dates, nameservers, IP, hosting, CDN.

```
Step 2 of 6 — Registration & Infrastructure
[██████░░░░] 60%
```

### Registration Block

```
Domain: example.com
Registrar:  Namecheap, Inc.
Registered: 2018-03-15
Expires:    2025-03-15  ⚠ 45 days remaining
Status:     Active
Privacy:    Enabled  ✓
Nameservers: ns1.cloudflare.com · ns2.cloudflare.com
DNSSEC:     Enabled  ✓
```

### Infrastructure Block

```
IP:        203.0.113.45
Provider:  AWS  us-east-1
Server:    nginx/1.24.0
CDN:       CloudFlare  ✓
Regions:   Multi-region  ✓
```

Flags automatically raised:

```
⚠ Domain expires in 45 days — renew to prevent takeover risk.
```

---

## Step 3: Security Configuration

System checks SSL/TLS, security headers, HTTPS enforcement.

```
Step 3 of 6 — Security Configuration
[████████░░] 80%
```

### TLS Block

```
Certificate:
  Status:  Valid  ✓
  Issuer:  Let's Encrypt
  Expiry:  89 days
  Type:    DV

Protocol support:
  TLS 1.3  ✓ | TLS 1.2  ✓ | TLS 1.1  ✗ (disabled)
  Forward secrecy  ✓ | HSTS  ✓

Grade: A+
```

### Headers Block

```
Header                       Status
────────────────────────────────────
Strict-Transport-Security    ✓
Content-Security-Policy      ✓
X-Frame-Options              ✓
X-Content-Type-Options       ✓
Referrer-Policy              ✓
Permissions-Policy           ✗ Missing
X-XSS-Protection             ✓

Score: 6/7  |  Grade: A
```

Missing header detail auto-shown with fix instructions.

---

## Step 4: Exposure Check

Searches for leaked files, open directories, exposed interfaces.

```
Step 4 of 6 — Exposure Check
[████████░░] 80%
```

### Clean Result

```
Exposure check: no significant findings.

Checked:
  ✗ Config files (.env, web.config)  — none
  ✗ Backup files (.bak, .old)        — none
  ✗ Open directory listings          — none
  ✗ Admin interfaces                 — none
  ✗ Source repositories (.git)       — none

Exposure risk: LOW
```

### Issues Found Format

```
⚠ Exposure findings:

  [MEDIUM]  Backup file at /config.php.bak — may contain credentials
  [MEDIUM]  Directory listing enabled at /assets/
  [LOW]     robots.txt exposes /admin/ /api/ /internal/

Total exposure score: 3.5/10
```

---

## Step 5: Technology & Vulnerabilities

Identifies stack, versions, third-party services, CVE matches.

```
Step 5 of 6 — Technology Detection
[██████░░░░] 60%
```

```
Stack:
  nginx 1.24.0    ✓ current
  PHP 8.1.27      ✓ current
  Laravel 10.40   ✓ current
  jQuery 3.7.1    ✓ current

Third-party:
  Google Analytics 4 · CloudFlare · AWS S3 · reCAPTCHA v3

CVE check: 47 entries checked — 0 affecting this stack  ✓
```

---

## Step 6: Risk Report

```
Step 6 of 6 — Risk Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN SWEEP REPORT  |  example.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Grade: A-    Risk Score: 2.3/10

Category Scores:
  Registration:  9/10  ✓
  TLS/SSL:      10/10  ✓
  Headers:       9/10  ✓
  Exposure:      8/10  ✓
  Technology:   10/10  ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Priority Actions

```
Priority  Item                        Timeline
────────────────────────────────────────────────
Medium    Renew domain (45 days)      Within 30 days
Medium    Remove /config.php.bak      This week
Low       Add Permissions-Policy      Next deploy
Low       Disable /assets/ listing    Next deploy
```

### Export

```
1. Executive summary (PDF)
2. Technical report (PDF)
3. Findings CSV
4. JSON export
5. Remediation checklist

Select (1–5): _
```

---

## Related Files

- `experience/case-templates/tpl-security-review.md` — template version
- `techniques/domain-intelligence.md` — manual sweep techniques
- `engine/collection-engine.md` — source orchestration
