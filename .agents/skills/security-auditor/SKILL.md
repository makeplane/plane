---
name: Security Auditor
description: This skill should be used when the user asks to "run a security audit", "audit this codebase for security issues", "do a supply chain audit", "audit dependencies for security risk", "check for compromised packages", "produce a security audit report", "assess our security posture", "review our SBOM/license coverage", or needs a structured, repeatable process for scoping, running, and reporting on a security audit of a codebase, dependency tree, or system — as opposed to hunting a specific vulnerability class or running an authorized offensive engagement.
allowed-tools:
  - Bash
  - Read
metadata:
  author: "davila7 (consolidated from 3 upstream sources by Arsenal librarian)"
  version: "1.0"
---

# Security Auditor

## Purpose

The audit-methodology and governance layer for security work: how to scope a security audit, what to check, how to weigh findings, and how to report them — for a codebase, a dependency tree, or a system as a whole. This skill does not itself teach how to find a specific vulnerability class (SQL injection payloads, XSS bypass techniques, AD attack paths) — it teaches how to run the audit that decides what needs testing, and how to turn findings from any source into a usable report.

## Relationship to Other Security Skills (read this first — avoid overlap)

- **`review`'s Security Sweep** — an optional five-phase check run *inline*, scoped to a single diff/PR during code review (attack-surface mapping + OWASP-style checklist for the changed files only). Use `security-auditor` instead when the audit is not diff-scoped — a full codebase, a dependency tree, a release gate, or a periodic/compliance audit.
- **`pentest`** — authorized offensive security engagements: reconnaissance through exploitation through reporting, assuming written authorization and a defined attack scope. Use `security-auditor` to *decide the audit needs a pentest* and to fold pentest findings into a broader audit report; use `pentest` for the actual offensive playbook.
- **`security-testing`** — defensive vulnerability-class testing methodology (SQLi, XSS, IDOR, auth, API security, etc.) with payload catalogs and detection techniques. Use `security-auditor` to scope *which* vulnerability classes matter for this audit and where to route testing; use `security-testing` for the how-to-test-for-each-class playbook.
- **`security-auditor` (this skill)** — the layer above all three: structured audit scoping, checklist-driven review across code + dependencies + configuration + process, severity triage, and report generation. Delegates the deep how-to-find-X work to the skills above; owns the how-to-run-the-audit-and-report-it work itself.

## 1. Audit Methodology

### 1.1 Define Scope

Before starting, establish and write down:
- **Target**: a repository, a service, a dependency tree, a deployment pipeline, or the whole system
- **Trigger**: pre-deployment gate, periodic/scheduled audit, compliance requirement, incident-driven, or ad hoc user request
- **Boundaries**: what's explicitly in scope (e.g. `./services/api` only) and what's explicitly out (e.g. third-party SaaS the team doesn't control)
- **Depth**: quick pass (automated checks + spot review) vs. deep audit (full manual review + delegated pentest/security-testing engagements)
- **Audience for the report**: engineering team (technical detail), leadership (executive summary + risk), or compliance (checklist/evidence format)

### 1.2 Audit Checklist Areas

Run through each area that's in scope; skip areas explicitly out of scope and say so in the report rather than silently omitting them.

| Area | What to check | Delegate to |
|------|----------------|-------------|
| Code-level vulnerabilities | Injection, XSS, auth, IDOR, path traversal, API security | `security-testing` for methodology, `review`'s Security Sweep for diff-scoped checks, `security-code-reviewer` agent for a dedicated read-only subagent pass |
| Supply chain / dependencies | Known-compromised packages, unpinned versions, malicious install scripts, SBOM coverage, license risk | §2 below (this skill) |
| Secrets & credential hygiene | Hardcoded secrets, `.env` files tracked in git, overly broad credential scopes, missing rotation | grep for secret patterns; check `.gitignore` coverage; see §2.6 for CI/CD-specific checks |
| Access control & authz | Least-privilege on service accounts, CI/CD tokens, cloud IAM roles | manual review + `security-testing` §3 Authentication & Authorization |
| Configuration & infrastructure | TLS config, security headers, exposed admin endpoints, default credentials | `security-testing` §10 OWASP Reference |
| CI/CD pipeline security | Unpinned actions, `pull_request_target` misuse, secret exposure to third-party actions | §2.6 below |
| Logging & monitoring | Sufficient audit trail to detect and investigate an incident after the fact | manual review — no dedicated skill yet |
| Offensive validation (optional, deeper audits only) | Confirm exploitability of anything ambiguous | delegate to `pentest` with explicit scope/authorization |

### 1.3 Execute

1. Work through the checklist areas in scope, area by area — don't jump between areas mid-check, it's easy to lose track of what's been covered.
2. For each finding: what was detected, why it matters (impact), how to verify it (reproduction steps or evidence), and the exact remediation.
3. Note explicitly what was checked and came back clean, not just what's broken — a report of only findings looks incomplete and invites "did you actually check X?" follow-up.
4. If an area needs specialist depth beyond this skill's own checklist (a specific vuln class, an offensive test), delegate to `security-testing` or `pentest` and fold the results back in as findings under the relevant checklist area — don't duplicate their methodology here.

### 1.4 Severity & Triage

Use four tiers consistently across every finding:

- **CRITICAL** — actively exploitable, high impact (data breach, RCE, full compromise) — fix immediately, block release
- **HIGH** — exploitable with some effort or requires specific conditions — fix this sprint
- **MEDIUM** — real risk but limited impact or requires privileged access already — schedule
- **LOW** — best-practice gap, defense-in-depth, no direct exploitation path found — track, nice to have

End every audit with an action plan grouped by tier: **Fix now / Fix this sprint / Monitor / Nice to have** — mirrors the severity tiers directly so the reader doesn't have to re-derive priority from raw findings.

### 1.5 Report

A security audit report should include:
1. **Scope statement** — what was and wasn't covered (from 1.1)
2. **Executive summary** — a few sentences, no jargon, for a non-technical audience: overall posture, most important findings, whether it's safe to proceed
3. **Findings**, grouped by checklist area, each with severity/impact/verification/remediation
4. **Clean checks** — what was reviewed and found fine (from 1.3.3)
5. **Action plan** by tier (from 1.4)
6. **Re-audit trigger** — when this should be run again (next release, next quarter, after remediation, etc.)

---

## 2. Supply Chain Audit

Software supply chain risk — dependency vulnerabilities, malicious/compromised packages, lockfile integrity, CI/CD pipeline exposure, SBOM/license coverage — across npm, PyPI, crates.io, Go, Java, Ruby, and container ecosystems.

### 2.1 Ecosystem Detection

Identify what the project uses before auditing:
- **Node.js/npm**: `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`
- **Python/PyPI**: `requirements*.txt`, `Pipfile`, `Pipfile.lock`, `pyproject.toml`, `poetry.lock`
- **Rust/crates.io**: `Cargo.toml`, `Cargo.lock`
- **Go**: `go.mod`, `go.sum`
- **Java**: `pom.xml`, `build.gradle`
- **Ruby**: `Gemfile`, `Gemfile.lock`
- **Containers/CI**: `Dockerfile`, `docker-compose.yml`, `.github/workflows/`

### 2.2 Dependency Inventory

Inventory direct, transitive, dev, build-time dependencies, and base images. Note whether a lockfile exists and is committed — a `package.json`/`requirements.txt` with no lockfile is itself a finding (unreproducible builds, floating-version exposure).

### 2.3 Risk Categories to Evaluate

- Known CVEs and advisories against current versions
- Unpinned or floating versions (`^`, `~`, no pin at all)
- Missing or stale lockfiles
- Install scripts that execute code (npm `postinstall`, etc.)
- Typosquatting and suspicious package naming
- Dependency confusion vectors (internal package names shadowed on public registries)
- Missing SBOM (software bill of materials) workflow
- License incompatibilities
- Weak CI/CD provenance (unpinned actions, unverifiable build steps)
- **Known-compromised packages and active threat intelligence** — see 2.4

### 2.4 Known-Compromised Package / IOC Checks

Beyond generic CVE scanning, cross-check dependencies against a maintained indicator-of-compromise (IOC) database of packages known to have shipped malware, credential stealers, or backdoors — CVE databases lag behind fast-moving supply chain attacks, and a package can be actively malicious before it has a CVE at all.

This package ships a reference IOC database and four scanner scripts built from real-world supply chain attack intelligence (`references/supply-chain-ioc-database.md`, current as of the date noted inside it):

```powershell
# Full audit — runs npm, Python, and CI/CD scanners together
./scripts/scan-all.ps1 /path/to/project

# Individual scanners
./scripts/scan-npm.ps1 /path/to/project      # npm/Node.js: lockfiles, node_modules, postinstall scripts
./scripts/scan-python.ps1 /path/to/project   # Python/PyPI: requirements files, installed packages, .pth hijacking, Rust crates
./scripts/scan-ci.ps1 /path/to/project       # GitHub Actions pinning, Docker config, secret exposure risk
```

Each scanner checks, locally and offline (no network calls):
1. Known-compromised packages and malicious versions against the IOC database
2. Filesystem indicators of compromise (persistence mechanisms left by known attack campaigns)
3. Network indicators in source code (hardcoded C2 domains/IPs — checked as static string matches, not fetched)
4. CI/CD misconfigurations (unpinned actions, dangerous triggers, secrets exposed to third-party actions)
5. Credential exposure risk (`.npmrc`/`.pypirc` tokens present, `.env` files tracked in git)

Exit code is the issue count (0 = clean). Because the IOC database is a point-in-time snapshot, treat a clean scan as "no *known* compromise as of the database date," not a guarantee — pair with 2.3's generic checks (CVE scanning, pinning, SBOM) for ongoing coverage. **Update the IOC database periodically**: search current advisories from Socket, Aikido, Endor Labs, Snyk, and JFrog; add new entries to `references/supply-chain-ioc-database.md` and the corresponding `MALICIOUS_*` arrays in the scanner scripts.

### 2.5 Remediation

For every finding: state what was detected, why it matters, how to verify it, and the exact remediation command. Tailor to ecosystem:

- **npm**: `npm audit`, lockfile checks, `.npmrc` scoping, `--save-exact`, `npm ci` (not `npm install`) in CI, `--ignore-scripts` by default
- **Python**: `pip-audit`, `cyclonedx-py` for SBOM, lockfile verification, `pip install --require-hashes` in CI
- **Go**: `govulncheck`, `go mod verify`
- **Rust**: `cargo audit`, `cargo deny`
- **Java**: OWASP dependency-check plugin, Snyk
- **Ruby**: `bundler-audit`
- **Containers**: Syft/Grype/Trivy for scanning, digest pinning instead of tags

If a compromised package is found: remove or downgrade to a known-safe version immediately, clear package caches, delete and reinstall `node_modules`/`.venv` from the lockfile, and **rotate every credential that was accessible from the environment** — a compromised install-time script has typically already had a chance to read them.

If filesystem IOCs are found (not just a compromised dependency, but active persistence evidence): treat the system as fully compromised, not just the dependency. Identify and remove persistence mechanisms, rotate every credential on the system, audit cloud provider logs, check for lateral movement, and consider reimaging.

### 2.6 CI/CD Hardening

1. Pin all GitHub Actions to full commit SHAs, never mutable tags (`v1`, `latest`, `main`)
2. Add `--ignore-scripts` to npm install/ci commands by default; enable per-package only for trusted dependencies
3. Add `--require-hashes` to pip install commands
4. Avoid `pull_request_target` unless strictly necessary; if used, never checkout the PR head with it
5. Apply least-privilege permissions to workflow tokens (avoid `permissions: write-all`)
6. Don't pass secrets directly to third-party actions without review — prefer OIDC/scoped tokens
7. Confirm `.env` files are not tracked in git and `.gitignore` covers them

### 2.7 Reporting Cadence

Recommend supply chain audits: before every production deployment, whenever a new supply chain attack is publicly reported (check exposure immediately, don't wait for the next scheduled audit), and on a regular cadence (e.g. weekly/before each release) as part of ongoing hygiene — not just once.

## Reference Files

- `references/supply-chain-ioc-database.md` — known-compromised packages (npm/PyPI/crates.io), compromised GitHub Actions, C2 domains/IPs, filesystem IOCs, and credential paths targeted by documented attack campaigns. Read this for detailed intelligence on a specific package or campaign before ruling something out as unaffected.
- `scripts/scan-all.ps1`, `scripts/scan-npm.ps1`, `scripts/scan-python.ps1`, `scripts/scan-ci.ps1` — offline, local-only scanner scripts implementing §2.4's IOC checks. No network calls; read local lockfiles, `node_modules`/installed-package lists, workflow YAML, and well-known local filesystem paths only. (`.sh` originals also ship for cross-platform use; `.ps1` is the primary/default per this vault's Windows-first convention.)
