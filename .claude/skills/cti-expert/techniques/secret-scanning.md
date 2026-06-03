# Secret Scanning Module

> **Module ID:** SEC-SCAN-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Exposed Credential & API Key Discovery

---

## 1. Overview

Scans public repositories and web sources for accidentally committed secrets: API keys, tokens, passwords, private keys, and service credentials.

**When to use:** Org/repo reconnaissance, security posture checks, pre-engagement recon, authorized red-team asset discovery.

**Ethical boundary:** Never use discovered credentials for unauthorized access. Responsible disclosure is mandatory.

---

## 2. Tool Inventory

| Priority  | Tool         | Purpose                           | Install                                                               |
| --------- | ------------ | --------------------------------- | --------------------------------------------------------------------- |
| Primary   | TruffleHog   | 800+ detectors, auto-verification | `pip3 install trufflehog` or `docker pull trufflesecurity/trufflehog` |
| Secondary | Gitleaks     | Regex + entropy scanning          | `brew install gitleaks` / download from GitHub releases               |
| Tertiary  | GitDorker    | GitHub dork API queries           | `git clone https://github.com/obheda12/GitDorker`                     |
| Manual    | Google Dorks | Web-based public repo search      | No install — browser-based                                            |

---

## 3. Investigation Workflow

```
1. Identify target scope (org name, domain, repo URLs)
2. Run TruffleHog on known repos (--verified-only for actionable results)
3. Run Gitleaks on cloned repos for broader entropy-based coverage
4. Use GitDorker for GitHub search API across org
5. Apply manual Google dorks for web-exposed secrets
6. Deduplicate findings, classify severity
7. Document and prepare responsible disclosure report
```

---

## 4. CLI Commands & Expected Output

### TruffleHog — single repo scan

```bash
trufflehog github --repo=https://github.com/<org>/<repo> --json
```

**Verified secrets only (reduce false positives):**

```bash
trufflehog github --repo=https://github.com/<org>/<repo> --only-verified --json
```

**Org-wide scan:**

```bash
trufflehog github --org=<org_name> --only-verified --json 2>/dev/null | tee trufflehog-results.json
```

**Expected output (JSON):**

```json
{
  "SourceMetadata": {
    "Data": { "Github": { "repository": "...", "commit": "abc123", "file": "config.py", "line": 42 } }
  },
  "DetectorName": "AWS",
  "Verified": true,
  "Raw": "AKIA..."
}
```

### Gitleaks — cloned repo scan

```bash
git clone https://github.com/<org>/<repo> /tmp/target-repo
gitleaks detect --source=/tmp/target-repo --report-format=json --report-path=gitleaks-report.json
```

**Scan git history:**

```bash
gitleaks detect --source=/tmp/target-repo --log-opts="--all" --report-format=json --report-path=gitleaks-history.json
```

**Expected output:**

```json
[
  {
    "RuleID": "generic-api-key",
    "Commit": "abc123",
    "File": "src/config.js",
    "StartLine": 15,
    "Secret": "sk-...",
    "Author": "dev@example.com",
    "Date": "2024-01-10T09:22:00Z"
  }
]
```

### GitDorker — GitHub search API

```bash
cd GitDorker
python3 GitDorker.py -tf tokens.txt -q <domain.com> -d dorks/BHIS_toplevel_dorks.txt -o gitdorker-output.txt
```

**Requires:** Free GitHub token in `tokens.txt`

### Manual Google Dorks

```
site:github.com "<domain.com>" password OR api_key OR secret
site:github.com "<domain.com>" "BEGIN RSA PRIVATE KEY"
site:github.com "<domain.com>" "Authorization: Bearer"
site:github.com "<org_name>" ".env" OR "config.json" password
site:github.com "<domain.com>" "db_password" OR "database_url"
```

---

## 5. Fallback Cascade

```
TruffleHog unavailable
  → Use Gitleaks (install from GitHub releases, no pip needed)

Gitleaks unavailable
  → Clone repo manually + grep patterns:
    grep -rE "(api_key|secret|password|token)\s*[=:]\s*['\"][^'\"]{8,}" /tmp/target-repo

GitHub API rate-limited
  → Use unauthenticated Google dorks
  → Use Sourcegraph: https://sourcegraph.com/search?q=<domain>+api_key

No tool available
  → Manual dork via browser:
    https://github.com/search?q=<domain>+api_key&type=code
```

---

## 6. Output Interpretation

**TruffleHog `Verified: true`** — credential tested against live API and confirmed valid. Treat as critical.

**TruffleHog `Verified: false`** — pattern matched but liveness unconfirmed. May be rotated or test data.

**Gitleaks findings in commit history** — even if removed from HEAD, credentials may still be valid. Check rotation date.

**Entropy score** — Gitleaks uses Shannon entropy. High entropy (>4.5) strings in assignments signal random keys. Lower entropy = likely human-readable (passwords, not tokens).

---

## 7. Confidence Ratings

| Finding Type                | Confidence | Notes                      |
| --------------------------- | ---------- | -------------------------- |
| TruffleHog verified=true    | CRITICAL   | Live credential confirmed  |
| TruffleHog verified=false   | MEDIUM     | May be rotated/test        |
| Gitleaks high entropy match | MEDIUM     | Needs manual review        |
| Gitleaks rule-based match   | MEDIUM     | Context-dependent          |
| Google dork — config file   | HIGH       | Context-dependent validity |
| GitDorker match             | MEDIUM     | Requires manual validation |

---

## 8. Limitations

- **TruffleHog verification** makes live API calls — may trigger security alerts at target
- **Rate limits:** GitHub Search API — 30 req/min (authenticated), 10/min (unauthenticated)
- **History gaps:** Force-pushed commits or repo deletions hide secrets from scanners
- **False positives:** Test credentials, placeholder values, example code inflate counts
- **Private repos:** Not accessible without credentials — public surface only
- **Rotation lag:** Credentials may appear in history but already rotated
- **TruffleHog docker** recommended over pip for latest detector rules

---

## 9. Command Reference

### `/secrets [target]`

**Input:** GitHub org name, repo URL, or domain
**Process:**

1. Run TruffleHog org scan with `--only-verified`
2. Clone top repos, run Gitleaks with `--log-opts="--all"`
3. Apply GitDorker with standard dork list
4. Deduplicate, classify by severity

**Severity Classification:**

- **Critical** — verified live credential (cloud keys, DB passwords, payment tokens)
- **High** — unverified match for high-value service (Stripe, AWS, GitHub PAT)
- **Medium** — generic API key or password, requires manual confirmation
- **Low** — partial match, test/example data, public keys only

**Output:** Sorted finding list with file, line, commit, secret type, severity, and responsible disclosure notes.

---

**Responsible Disclosure Reminder:**
If live credentials are found during authorized assessment, notify the asset owner privately before any further action. Do not exfiltrate, use, or publicly disclose active credentials.

---

_Secret Scanning Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized security assessment and educational purposes only_
