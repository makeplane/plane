# OWASP Source Code Audit Module

> **Module ID:** OWA-AUD-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Application Security Review Against OWASP Top 10

---

## 1. Overview

Systematic security audit of application source code against the OWASP Top 10 (2021). Uses grep-pattern scanning followed by manual code review for each vulnerability category. Produces findings with CWE references and prioritized remediation.

**When to use:** Source code access during authorized assessment, code review engagement, or when target's public repos are discoverable.

**Ethical boundary:** Only audit code the user provides. Provide fixes, not exploits. Flag low-confidence findings as "Potential."

---

## 2. Tool Inventory

| Priority  | Tool                      | Purpose                          | Install                             |
| --------- | ------------------------- | -------------------------------- | ----------------------------------- |
| Primary   | `grep` / `rg`             | Pattern scanning across codebase | Built-in / `apt install -y ripgrep` |
| Primary   | Semgrep                   | AST-aware static analysis        | `pip3 install semgrep`              |
| Secondary | `npm audit` / `pip-audit` | Dependency CVE check             | Per ecosystem                       |
| Tertiary  | Bandit                    | Python-specific security linter  | `pip3 install bandit`               |
| Tertiary  | Brakeman                  | Rails-specific security scanner  | `gem install brakeman`              |

---

## 3. Scoping Workflow

```
1. Identify language, framework, architecture
2. Map entry points (routes, API handlers, form processors)
3. Identify data flows (user input -> processing -> storage -> output)
4. Locate authentication and authorization boundaries
5. Audit each OWASP category with grep patterns + manual review
6. Generate findings with severity, CWE, evidence, remediation
```

---

## 4. OWASP Top 10 (2021) Audit Checklist

### A01: Broken Access Control

- Missing authorization checks on endpoints or routes
- IDOR — user-controlled IDs without ownership verification
- Missing CSRF protections on state-changing requests
- Role checks only on frontend, not enforced server-side

**Grep patterns:**

```
req.params.id, req.query.id (without ownership check)
@csrf_exempt, csrf: false
role check in frontend JS only
```

### A02: Cryptographic Failures

- Hardcoded secrets, API keys, or passwords in source
- Weak hashing (MD5, SHA1 for passwords — should be bcrypt/argon2/scrypt)
- Sensitive data in logs, URLs, or localStorage
- Missing encryption at rest or in transit

**Grep patterns:**

```
password, secret, api_key, private_key, MD5, SHA1, base64
localStorage.setItem("token"
```

### A03: Injection

- **SQL injection:** raw queries with string concatenation
- **NoSQL injection:** unsanitized input in MongoDB queries
- **Command injection:** `exec()`, `spawn()`, `system()` with user input
- **XSS:** unescaped user input in HTML, `dangerouslySetInnerHTML`, `v-html`
- **Template injection:** user input in template literals

**Grep patterns:**

```
exec(, eval(, innerHTML, dangerouslySetInnerHTML, $where
system(, popen(, subprocess.call(
f"SELECT, "SELECT.*" + , query(f"
```

### A04: Insecure Design

- Authentication flows with logic flaws
- Missing rate limiting on sensitive endpoints (login, password reset, API)
- Business logic constraints only enforced client-side

### A05: Security Misconfiguration

- Debug mode enabled in production configs
- Overly permissive CORS (`Access-Control-Allow-Origin: *`)
- Missing HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Default credentials or configurations shipped
- Verbose error messages exposing stack traces

**Grep patterns:**

```
DEBUG = True, debug: true
Access-Control-Allow-Origin: *
X-Frame-Options (missing)
```

### A06: Vulnerable Components

- Run ecosystem-specific audit tools (`npm audit`, `pip-audit`, etc.)
- Check lock files for known vulnerable versions
- Flag dependencies with critical CVEs

### A07: Authentication Failures

- Weak password policies
- Session management issues (missing secure/httpOnly flags, no expiry, no rotation)
- Missing rate limiting on login (credential stuffing risk)
- Broken password reset flows

### A08: Data Integrity Failures

- Unsafe deserialization of user input
- Missing integrity checks on CI/CD pipelines
- No lockfile integrity verification (SRI hashes)

**Grep patterns:**

```
pickle.loads, yaml.load(, unserialize(, JSON.parse(untrusted
ObjectInputStream
```

### A09: Logging & Monitoring Failures

- Auth events not logged (login, failure, privilege changes)
- Sensitive data written to logs (passwords, tokens, PII)
- No alerting on suspicious patterns

### A10: SSRF

- User-controlled URLs passed to server-side HTTP requests
- Missing URL validation and allowlisting

**Grep patterns:**

```
fetch(req., axios(req., http.get(user_input
urllib.request.urlopen(, requests.get(user_
```

---

## 5. Output Format

```markdown
# Security Audit Report

## Project: [name]

## Stack: [technologies]

## Date: [date]

### Summary

- Total findings: X
- Critical: X | High: X | Medium: X | Low: X | Info: X

### Findings

#### [SEVERITY] A0X: [Title]

**File:** `path/to/file.ts:42`
**CWE:** CWE-XXX
**Description:** [what the vulnerability is and why it matters]
**Vulnerable Code:** [snippet]
**Remediation:** [fixed code with explanation]

### Prioritized Remediation Plan

1. [Critical fixes — immediate]
2. [High fixes — this week]
3. [Medium/Low — scheduled]
```

---

## 6. References

- OWASP Top 10 (2021)
- OWASP Code Review Guide
- CWE Top 25 Most Dangerous Software Weaknesses
- SANS Top 25
