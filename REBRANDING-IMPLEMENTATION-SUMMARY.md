# Rebranding Implementation Summary

This document summarizes what has been implemented for the Plane rebranding project.

## Completed Implementation

### 1. Repository & Branching Setup ✅
- Upstream remote configured: `git@github.com:makeplane/plane.git`
- Rebrand branch created: `rebrand/initial-20251119`
- Branch pushed to fork: `origin/rebrand/initial-20251119`

### 2. Automated Scanning Scripts ✅

#### License Scanning
- **File**: `scripts/generate-license-report.sh`
- Scans Node.js packages using `license-checker`
- Scans Python packages using `pip-licenses`
- Generates JSON and summary reports in `license-reports/`

#### Asset Scanning
- **File**: `scripts/scan-assets.sh`
- Finds all font/image files
- Checks for proprietary font references
- Identifies brand/logo references
- Reports file sizes
- Generates reports in `asset-reports/`

#### Secret Scanning
- **File**: `scripts/scan-secrets.sh`
- Uses `gitleaks` for automated secret detection
- Scans for common secret patterns (API keys, tokens, etc.)
- Checks .env files for long values
- Generates reports in `secret-reports/`

#### Logo Reference Finder
- **File**: `scripts/find-logo-references.sh`
- Finds all logo imports in code
- Identifies logo references in config files
- Lists all logo files
- Generates reports in `logo-references/`

### 3. Telemetry Abstraction ✅

#### Implementation
- **Location**: `packages/services/src/telemetry/stub.ts`
- **Exports**: `packages/services/src/telemetry/index.ts`
- **Integration**: Added to `packages/services/src/index.ts`

#### Features
- `NoOpTelemetry`: No-op implementation for disabled telemetry
- `PostHogTelemetry`: PostHog adapter (can be disabled)
- `createTelemetry()`: Factory function that respects `VITE_ENABLE_TELEMETRY`
- Automatically uses no-op when telemetry is disabled

#### Usage
```typescript
import { createTelemetry } from '@plane/services/telemetry';
const telemetry = createTelemetry();
telemetry.capture('event_name', { property: 'value' });
```

### 4. Design Tokens System ✅

#### Brand Tokens CSS
- **Location**: `packages/tailwind-config/src/tokens.css`
- Defines `--brand-*` CSS variables
- Can override primary colors when uncommented
- Supports light/dark themes

#### Brand Token Utilities
- **Location**: `packages/utils/src/brand-tokens.ts`
- **Exports**: Added to `packages/utils/src/index.ts`

#### Functions
- `updateBrandTokens()`: Update tokens at runtime
- `getBrandToken()`: Get current token value
- `resetBrandTokens()`: Reset to defaults
- `applyBrandConfig()`: Apply complete brand configuration

#### Usage
```typescript
import { updateBrandTokens } from '@plane/utils';

updateBrandTokens({
  '500': '14, 165, 233',  // Primary brand color (RGB)
  '600': '2, 132, 199',   // Secondary brand color
});
```

### 5. CI/CD Configuration ✅

#### GitHub Actions Workflow
- **File**: `.github/workflows/rebrand-checks.yml`
- **Triggers**: PRs and pushes to `rebrand/**` branches

#### Jobs
1. **License Scan**: Scans Node.js and Python licenses
2. **Secret Scan**: Runs gitleaks to detect secrets
3. **Asset Scan**: Scans for assets and proprietary content
4. **Build Check**: Verifies TypeScript, linting, and builds

### 6. Documentation ✅

#### NOTICE.md
- Attribution notice template
- AGPL compliance information
- Source code availability requirements
- Placeholders for customization

#### REBRANDING.md
- Comprehensive rebranding guide
- Step-by-step instructions for all phases
- Testing procedures
- License compliance steps
- Upstream merge strategy
- Rollback procedures

## Next Steps (Manual Tasks)

### 1. Customize Brand Colors
- Edit `packages/tailwind-config/src/tokens.css`
- Update `--brand-*` values with your brand colors
- Uncomment override section if using brand as primary

### 2. Replace Logo Assets
- Run `./scripts/find-logo-references.sh` to find all references
- Replace logo files maintaining same names/dimensions:
  - `apps/web/app/assets/plane-logos/*`
  - `apps/space/app/assets/plane-logos/*`
  - `apps/admin/app/assets/plane-logos/*`
  - `apps/*/app/assets/favicon/*`

### 3. Update Code References
- Update favicon imports in `apps/web/app/root.tsx`
- Update `apps/web/public/site.webmanifest.json`
- Search and replace any hardcoded logo paths

### 4. Disable Telemetry
- Set `VITE_ENABLE_TELEMETRY=false` in environment
- Or remove `VITE_POSTHOG_KEY` from environment variables

### 5. Update NOTICE.md
- Replace `[YOUR_REPO_URL]` with your repository URL
- Replace `[YOUR_CONTACT_EMAIL]` with your contact email
- List all replaced assets

### 6. Implement Source Code Endpoint (AGPL)
- Create `/source` endpoint in Django API
- Return repository link or source tarball
- Add UI link to source code

### 7. Run Scans
```bash
# License scan
./scripts/generate-license-report.sh

# Asset scan
./scripts/scan-assets.sh

# Secret scan (install gitleaks first)
./scripts/scan-secrets.sh

# Logo references
./scripts/find-logo-references.sh
```

### 8. Testing
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm check:types

# Lint
pnpm check:lint

# Build
pnpm build
```

## File Structure

```
plane/
├── scripts/
│   ├── generate-license-report.sh    # License scanning
│   ├── scan-assets.sh                # Asset scanning
│   ├── scan-secrets.sh               # Secret scanning
│   └── find-logo-references.sh       # Logo reference finder
├── packages/
│   ├── services/src/telemetry/
│   │   ├── stub.ts                   # Telemetry abstraction
│   │   └── index.ts                  # Exports
│   ├── utils/src/
│   │   └── brand-tokens.ts           # Brand token utilities
│   └── tailwind-config/src/
│       └── tokens.css                # Brand token CSS variables
├── .github/workflows/
│   └── rebrand-checks.yml            # CI/CD checks
├── NOTICE.md                         # Attribution notice
├── REBRANDING.md                     # Rebranding guide
└── REBRANDING-IMPLEMENTATION-SUMMARY.md  # This file
```

## Environment Variables

### Telemetry Control
- `VITE_ENABLE_TELEMETRY`: Set to `false` to disable telemetry (default: enabled if key present)
- `VITE_POSTHOG_KEY`: PostHog API key (remove to disable)
- `VITE_POSTHOG_HOST`: PostHog host (default: https://app.posthog.com)

## Important Notes

1. **AGPL Compliance**: If deploying as a web service, you must provide source code access per AGPL-3.0
2. **Asset Replacement**: Maintain same file names and dimensions to avoid layout shifts
3. **API Contracts**: Do not change API endpoints without versioning
4. **Testing**: Always test after rebranding changes
5. **Upstream Merges**: Keep rebranded assets when merging upstream security fixes

## Support

- Review `REBRANDING.md` for detailed instructions
- Check script outputs in `*-reports/` directories
- Review CI/CD logs for automated checks

