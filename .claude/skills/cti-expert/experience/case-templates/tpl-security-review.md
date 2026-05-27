# tpl-security-review

7-phase domain security assessment. Produces a scored report with a remediation roadmap.

---

## Template Metadata

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| ID                     | `security-review`                                                  |
| Category               | security                                                           |
| Skill tier             | Practitioner to Specialist                                         |
| Duration               | 10–20 min standard · 30–45 min full                                |
| Required inputs        | Domain name                                                        |
| Required authorization | Yes — only scan domains you own or have written permission to test |
| Output                 | Security grade A–F + prioritized remediation list                  |

---

## Activation

```
/case-template run security-review

Target domain: _

Scope:
  [ ] Include subdomain mapping
  [ ] Run exposure dork suite
  [ ] Security header analysis
  [ ] SSL/TLS assessment
  [ ] CVE version check

Depth:
  (•) Standard  10–15 min
  ( ) Full       30–45 min
  ( ) Surface     3–5 min

/ethical-guidelines  |  /begin  |  /cancel
```

---

## Phases

### Phase 1 — Surface Reconnaissance

Registration data, DNS records, hosting, CDN.

```
/sweep {{domain}} --whois
/sweep {{domain}} --dns
/sweep {{domain}} --hosting
```

| Check | Data Collected            | Risk Signal                  |
| ----- | ------------------------- | ---------------------------- |
| WHOIS | Registrar, dates, privacy | Expiring soon, no privacy    |
| DNS   | Records, nameservers      | Single nameserver, no DNSSEC |
| IP    | Provider, geo             | High-risk hosting            |
| CDN   | Network present           | None detected                |

**Reconnaissance flags:**

```
Critical:  Expiring registration · suspicious registrar
Warning:   Single-point DNS · recently transferred
Clear:     Long history · reputable registrar · DNSSEC
```

### Phase 2 — Subdomain Mapping

Enumerate all subdomains and assess exposure per entry point.

```
/sweep {{domain}} --subdomains
/dork site:{{domain}} -www -mail -ftp
/wildcard-check {{domain}}
```

Standard subdomain targets:

```
www · mail · ftp · admin · test · dev · staging · api · app · cdn
```

| Subdomain Type | Risk Level | Reason                        |
| -------------- | ---------- | ----------------------------- |
| Admin panels   | High       | Management interface exposure |
| Test/staging   | High       | Often has weaker controls     |
| API endpoints  | Variable   | Data access surface           |
| Legacy systems | High       | Outdated software likely      |
| Development    | High       | Incomplete security controls  |

**Risk scoring:**

```
+5  admin panel with no auth
+5  test environment reachable
+3  dev server public
+3  database admin interface
+2  orphaned subdomain pointing to IP
```

### Phase 3 — Dork Execution

Systematic search for unintentionally exposed information.

**Configuration and backup files:**

```
/dork site:{{domain}} ext:env OR ext:config OR ext:ini
/dork site:{{domain}} (backup.zip OR dump.sql OR .git)
/dork site:{{domain}} ext:bak OR ext:old
```

**Sensitive documents:**

```
/dork site:{{domain}} filetype:pdf "confidential"
/dork site:{{domain}} filetype:xls OR filetype:xlsx
/dork site:{{domain}} "@{{domain}}" filetype:txt
```

**Vulnerability indicators:**

```
/dork site:{{domain}} inurl:admin OR inurl:wp-admin
/dork site:{{domain}} "error" "sql syntax"
/dork site:{{domain}} intitle:"error" "stack trace"
```

**Dork priority tiers:**

| Priority | Finding                       | Response        |
| -------- | ----------------------------- | --------------- |
| P0       | Database dump accessible      | Immediate alert |
| P0       | Admin panel unprotected       | Immediate alert |
| P1       | Source code (.git) reachable  | Urgent          |
| P1       | Backup files accessible       | Urgent          |
| P2       | Config files with credentials | High            |
| P3       | Directory listing enabled     | Medium          |

### Phase 4 — Technology Fingerprinting

Identify stack versions for CVE matching.

```
/tech-detect {{domain}}
/sweep {{domain}} --server-version
/sweep {{domain}} --third-party
```

**Technology risk matrix:**

| Component        | Check            | Vulnerability Source      |
| ---------------- | ---------------- | ------------------------- |
| Web server       | Version exposed? | CVE database              |
| CMS              | Core version     | WPScan / advisories       |
| Framework        | Detect version   | NPM / composer audit      |
| Database         | Port exposed?    | Default credentials check |
| Language runtime | Version?         | Known CVEs                |

### Phase 5 — Header & TLS Assessment

```
/security-headers {{domain}}
/ssl-check {{domain}}
/certificate-info {{domain}}
```

**Headers checklist:**

| Header                    | Required    | Risk if Missing   |
| ------------------------- | ----------- | ----------------- |
| Content-Security-Policy   | Yes         | XSS exposure      |
| Strict-Transport-Security | Yes         | Downgrade attacks |
| X-Frame-Options           | Yes         | Clickjacking      |
| X-Content-Type-Options    | Yes         | MIME sniffing     |
| Referrer-Policy           | Yes         | Data leakage      |
| Permissions-Policy        | Recommended | Feature abuse     |

**TLS requirements:**

```
Required:   TLS 1.2+ · forward secrecy · HSTS
Acceptable: TLS 1.3 only
Prohibited: TLS 1.1 · TLS 1.0 · SSLv3 · weak ciphers
```

### Phase 6 — Risk Scoring

**Category weights:**

| Category                | Weight |
| ----------------------- | ------ |
| Infrastructure          | 20%    |
| Exposure                | 25%    |
| Technology currency     | 20%    |
| Vulnerabilities         | 25%    |
| Security responsiveness | 10%    |

**Grade scale:**

| Score  | Grade | Status    |
| ------ | ----- | --------- |
| 90–100 | A     | Excellent |
| 80–89  | B     | Good      |
| 70–79  | C     | Fair      |
| 60–69  | D     | Poor      |
| < 60   | F     | Critical  |

### Phase 7 — Remediation Roadmap

```
Critical — Immediate:
  !! [issue]: [risk description]
     Fix: [specific action]
     Effort: [time estimate]

High — Within 7 days:
  ⚠ [issue]: [risk description]
     Fix: [specific action]

Medium — Within 30 days:
  — [issue]: [description]
     Fix: [action]
```

**Standard roadmap structure:**

| Timeframe  | Action Items                                        |
| ---------- | --------------------------------------------------- |
| Immediate  | Critical: exposed data, unauth admin panels         |
| This week  | High: outdated software, missing core headers       |
| This month | Medium: error handling, orphaned subdomains         |
| Ongoing    | Monitoring schedule, patch process, staff awareness |

---

## Ethical Guidelines

```
You must:
  ✓ Hold written authorization to scan
  ✓ Use findings for defensive purposes only
  ✓ Disclose vulnerabilities responsibly

You must not:
  ✗ Exploit any vulnerability found
  ✗ Access systems beyond agreed scope
  ✗ Publicly disclose without consent

Found a vulnerability in a system you don't own?
  Contact the organization privately.
  Allow reasonable remediation time.
  Do not demand payment.
```

---

## Report Export

```
/case-report export pdf --executive   — 1-page summary
/case-report export pdf --technical   — full findings
/case-report export csv               — vulnerability tracking sheet
/case-report export remediation       — action items only
```

---

## Related Files

- `experience/guided-flows/flow-domain-sweep.md` — interactive version
- `techniques/domain-intelligence.md` — manual sweep techniques
- `analysis/vulnerability-scoring.md` — CVSS scoring reference
