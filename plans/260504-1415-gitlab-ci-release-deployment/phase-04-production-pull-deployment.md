# Phase 04: Release Package Deployment

## Context Links

- Parent plan: [plan.md](./plan.md)
- Research: [researcher-01-gitlab-release-package-research.md](./research/researcher-01-gitlab-release-package-research.md)
- Existing deploy script: `scripts/deploy-shb.sh`

## Overview

Date: 2026-05-04  
Priority: P1  
Implementation status: Completed  
Review status: Complete  
Description: Let dev and prod retrieve internal GitLab Release packages and deploy without internet; prod remains deploy-only.

## Key Insights

- Production server should only perform internal GitLab retrieval, checksum verify, `docker load`, migration, compose up.
- Development server can deploy from release package to validate the same artifact path before prod.
- Exact tag deploy is safer than "latest"; avoid latest for production.
- Existing `deploy-shb.sh` can deploy from local `dist/` package layout.
- Because the runner is already on the target server, deploy jobs should not SSH into the server or store server credentials in GitLab.

## Requirements

- Deploy exact release tag:
  - Dev: `dev/shb_vX.Y.Z-build.N`
  - Prod: `prod/shb_vX.Y.Z`
- Optional dev deploy from latest `dev/*` release after explicit manual trigger.
- Production deploy must require exact `prod/*` tag.
- Verify checksum before extracting/loading.
- Keep rollback package locally.
- Do not require Docker build tools on production.
- Do not require internet or external package registries on production.
- Do not require `SSH_USER_*` or `SSH_PASSWORD_*` GitLab variables.

## Architecture

```
dev/prod runner on target server
  -> internal GitLab API/package URL
  -> retrieve archive + SHA256SUMS over LAN
  -> verify
  -> extract to temp
  -> docker load images
  -> run migrations
  -> compose up
  -> archive previous package/version
```

## Related Code Files

- Create: `scripts/deploy-from-internal-gitlab-release.sh`
- Modify: `.gitlab-ci.yml` release deploy jobs
- Modify: `scripts/deploy-shb.sh` only if needed for package layout compatibility
- Delete: none

## Embedded Rules

1. KISS: deploy script only retrieves from internal GitLab and deploys.
2. Security: read-only token; no build or write API permissions on prod.
3. Safety: fail before changing running containers if checksum/preflight fails.

## Implementation Steps

1. Create release deploy script inputs:
   `GITLAB_URL`, `PROJECT_ID`, `RELEASE_TAG`, `PACKAGE_NAME`, `DEPLOY_TOKEN`, `TARGET_ENV`.
   Prefer loading these from local `/etc/plane-release-deploy.env` on the runner host instead of GitLab CI variables.
   - **[RED-TEAM F1]** Specify exact file permissions: `chmod 0400`, owned by the runner OS user (not root-world-readable). Document the secure provisioning procedure — the file must not be world-readable. Add a validation step in Phase 05 that asserts the file is `0400` before deploy proceeds. Resolve token type before this phase (deploy token with `read_package_registry` scope only). Document rotation runbook.
   - **[RED-TEAM F1]** The deploy script must check for existence and readability of the env file as its **first operation** and exit with a clear error listing every required variable if any is absent or empty. Include a template `scripts/plane-release-deploy.env.example` in the repository.
   - **[RED-TEAM F11]** Use `set -u` bash strict mode to catch unset variables. Remove the "latest dev" fallback entirely. `RELEASE_TAG` must always be explicit — if unset, exit with a clear error. Never default to fetching a "latest" release on any environment.
2. Resolve package URL from exact `RELEASE_TAG` (always required; no latest-fallback).
<!-- Updated: Validation Session 1 - Deploy token confirmed; checksum anchor = Release API description -->

3. Retrieve archive and `SHA256SUMS` from internal GitLab only. **Also fetch the expected SHA256 hash from the GitLab Release description via the Releases API** (separate from the package registry endpoint).
4. Verify: compare `SHA256SUMS` file against the hash embedded in the Release description. Then verify the archive against `SHA256SUMS`. Fail if either comparison mismatches.
   - **[VALIDATION SESSION 1]** Integrity anchor: Release description hash (via Releases API) is the second independent source. No GPG key management required. Script must call the Releases API GET endpoint to read description before trusting the downloaded checksum file.
5. Extract package into staging directory.
6. Verify manifest target environment matches `TARGET_ENV` (defense-in-depth; primary guard is the protected tag rule and pipeline, not this self-attested field).
7. Load image tarballs.
   - **[RED-TEAM F6]** Load all images **before stopping any running containers**. After loading, run `docker inspect --format '{{.Id}}' <image>` for each image and confirm all are present at the expected digest from the manifest. Only then stop services and apply the new compose override. If any image load or digest check fails, abort before touching running containers.
8. Run existing deploy flow.
9. Archive deployed package under `${PLANE_DIR}/archive/${RELEASE_TAG_SAFE}`.
   - **[RED-TEAM F10]** Define N explicitly (minimum: 3 previous releases). Calculate worst-case disk requirement for N × full package size and add a disk-space preflight check before extracting a new package. Implement rollback as an explicit script with documented steps: stop current containers → load previous image tarballs from archive → re-apply previous compose override → start services → verify health. Add rollback as a first-class CI job (manual trigger).
10. Append a structured audit log entry to an append-only log file (`chmod 0644`, root-owned, using `>>`):
    `timestamp | release_tag | operator_UID | SHA256_of_deployed_archive | exit_code`
    - **[RED-TEAM F12]** Local runner execution leaves no GitLab pipeline record for production deploys. This audit log is the only forensic record of who deployed what and when.
11. Add GitLab CI jobs:
    - `deploy:dev:release`, tagged `shb-dev`, manual or automatic after dev release publish.
    - `deploy:prod:release`, tagged `shb-prod deploy-only`, manual only, requires `prod/*`.
12. Remove all SSH/SCP commands from internal dev/prod release deploy jobs.

## Todo List

- [x] Confirm development server can retrieve internal GitLab release package over LAN.
- [x] Confirm production server can reach internal GitLab over LAN.
- [x] ~~Confirm token type~~ → **Deploy token with `read_package_registry` scope confirmed**
- [x] Provision deploy token; store at `/etc/plane-release-deploy.env` with `chmod 0400`, owned by runner OS user.
- [x] Implement internal retrieve/deploy script.
- [x] Add dev release deploy job.
- [x] Add prod release deploy job requiring exact `prod/*` tag.
- [x] Test release package deploy on development before production.

## Success Criteria

- Dev deploy from release zip succeeds.
- Production deploy succeeds without building any image and without internet.
- Bad checksum aborts before Docker load.
- Missing package/version aborts with clear message.
- Previous deployed package remains available for rollback.
- Production job refuses `dev/*` tag.
- No server username/password exists in GitLab CI variables.

## Risk Assessment

- Risk: prod deploys dev package. Mitigation: `TARGET_ENV=prod` accepts only `prod/*` tags (enforced by protected tag rule and pipeline); manifest env check is defense-in-depth.
- Risk: unintended version deployed. Mitigation: `RELEASE_TAG` is always required and explicit; no "latest" fallback in any environment; `set -u` enforced.
- Risk: package extraction overwrites active files. Mitigation: extract to temp, load all images and verify digests, only then stop running containers and apply compose override.
- Risk: internal GitLab unavailable blocks production deploy. Mitigation: keep last 3 release packages locally (disk budget pre-calculated); rollback uses local archive, not remote GitLab. Add disk-space preflight before each deployment.

## Security Considerations

- **[RED-TEAM F1]** Token stored in `/etc/plane-release-deploy.env` with permissions `0400`, owned by the runner OS user. This file must not be world-readable. Document provisioning and rotation runbook. Resolve token type to deploy token with `read_package_registry` scope only.
- Script never echoes token. Use `set +x` around any line that reads token values.
- Production deploy token can read packages only; it cannot publish releases.
- Script validates env file existence and all required variables as its first operation, before any network calls.

## Next Steps

- Phase 05 validates full flow and documents rollback.
