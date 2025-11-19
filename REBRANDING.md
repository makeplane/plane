# Rebranding Guide

This guide provides step-by-step instructions for safely rebranding Plane without breaking functionality.

## Prerequisites

1. Fork and clone the repository
2. Set up upstream remote (already done)
3. Create rebrand branch (already done: `rebrand/initial-20251119`)

## Phase 1: License & Asset Scanning

### Run License Scans

```bash
# Generate license reports
./scripts/generate-license-report.sh

# Review reports in license-reports/
cat license-reports/summary.json
```

### Scan Assets

```bash
# Find all assets and check for proprietary content
./scripts/scan-assets.sh

# Review reports in asset-reports/
cat asset-reports/summary.json
```

### Scan for Secrets

```bash
# Install gitleaks first: https://github.com/gitleaks/gitleaks
./scripts/scan-secrets.sh

# Review reports in secret-reports/
cat secret-reports/summary.json
```

## Phase 2: Telemetry Removal

Telemetry has been abstracted into a stub system. To disable:

1. Set environment variable: `VITE_ENABLE_TELEMETRY=false`
2. Or remove `VITE_POSTHOG_KEY` from environment
3. The system will automatically use `NoOpTelemetry` when disabled

The telemetry abstraction is in `packages/services/src/telemetry/stub.ts`.

## Phase 3: Brand Tokens Setup

### Update Brand Colors

1. Edit `packages/tailwind-config/src/tokens.css`
2. Update the `--brand-*` color values
3. To apply brand colors as primary colors, uncomment the override section in `tokens.css`

### Runtime Token Updates

You can update brand tokens at runtime using:

```typescript
import { updateBrandTokens } from '@plane/utils';

updateBrandTokens({
  '500': '14, 165, 233',  // Primary brand color (RGB values)
  '600': '2, 132, 199',   // Secondary brand color
});
```

## Phase 4: Logo & Asset Replacement

### Find All Logo References

```bash
./scripts/find-logo-references.sh

# Review reports in logo-references/
cat logo-references/summary.json
```

### Replace Assets

1. **Favicons**: Replace files in:
   - `apps/web/app/assets/favicon/`
   - `apps/space/app/assets/favicon/`
   - `apps/admin/app/assets/favicon/`

2. **Logos**: Replace files in:
   - `apps/web/app/assets/plane-logos/`
   - `apps/space/app/assets/plane-logos/`
   - `apps/admin/app/assets/plane-logos/`

3. **Important**: Maintain the same file names and dimensions to avoid layout shifts

4. **Update references** in:
   - `apps/web/app/root.tsx` (favicon imports)
   - `apps/web/public/site.webmanifest.json`
   - Any component files that import logos

### Verify Build

```bash
pnpm build
# Check that new assets are included in build output
```

## Phase 5: API Contract Preservation

**IMPORTANT**: Do not change API endpoints or payload structures unless versioning them.

If you need to change APIs:

1. Create new versioned endpoints (e.g., `/api/v2/`)
2. Keep old endpoints working
3. Document changes in API documentation
4. Use adapter layers to map old fields to new ones if needed

## Phase 6: Testing

### Run Tests

```bash
# Unit tests
pnpm test

# Type checking
pnpm check:types

# Linting
pnpm check:lint

# Build verification
pnpm build
```

### End-to-End Testing

1. Start local development: `pnpm dev`
2. Test all major workflows:
   - User authentication
   - Issue creation/editing
   - Project management
   - Workspace operations
3. Verify rebranded assets appear correctly
4. Check that telemetry is disabled (if intended)

## Phase 7: License Compliance

### Update NOTICE.md

1. Edit `NOTICE.md` with your information:
   - Replace `[YOUR_REPO_URL]` with your repository URL
   - Replace `[YOUR_CONTACT_EMAIL]` with your contact email
   - List all replaced assets

### Source Code Availability

If deploying as a web service (AGPL requirement):

1. Create a `/source` endpoint that:
   - Returns a link to your source repository, OR
   - Serves a tarball of the source code

2. Add a "Source Code" link in the UI footer or about page

Example endpoint (Django):

```python
# apps/api/plane/web/urls.py
from django.http import JsonResponse

def source_code_view(request):
    return JsonResponse({
        'source_url': 'https://github.com/yourorg/your-repo',
        'license': 'AGPL-3.0'
    })
```

## Phase 8: CI/CD Setup

The rebrand checks workflow is already configured at `.github/workflows/rebrand-checks.yml`.

It will automatically:
- Scan licenses on PRs
- Check for secrets
- Scan assets
- Verify builds

## Pre-Deploy Checklist

Before deploying, ensure:

- [ ] No secrets in repo (run `./scripts/scan-secrets.sh`)
- [ ] All non-free assets replaced or properly licensed
- [ ] `LICENSE.txt` and `NOTICE.md` present and updated
- [ ] All tests passing (`pnpm test`)
- [ ] Source link available if AGPL obligations apply
- [ ] Staging smoke tests passed
- [ ] Performance validated

## Merging Upstream Changes

To merge security fixes from upstream:

```bash
# Fetch latest from upstream
git fetch upstream

# Merge into rebrand branch
git checkout rebrand/initial-20251119
git merge upstream/master --no-ff -m "Merge upstream/master security fixes"

# Resolve conflicts (keep rebranded assets/colors)
# Test after merge
pnpm install
pnpm test
pnpm build

# Push merged branch
git push origin rebrand/initial-20251119
```

## Rollback Strategy

### Quick Rollback

```bash
# Tag current deploy before new deploy
git tag -a deploy-$(date +%Y%m%d-%H%M%S) -m "Pre-rebrand deploy"
git push origin --tags

# If rollback needed
git checkout <previous-tag>
# Rebuild and redeploy
```

### Database Rollback

- **Never** rollback database migrations automatically
- Use forward-only migrations
- Test migrations in staging first

## Legal Note

**IMPORTANT**: This guide provides technical implementation steps only. Consult with legal counsel for definitive interpretation of AGPL-3.0 or other licenses before commercial use.

## Support

For questions or issues during rebranding:
1. Review the original plan: `plane-rebranding-plan.plan.md`
2. Check script outputs in `*-reports/` directories
3. Review CI/CD logs for automated checks

