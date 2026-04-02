# Security Testing Overview

## OWASP Top 10 (2024)

| Rank | Vulnerability | Testing Method |
|------|--------------|----------------|
| A01 | Broken Access Control | Test unauthorized actions across roles |
| A02 | Cryptographic Failures | Check HTTPS, encryption algorithms |
| A03 | Injection (SQL/NoSQL/Cmd) | Test with payloads (see vulnerability-payloads.md) |
| A04 | Insecure Design | Threat modeling, abuse case testing |
| A05 | Security Misconfiguration | Default creds, open ports, headers |
| A06 | Vulnerable Components | npm audit, Snyk scanning |
| A07 | Auth Failures | Brute force, session hijacking |
| A08 | Integrity Failures | Deserialization, CI/CD security |
| A09 | Logging Failures | Verify security event logging |
| A10 | SSRF | Test internal URL access |

## Security Testing Types

### SAST (Static Analysis)
- **When**: Early development, pre-commit
- **Tools**: SonarQube, CodeQL, Semgrep
- **Focus**: Code flaws without execution
- **Limitation**: High false positives

### DAST (Dynamic Analysis)
- **When**: QA/staging, running application
- **Tools**: OWASP ZAP, Burp Suite, Nuclei
- **Focus**: Runtime vulnerabilities
- **Limitation**: Requires running app

### SCA (Dependency Scanning)
- **Tools**: npm audit, Snyk, Dependabot
- **Focus**: Known CVEs in dependencies
- **Automation**: CI/CD integration

### Secret Detection
- **Tools**: detect-secrets, GitGuardian
- **Focus**: API keys, passwords in code
- **Implementation**: Pre-commit hooks

## Quick Security Scan

```bash
# Dependency vulnerabilities
npm audit
npx snyk test

# OWASP ZAP baseline scan
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://example.com

# Nuclei template scan
nuclei -u https://example.com -t cves/

# Check security headers
curl -I https://example.com | grep -i "security\|content-security\|x-"
```

## Penetration Testing Phases

1. **Reconnaissance**: DNS, WHOIS, tech fingerprinting
2. **Scanning**: Port scan, service enumeration
3. **Vulnerability Assessment**: Automated + manual testing
4. **Exploitation**: Verify findings, demonstrate impact
5. **Reporting**: CVSS scores, remediation guidance

## Tools Comparison

| Tool | Type | Cost | Best For |
|------|------|------|----------|
| OWASP ZAP | DAST | Free | CI/CD, learning |
| Burp Suite | DAST | Paid | Enterprise, detailed |
| Nuclei | DAST | Free | Custom checks |
| npm audit | SCA | Free | Node.js deps |
| Snyk | SCA | Free/Paid | Multi-language |

## CI/CD Integration

```yaml
# Security scanning in pipeline
- name: Dependency Scan
  run: npm audit --audit-level=high

- name: SAST Scan
  uses: github/codeql-action/analyze@v3

- name: DAST Scan
  run: |
    docker run -v $(pwd):/zap/wrk:rw ghcr.io/zaproxy/zaproxy:stable \
      zap-api-scan.py -t http://localhost:3000/openapi.json -f openapi
```
