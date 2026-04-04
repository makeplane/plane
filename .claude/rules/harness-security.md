# Security Rules

You MUST follow these security rules:

## Forbidden
- NEVER commit `.env`, credentials, API keys, or tokens.
- NEVER disable security scanning tools.
- NEVER ignore Critical or High severity findings.

## Required
- All PRs pass gitleaks scan (secret detection).
- All PRs pass Semgrep scan (code patterns).
- All PRs pass Trivy scan (dependency vulnerabilities).
- Critical/High findings MUST be fixed before merge.

## Dependencies
- Run weekly dependency vulnerability scans.
- Update dependencies with known vulnerabilities within 1 week (Critical) or 2 weeks (High).

## Do NOT

- **NEVER** commit `.env`, credentials, or secret files.
- **NEVER** push directly to `main` or `develop`.
- **NEVER** commit without passing tests.
- **NEVER** bypass lint (`--no-verify` is forbidden).
- **NEVER** merge a PR without required approvals.
- **NEVER** skip security scan results (Critical/High = must fix).
