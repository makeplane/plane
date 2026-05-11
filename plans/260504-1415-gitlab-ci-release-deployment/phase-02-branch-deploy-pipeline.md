# Phase 02: Branch Deploy Pipeline

## Context Links

- Parent plan: [plan.md](./plan.md)
- Scout: [scout-01-existing-ci-deploy-files.md](./scout/scout-01-existing-ci-deploy-files.md)
- Existing deploy script: `scripts/ci-deploy.sh`

## Overview

Date: 2026-05-04  
Priority: P1  
Implementation status: Completed  
Review status: Complete  
Description: Stabilize offline branch pipeline so development server builds packages and can deploy dev directly or via release package.

## Key Insights

- Current `.gitlab-ci.yml` already builds tarballs and deploys via SCP.
- Current release stage creates release metadata but no binary asset.
- Current `PLANE_DIR` default in CI differs from `scripts/ci-deploy.sh` default comments/variable.
- Current CI uses public images and package installs in several jobs; this will fail offline unless replaced by shell executor or internal mirrors.
- Mac is ARM; release builds should run on development server and produce `linux/amd64` images for both dev and prod servers.
- Current deploy jobs use `sshpass` and GitLab-stored server user/password variables. Internal deploy should not use this because runners already run on the target servers.

## Requirements

- Merge to `develop`: development server builds dynamic images and publishes a dev release package; optional auto-deploy dev.
- Merge to `preview`: development server builds production candidate package; production deployment remains release-file based.
- Build artifacts include all files needed by `scripts/ci-deploy.sh`.
- Deploy script must fail before container changes if preflight/migration fails.
- Build/test/lint jobs use only offline dependency sources.

## Architecture

```
GitLab pipeline
  offline build:web/admin/api -> dist/*.tar.gz + .shb-version
  publish release zip -> internal GitLab Package Registry + Release tag
  optional deploy:dev -> local runner retrieves release zip -> scripts/ci-deploy.sh/deploy-shb.sh
  target server -> docker load -> migrate -> compose up
```

## Related Code Files

- Modify: `.gitlab-ci.yml`
- Modify: `scripts/ci-deploy.sh`
- Create: none
- Delete: none

## Embedded Rules

1. Do not create enhanced duplicate scripts; update existing files directly.
2. Code must compile/run: shell scripts pass `bash -n`.
3. KISS: keep branch deploy separate from release pull deploy.

## Implementation Steps

<!-- Updated: Validation Session 1 - Prod promotion = manual tag, offline cache = dev server local path (ops) -->

1. **Prod promotion is manual tag creation** (validated). `preview` merge triggers dev-validated release build; a Maintainer+ human then creates `prod/shb_vX.Y.Z` tag in GitLab UI/CLI when ready. No automated promotion job needed — remove any auto-promotion pipeline step.
   **Offline cache:** Document cache path (e.g. `/opt/plane-cache/`) in build job config and CI env var. Ops team seeds and maintains it. Add preflight CI check that fails fast if cache is stale/missing before build starts.
2. Align `PLANE_DIR` defaults between CI variable and `scripts/ci-deploy.sh`.
3. Add explicit `needs` for all build artifacts in deploy jobs.
4. Ensure deploy images are exactly those expected by `ci-deploy.sh`.
5. Remove or internalize all public `image:` and `services:` references.
6. Replace `apk add`, `apt-get`, and online `pip install` with preinstalled tools or internal mirrors.
7. Build with `--platform linux/amd64` on development server and inspect image architecture before packaging.
8. Add checksum generation and verification for branch deploy artifacts.
9. Add manual/optional `deploy:dev:release` job that deploys dev from release zip.
10. Replace SSH/SCP deploy with local runner deploy:
    - dev deploy job runs on `shb-dev` runner and writes to local `/tmp/plane-deploy` or `${PLANE_DIR}`,
    - prod deploy job runs on `shb-prod` runner and retrieves release package locally.
    - **[RED-TEAM F13]** Define the runner OS user for deploy jobs (likely `gitlab-runner`). Specify required sudo rules, e.g., `gitlab-runner ALL=(root) NOPASSWD: /usr/bin/docker`. Specify file ownership for `${PLANE_DIR}` artifacts. Document migration path from the previous SSH deploy user to the runner user for any existing deployed environments.
11. Remove `sshpass` from internal deploy jobs.

## Todo List

- [x] Confirm target directories on both servers.
- [x] Confirm dynamic service set: web/admin/api/backend workers only.
- [x] Confirm offline pnpm store, Python wheelhouse, Docker base images.
- [x] Update deploy job tags from Phase 01.
- [x] Confirm dev direct deploy vs dev release deploy default behavior.
- [x] Remove GitLab server user/password variables from deploy path.
- [x] Run CI lint or GitLab pipeline simulation after changes.

## Success Criteria

- Develop merge deploys to development server without manual file transfer.
- Preview pipeline respects chosen manual/auto gate.
- Failed migration blocks app container replacement.
- Dev can deploy the same release zip format used by prod.

## Risk Assessment

- Risk: partial local artifact staging. Mitigation: stage in temp dir, verify checksums before deploy.
- Risk: migration failure. Existing script already aborts before app deploy; keep this.
  - **[RED-TEAM F9]** Abort-before-deploy prevents forward progress but is NOT a rollback. The database may be in a partially-applied migration state where neither old nor new containers can start. Require a documented migration rollback procedure: capture current migration state before each deploy; document exact manual steps to restore to known-good state. Consider a database backup step immediately before running migrations.

## Security Considerations

- Mask SSH credentials.
- Do not store server SSH credentials in GitLab.
- Use protected variables only for GitLab API publishing if absolutely needed.
- Avoid logging secrets in shell scripts.

## Next Steps

- Phase 03 adds release package publishing for hardware-limited production path.
