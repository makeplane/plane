## Compliance & Licensing

Use this reference when auditing third-party assets, satisfying AGPL obligations, or preparing attestations.

### Key Files
- [`LICENSE.txt`](../../LICENSE.txt) – AGPL-3.0 root license (must remain untouched).
- [`NOTICE.md`](../../NOTICE.md) – Attribution template; fill in company name, contact, and deployment URL.
- [`scripts/generate-license-report.sh`](../../scripts/generate-license-report.sh) – Produces:
  - `license-reports/node-licenses.json`
  - `license-reports/python-licenses.json`
  - `license-reports/summary.json`

### Commands
```bash
# Node + Python licenses
./scripts/generate-license-report.sh

# Asset scan (fonts, images, binaries)
./scripts/scan-assets.sh > license-reports/assets.txt

# Proprietary logo references
./scripts/find-logo-references.sh > license-reports/logo-refs.txt

# Secrets (gitleaks + regex)
./scripts/scan-secrets.sh
```

### AGPL Checklist
- Preserve the original copyright headers.
- Ship an accessible link to the exact source you deploy (e.g., `https://example.com/plane-source.zip`).
- Include `NOTICE.md` in product docs or splash screens.
- Document any modifications (rebranding, telemetry toggles, etc.) in release notes or `restructure-progress.md`.

### Asset & Font Guidance
- Confirm license compatibility (OFL, MIT, CC0).  
- Store non-OSS fonts in a separate directory with license proofs.  
- Avoid embedding proprietary binaries without explicit permission.




