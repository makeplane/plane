---
name: ck:security-scan
description: "Scan codebase for security vulnerabilities, hardcoded secrets, dependency issues, and OWASP patterns. Use when asked to 'security scan', 'check for secrets', 'audit security', or before major releases."
argument-hint: "[scope] [--secrets-only] [--deps-only] [--full]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Security Scan

Lightweight security scanner using Claude's reasoning + shell tools. No external dependencies required.

## Usage

```
/ck:security-scan              # Full scan of current project
/ck:security-scan --secrets-only   # Only secret/credential detection
/ck:security-scan --deps-only      # Only dependency audit
/ck:security-scan src/api/         # Scan specific directory
```

## Scan Categories

| Category | Method | Speed | Reference |
|----------|--------|-------|-----------|
| Secrets | Grep regex patterns | Fast | `references/secret-patterns.md` |
| Dependencies | `npm audit` / `pip audit` | Medium | Built-in |
| Code patterns | Grep + Claude analysis | Medium | `references/vulnerability-patterns.md` |

## Workflow

### 1. Detect Project Type

```
- Check for package.json → Node.js
- Check for requirements.txt / pyproject.toml → Python
- Check for go.mod → Go
- Check for Cargo.toml → Rust
```

### 2. Secret Scanning (Always runs first)

Load `references/secret-patterns.md` for regex patterns.

Use Grep tool to search for each pattern category:
- API keys and tokens (AWS, GitHub, Stripe, etc.)
- Private keys and certificates
- Database connection strings with credentials
- Hardcoded passwords in code

**Exclude**: `.env.example`, test fixtures, documentation, `node_modules/`, `dist/`

For each match:
- Verify it's a real secret (not a placeholder like `YOUR_API_KEY`)
- Rate severity: CRITICAL (exposed prod key), HIGH (real credential), MEDIUM (possible credential)

### 3. Dependency Audit (If applicable)

Run the appropriate command:
```bash
# Node.js
npm audit --json 2>/dev/null || echo '{"error":"npm audit failed"}'

# Python (if pip-audit available)
pip audit --format json 2>/dev/null || echo '{"error":"pip audit unavailable"}'
```

Parse output, categorize by severity (critical/high/moderate/low).

### 4. Code Pattern Analysis

Load `references/vulnerability-patterns.md` for patterns.

Use Grep tool to search for dangerous patterns:
- SQL injection (string concatenation in queries)
- XSS (innerHTML, dangerouslySetInnerHTML without sanitization)
- Command injection (exec/spawn with unsanitized input)
- Path traversal (user input in file paths)
- Insecure randomness (Math.random for security)
- eval() / Function() with dynamic input

For each match:
- Read surrounding code context (5-10 lines)
- Use Claude reasoning to determine if it's a real vulnerability or false positive
- Rate severity and suggest fix

### 5. .env Exposure Check

```bash
# Check if .env files are tracked by git
git ls-files --error-unmatch .env .env.local .env.production 2>/dev/null
# Check .gitignore for .env patterns
grep -n "\.env" .gitignore 2>/dev/null
```

### 6. Generate Report

Output a markdown report directly in chat:

```markdown
# Security Scan Report

**Project:** {name}
**Scanned:** {date}
**Files checked:** {count}

## Summary
| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Secrets  | X | X | X | - |
| Deps     | X | X | X | X |
| Code     | X | X | X | - |

## Findings

### CRITICAL
1. **[SECRET]** Hardcoded AWS key in `src/config.js:42`
   - Pattern: `AKIA[0-9A-Z]{16}`
   - Fix: Move to environment variable

### HIGH
...

## Recommendations
1. ...
```

If `--auto` mode active in cook workflow: save report to `{CK_REPORTS_PATH}` or `plans/reports/security-scan-{date}.md`.

## Scope Declaration

This skill handles: Secret detection, dependency auditing, common vulnerability patterns.
This skill does NOT handle: Penetration testing, runtime security analysis, infrastructure security, compliance audits.

## Security Policy

- NEVER output actual secret values in reports — redact to first 4 + last 2 chars
- NEVER execute secrets or credentials found during scanning
- NEVER modify code automatically — only report findings with fix suggestions
- If a real credential is found, recommend immediate rotation
