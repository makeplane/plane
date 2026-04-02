---
name: ck:security
description: "STRIDE + OWASP-based security audit with optional auto-fix. Scans code for vulnerabilities, categorizes by severity, and can iteratively fix findings using ck:autoresearch pattern."
argument-hint: "<scope glob or 'full'> [--fix] [--iterations N]"
metadata:
  author: claudekit
  attribution: "Security audit pattern adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "1.0.0"
---

# ck:security — Security Audit

Runs a structured STRIDE + OWASP security audit on a given scope. Produces a severity-ranked findings report. With `--fix`, applies fixes iteratively using the ck:autoresearch guard pattern.

## When to Use

- Before a release or major deployment
- After adding auth, payment, or data-handling features
- Periodic security review (monthly/quarterly)
- Compliance check (SOC 2, GDPR, PCI-DSS prep)

## When NOT to Use

- Purely cosmetic changes (CSS, copy edits)
- No user-facing code or data handling involved

---

## Modes

| Mode | Invocation | Behavior |
|------|-----------|----------|
| Audit only | `/ck:security <scope>` | Scan → categorize → report |
| Audit + Fix | `/ck:security <scope> --fix` | Scan → categorize → fix iteratively |
| Bounded fix | `/ck:security <scope> --fix --iterations N` | Limit fix iterations to N |

---

## Audit Methodology

### 1. Scope Resolution
Expand the provided glob or `full` keyword into a file list. Read all in-scope files before analysis.

### 2. STRIDE Analysis
Evaluate each threat category systematically:
- **S**poofing — identity/authentication weaknesses
- **T**ampering — input validation, integrity controls
- **R**epudiation — audit logging gaps
- **I**nformation Disclosure — data leakage, secret exposure
- **D**enial of Service — rate limits, resource exhaustion
- **E**levation of Privilege — broken access control, RBAC gaps

### 3. OWASP Top 10 Check
Map findings to OWASP categories (A01–A10). See `references/stride-owasp-checklist.md` for per-category checks.

### 4. Dependency Audit
Run the appropriate package audit tool for the detected stack:
- Node.js: `npm audit`
- Python: `pip-audit`
- Go: `govulncheck`
- Ruby: `bundle audit`

### 5. Secret Detection
Scan for hardcoded API keys, passwords, tokens, and private keys using regex patterns. See `references/stride-owasp-checklist.md` → Secret Patterns.

### 6. Finding Categorization
Assign each finding a severity level (see Severity Definitions below).

---

## Output Format

```
## Security Audit Report

### Summary
- Files scanned: N
- Findings: X critical, Y high, Z medium, W low, V info

### Findings

| # | Severity | Category | File:Line | Description | Fix Recommendation |
|---|----------|----------|-----------|-------------|-------------------|
| 1 | Critical  | Injection | api/users.ts:45 | SQL string concatenation | Use parameterized queries |
| 2 | High      | Auth      | auth/login.ts:12 | No rate limiting | Add express-rate-limit |
```

---

## Fix Mode (--fix)

When `--fix` is provided, apply fixes iteratively after the audit:

1. Sort all findings by severity (Critical → High → Medium → Low)
2. For each finding:
   a. Apply one targeted fix
   b. Run guard (tests or lint) to verify no regression
   c. Commit: `security(fix-N): <short description>`
   d. Advance to next finding
3. Stop early if guard fails — report the failure instead of proceeding
4. Uses `ck:autoresearch` guard pattern for regression prevention

> Tip: Use `--iterations N` to cap total fix iterations when scope is large.

---

## Severity Definitions

| Severity | Description | Fix Priority |
|----------|-------------|-------------|
| Critical | Exploitable now, data breach or RCE risk | Immediate — block release |
| High | Exploitable with moderate effort, significant impact | This sprint |
| Medium | Limited exploitability or impact | Next sprint |
| Low | Theoretical risk, defense-in-depth improvement | Backlog |
| Info | Best practice suggestion, no direct risk | Optional |

---

## Integration with Other Skills

- Run after `ck:predict` when the security persona flags concerns
- Feed Critical/High findings into `ck:autoresearch --fix` for automated remediation
- Use `ck:scenario` with `--focus authorization` for deeper auth flow testing
- Pair with `ck:plan` to schedule Medium/Low findings as sprint tasks

---

## Example Invocations

```bash
# Audit API layer only
/ck:security src/api/**/*.ts

# Audit entire src/ and auto-fix, max 15 iterations
/ck:security src/ --fix --iterations 15

# Full codebase audit (no fix)
/ck:security full
```

---

See `references/stride-owasp-checklist.md` for the detailed per-category checklist and secret detection regex patterns.
