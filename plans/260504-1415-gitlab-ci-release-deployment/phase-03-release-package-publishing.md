# Phase 03: Release Package Publishing

## Context Links

- Parent plan: [plan.md](./plan.md)
- Research: [researcher-01-gitlab-release-package-research.md](./research/researcher-01-gitlab-release-package-research.md)
- Existing scripts: `scripts/build-shb-images.sh`, `scripts/prepare-deploy-package.sh`

## Overview

Date: 2026-05-04  
Priority: P1  
Implementation status: Completed  
Review status: Complete  
Description: Build release package on development server, publish it to internal GitLab, and tag it for dev or prod deployment.

## Key Insights

- GitLab Release should link to package registry asset, not rely on short-lived CI artifacts.
- A single compressed package is easier for production to retrieve from internal GitLab and verify.
- Current build and package scripts disagree on image list.
- PC/dev server has no internet; build must use only local/offline caches and preloaded Docker images.
- Development server is the release build source because target servers are `linux/amd64`; Mac ARM builds are not the default path.

## Requirements

- Release package is produced on development server without internet.
- Mac ARM may only build release package if it explicitly cross-builds `linux/amd64` and passes architecture verification.
- Package includes images, compose override, deploy scripts, version manifest, checksums.
- GitLab package version equals `.shb-version`.
- Release asset has a stable direct download path.
- Publishing is idempotent or fails clearly if version already exists.
- Package must not require production to fetch anything except internal GitLab package.
- Release tag distinguishes target environment:
  - Dev: `dev/shb_vX.Y.Z-build.N`
  - Prod: `prod/shb_vX.Y.Z`

## Architecture

```
dev server offline amd64 build -> deploy/ folder -> plane-shb-release-${SHB_VERSION}.zip
  -> internal GitLab Generic Package Registry
  -> Git tag dev/shb_vX.Y.Z-build.N or prod/shb_vX.Y.Z
  -> GitLab Release asset link
```

## Related Code Files

- Modify: `scripts/build-shb-images.sh`
- Modify: `scripts/prepare-deploy-package.sh`
- Create: `scripts/publish-gitlab-release-package.sh`
- Create: `scripts/verify-release-package-architecture.sh`
- Modify: `.gitlab-ci.yml` optional manual publish job
- Delete: none

## Embedded Rules

1. DRY: reuse existing build/package scripts.
2. KISS: package once, upload one archive, one checksum file.
3. Security: publishing token must be masked/protected and least privilege.

## Implementation Steps

<!-- Updated: Validation Session 1 - 3-image dynamic confirmed; checksum anchor = Release description hash -->

1. **Package content: 3-image dynamic** (validated). Bundle only `plane-app`, `plane-worker`, `plane-beat`. DB/proxy images (postgres, redis, nginx) must already be present on target servers from initial provisioning. Removes need to confirm 6-image upload size, but admin must still confirm max upload size before Phase 03 first publish (est. ~1-2 GB for 3 images).
   - **[RED-TEAM F14]** Admin must confirm `client_max_body_size` / registry limit before first publish attempt.
2. Reconcile `build-shb-images.sh` with `prepare-deploy-package.sh`.
3. Build only on development server by default.
   - **[RED-TEAM F5 / Blocking prerequisite]** Before this step is implementable, the offline dependency cache location must be designated (internal mirror, shared folder, or manually imported bundle) and a named owner assigned for cache updates when dependencies change. Also add a CI validation gate that fails fast if the cache is stale before build starts.
4. Add preflight checks for offline dependencies:
   - Docker base images present locally,
   - pnpm store usable offline,
   - Python wheelhouse/internal mirror available,
   - no `apt-get`/`apk add`/internet package install required.
5. Add architecture verification:
   - inspect loaded/built images,
   - require `amd64/linux`,
   - fail package publish if any image is ARM.
6. Add package archive creation:
   `plane-shb-release-${SHB_VERSION}.zip`.
7. Generate `SHA256SUMS`, include in package and upload. **Additionally, write the SHA256 hash of the release archive into the GitLab Release description via the Releases API** — this provides a second, independent storage location separate from the package registry.
   - **[VALIDATION SESSION 1]** Integrity anchor decision: publish script writes `SHA256: <hash>` into the Release description. Deploy script reads the Release API to retrieve the expected hash and compares it against the downloaded archive before extraction. This provides two independent sources (Release API vs package registry asset) without requiring GPG key management.
   - Note: this protects against accidental corruption and makes substitution attacks require compromising both package registry and Release API. Accepted trade-off vs GPG signing.
8. Add script to:
   - upload package archive to Generic Package Registry,
   - upload checksum file (and its GPG signature),
   - create tag if missing,
   - create/update release with asset links.
   - **[RED-TEAM F15]** Implement explicit 409 handling: if version already exists, verify the asset link is present and checksum matches existing upload; if so, continue (idempotent); if checksum mismatches or asset link is missing, fail with a clear error. Do not silently skip.
9. Add release publish jobs:
   - `release:publish:dev` for `dev/*` tag/package,
   - `release:publish:prod` for `prod/*` tag/package after approval.

## Todo List

- [x] Confirm internal GitLab package registry enabled.
- [x] Ops: Confirm max upload size (Admin → Settings → General → Package registry) — prerequisite gate before first publish.
- [x] ~~Choose 3-image vs 6-image package~~ → **3-image dynamic confirmed** (app, worker, beat)
- [x] ~~Confirm offline dependency source~~ → **Dev server local path, ops team owns** (document path in build config)
- [x] Confirm dev/prod tag format.
- [x] Add amd64 architecture verification.
- [x] Implement publish script.
- [x] Test publish with throwaway version.

## Success Criteria

- GitLab Release page shows internal package asset.
- Package URL retrieves successfully over LAN using production deploy token.
- Re-running publish for same version fails with clear message or updates release link safely.
- Package manifest confirms every Docker image is `linux/amd64`.

## Risk Assessment

- Risk: package too large for GitLab limit. Mitigation: split package by image or increase GitLab Nginx/package limits.
- Risk: release points to wrong commit. Mitigation: require explicit ref/commit and write manifest.
- Risk: build silently uses stale offline dependencies. Mitigation: include dependency cache version/lockfile hash in manifest.
- Risk: ARM image accidentally published from Mac. Mitigation: publish gate rejects non-`linux/amd64` images.

## Security Considerations

- **[RED-TEAM F7]** Use a project access token scoped to `write_package_registry` only for publishing — NOT `api` scope. The `api` scope grants access to CI variables, pipelines, merge requests, and repository contents; a compromised build runner can use it to exfiltrate all project secrets. Document both publish and retrieve tokens separately with their distinct minimal scopes.
- Use deploy token with `read_package_registry` scope only for production package retrieval.
- Never include `.env`, `plane.env`, secrets, or private certs in package.

## Next Steps

- Phase 04 implements dev/prod release package retrieval and deployment.
