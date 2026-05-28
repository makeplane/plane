# Dependency & Supply Chain Audit Module

> **Module ID:** DEP-AUD-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Framework, Package, and Toolchain Security Assessment

---

## 1. Overview

Audits project dependencies, frameworks, language runtimes, and dev tools for known vulnerabilities (CVEs), security anti-patterns, and supply chain risks. Goes beyond simple `npm audit` — covers framework-specific vulns, supply chain attack indicators, and CI/CD security.

**When to use:** Target org's GitHub repos are discoverable, tech stack identified via job postings or fingerprinting, or client requests dependency security review.

**Ethical boundary:** Only audit code and configurations the user provides or has authorized access to.

---

## 2. Tool Inventory

| Priority  | Tool                               | Ecosystem                | Install                                               |
| --------- | ---------------------------------- | ------------------------ | ----------------------------------------------------- |
| Primary   | `npm audit`                        | Node.js/JS               | Built-in with npm                                     |
| Primary   | `pip-audit`                        | Python                   | `pip3 install pip-audit`                              |
| Primary   | `bundle audit`                     | Ruby                     | `gem install bundler-audit`                           |
| Primary   | `govulncheck`                      | Go                       | `go install golang.org/x/vuln/cmd/govulncheck@latest` |
| Primary   | `cargo audit`                      | Rust                     | `cargo install cargo-audit`                           |
| Secondary | `composer audit`                   | PHP                      | Built-in with Composer                                |
| Secondary | `dotnet list package --vulnerable` | .NET                     | Built-in with dotnet                                  |
| Secondary | Trivy                              | Multi-ecosystem + Docker | `apt install -y trivy`                                |
| Secondary | Docker Scout                       | Container images         | `docker scout cves <image>`                           |
| Tertiary  | WPScan                             | WordPress                | `gem install wpscan`                                  |

---

## 3. Investigation Workflow

```
1. Inventory — catalog all package manifests, frameworks, runtimes, IaC, CI/CD
2. Automated audit — run ecosystem-specific audit tools (parallel where possible)
3. Framework-specific vulns — check for known patterns per framework
4. Supply chain risks — dependency confusion, typosquatting, malicious packages
5. Dev tool & CI/CD security — GitHub Actions, Docker, Terraform patterns
6. Correlate and prioritize by exploitability and blast radius
```

---

## 4. Package Manifest Detection

```
Node/JS:    package.json, package-lock.json, yarn.lock, pnpm-lock.yaml
Python:     requirements.txt, Pipfile.lock, pyproject.toml, poetry.lock
Ruby:       Gemfile, Gemfile.lock
Go:         go.mod, go.sum
Rust:       Cargo.toml, Cargo.lock
Java:       pom.xml, build.gradle
PHP:        composer.json, composer.lock
.NET:       *.csproj, packages.config
```

---

## 5. Automated Audit Commands

```bash
# Node.js
npm audit --json

# Python
pip-audit
# or: safety check

# Ruby
bundle audit

# Go
govulncheck ./...

# Rust
cargo audit

# PHP
composer audit

# .NET
dotnet list package --vulnerable

# Docker / Container
docker scout cves <image>
trivy image <image>

# General filesystem scan
trivy fs .
```

---

## 6. Framework-Specific Vulnerability Patterns

### Next.js / React

- Server Actions exposing internal endpoints (CVE-2025-29927 middleware bypass)
- `dangerouslySetInnerHTML` without sanitization
- SSRF through `next/image` with unrestricted domains
- `.env` files in public directory or `NEXT_PUBLIC_` prefix leaking secrets
- Middleware auth bypass — check middleware.ts matches all protected routes
- Server Component / Client Component boundary leaking server-only data

### Django

- `DEBUG=True` in production
- `ALLOWED_HOSTS` wildcard `*`
- Missing CSRF middleware or `@csrf_exempt` on state-changing views
- Raw SQL via `extra()`, `raw()`, `RawSQL` without parameterization
- Pickle deserialization in sessions (use JSON serializer)
- Secret key committed to source control

### Rails

- Mass assignment without strong parameters
- SQL injection via `where("column = '#{input}'")`
- Unpatched Action Pack, Action View, Active Record CVEs
- Insecure deserialization in cookies (verify secret_key_base rotation)
- CSRF token bypass in API-only mode

### Express / Node.js

- Prototype pollution through `Object.assign`, `lodash.merge`, `deep-extend`
- ReDoS in validation patterns
- Path traversal through `req.params` in file serving routes
- Missing rate limiting on auth endpoints
- `eval()` or `Function()` with user input
- Event loop blocking with synchronous operations

### Spring / Java

- Spring4Shell and related RCE vulnerabilities
- Deserialization attacks (Java native serialization, Jackson polymorphic types)
- SpEL injection in Spring Expression Language
- Missing CSRF protection on state-changing endpoints
- Actuator endpoints exposed without authentication

### Laravel / PHP

- `APP_DEBUG=true` in production (leaks env vars in error pages)
- SQL injection via raw DB queries without bindings
- Mass assignment without `$fillable` / `$guarded`
- File upload without type validation (PHP execution via uploaded .php)
- Insecure deserialization in queued jobs

### WordPress

- Outdated core, theme, or plugin versions (most common attack vector)
- File editor enabled in wp-admin (code injection if admin compromised)
- XML-RPC enabled (brute force amplification, SSRF)
- Default admin username, weak passwords
- Unpatched plugin vulnerabilities (check WPScan database)

---

## 7. Supply Chain Risk Indicators

### Dependency Confusion / Substitution

- Private package names claimable on public registries
- Missing `.npmrc` or `pip.conf` scoping to private registry
- No lockfile integrity verification

### Typosquatting

- Package names close to popular package misspellings
- Recently published packages with very few downloads
- Packages that changed ownership recently

### Malicious Packages

- Postinstall scripts making network requests or executing code
- Packages with obfuscated code
- Excessive permission requests relative to functionality

### Maintenance Risk

- Unmaintained packages (no commits in 2+ years, archived repos)
- Single-maintainer packages for critical functionality
- Packages with known but unpatched vulnerabilities

### Lockfile Integrity

- Lockfile committed to source control?
- CI installs from lockfile (`npm ci`, `pip3 install --require-hashes`)?
- Integrity hashes present and verified?

---

## 8. Dev Tool & CI/CD Security Patterns

### GitHub Actions

- `pull_request_target` trigger with checkout of PR code (code injection risk)
- Secrets accessible in forked PR workflows
- Unpinned action versions (`@main` vs `@v4.1.0` or SHA pin)
- Script injection via `${{ github.event.issue.title }}` in `run:` blocks

### Docker

- Running as root (missing `USER` directive)
- Base image with known CVEs
- Secrets baked into image layers (visible via `docker history`)
- `latest` tag instead of pinned version

### Terraform / IaC

- Hardcoded secrets in `.tf` files
- Unpinned provider versions
- Missing state file encryption
- Over-permissive IAM in provider configuration

---

## 9. Output Format

```markdown
# Dependency & Stack Security Audit

## Project: [name]

## Stack: [language, framework, key tools]

## Date: [date]

### Stack Inventory

| Component | Version | Latest | Status |
| --------- | ------- | ------ | ------ |

### Known Vulnerabilities (CVEs)

| Package | Installed | Vuln | Severity | CVE | Fix Version |
| ------- | --------- | ---- | -------- | --- | ----------- |

### Framework-Specific Issues

#### [SEVERITY] [Title]

**Component:** [framework/tool name and version]
**Issue:** [description]
**Evidence:** [code or config snippet]
**Remediation:** [specific fix]

### Supply Chain Risks

| Risk | Package/Component | Details | Remediation |
| ---- | ----------------- | ------- | ----------- |

### Dev Tool / CI Security

| Tool | Issue | Severity | Remediation |
| ---- | ----- | -------- | ----------- |

### Prioritized Action Plan

1. [Critical — actively exploited CVEs, RCE vulnerabilities]
2. [High — known CVEs with public exploits, supply chain risks]
3. [Medium — framework misconfigs, outdated dependencies]
4. [Low — maintenance risks, best practice improvements]
```

---

## 10. References

- OWASP Dependency-Check
- National Vulnerability Database (NVD)
- GitHub Advisory Database
- Snyk Vulnerability Database
- SLSA (Supply-chain Levels for Software Artifacts) framework
