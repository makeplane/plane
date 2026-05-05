# Phase 01: Runner Topology And Branch Routing

## Context Links

- Parent plan: [plan.md](./plan.md)
- Research: [researcher-02-runner-routing-deployment-research.md](./research/researcher-02-runner-routing-deployment-research.md)
- Existing CI: `.gitlab-ci.yml`

## Overview

Date: 2026-05-04  
Priority: P1  
Implementation status: Completed  
Review status: Complete  
Description: Configure runner tags, protected refs, and branch rules so jobs run on intended servers.

## Key Insights

- Runner tags are the safest simple selector.
- Protected runners reduce secret exposure.
- Shell executor is high-trust; use only on protected branches/tags.
- Development server is the only build-capable runner. Production runner is deploy-only.
- Current `.gitlab-ci.yml` uses `sshpass` with GitLab variables for server user/password. This should be removed for internal dev/prod deploys.

## Requirements

- `develop` deploy jobs run on development server runner.
- `preview` production/release jobs run only on allowed protected refs.
- Development server builds all release packages as `linux/amd64`.
- Production runner must not run build jobs.
- Untagged jobs disabled on deployment runners.
- Jobs must not pull public Docker images or install packages from internet.
- GitLab must not store target server SSH users/passwords.

## Architecture

```
develop merge -> shb-dev runner -> offline amd64 build -> publish dev release -> optional deploy dev
preview merge -> shb-dev runner -> offline amd64 build -> publish prod release after approval
dev release deploy -> shb-dev runner on dev server -> fetch package locally -> deploy dev
prod release deploy -> shb-prod runner on prod server -> fetch package locally -> deploy prod
```

## Related Code Files

- Modify: `.gitlab-ci.yml`
- Create: none
- Delete: none

<!-- Updated: Validation Session 1 - Protected tag prod/* = Maintainer+ enforced at GitLab level -->

## Validation Decisions

- **Protected tags:** Configure `prod/*` pattern → Maintainer+ create only in Settings → Repository → Protected tags. This is a hard GitLab-level gate; CI job rules are defense-in-depth only.
- **Prod promotion:** Maintainer+ manually creates `prod/shb_vX.Y.Z` tag from GitLab UI/CLI after validating a dev release — no automated promotion pipeline.

### Ops Checklist (must complete before Phase 03 first publish)

- [ ] GitLab: Settings → Repository → Protected tags → Add `prod/*` → Allowed to create: Maintainer+
- [ ] Confirm max upload size: Admin → Settings → General → Package registry → `client_max_body_size`

## Embedded Rules

1. YAGNI/KISS/DRY: explicit job tags; avoid dynamic indirection unless needed.
2. Git safety: no direct pushes to `develop`/`preview`; protected branches required.
3. Security: deployment secrets only on protected refs.

## Implementation Steps

1. Register development runner with tags: `shb-dev`, `shell`, `docker`.
2. Register production runner with tags: `shb-prod`, `shell`, `deploy-only`.
3. Mark both runners protected and disable untagged jobs.
4. Protect branches `develop`, `preview`; protect production tags `prod/*` or `shb-prod-*`.
   - **[RED-TEAM F3]** Set "Allowed to create" on `prod/*` protected tag to **Maintainers only** (not Developers). Verify this in GitLab UI — the default may allow Developers.
5. Update `.gitlab-ci.yml` job tags:
   - Build/release publish jobs: `shb-dev`, `shell`, `docker`.
   - Development release deploy jobs: `shb-dev`, `shell`, `deploy`.
   - Production release deploy jobs: `shb-prod`, `shell`, `deploy-only`.
6. Replace public CI images with shell jobs or internal registry images.
7. Keep merge request lint/test jobs on shared/dev-capable runner tags only.
8. Add architecture verification gate: every release image must inspect as `linux/amd64`.
   - **[RED-TEAM F8]** Define the exact check: `docker inspect --format '{{.Architecture}}' <image>` for every image in the manifest; assert value equals `amd64`; fail the pipeline if any image fails. Extract into a reusable script `scripts/verify-release-package-architecture.sh` also called from Phase 03 step 5.
9. Remove `sshpass`, `SSH_USER_*`, `SSH_PASSWORD_*`, `TEST_SERVER`, and `PROD_SERVER` from dev/prod deploy jobs.
10. Configure local server credential/config file on each runner host, outside GitLab:
    `/etc/plane-release-deploy.env`.

## Todo List

- [x] Confirm exact runner names and server hostnames.
- [x] Configure protected branches/tags in GitLab UI.
- [x] Update CI job tags.
- [x] Confirm no deploy job can run untagged.
- [x] Confirm all runner tools and dependency caches exist offline.
- [x] Confirm release tags naming: `dev/*` + `prod/*`, or `shb-dev-*` + `shb-prod-*`.
- [x] Remove server user/password variables from GitLab.
- [x] Create local runner config files on dev/prod servers.

## Success Criteria

- Test pipeline shows build jobs assigned to development runner.
- Production runner receives only deploy-only job.
- Job for wrong tag remains stuck in test branch, proving isolation.
- **[RED-TEAM F3]** Attempt to push a `prod/*` tag as a Developer-role user — confirm GitLab rejects it (not just "stuck").
- **[RED-TEAM F3]** Verify each runner's "Protected" checkbox is enabled in GitLab runner settings and that a job with `tags: [shb-prod]` on an unprotected branch is rejected.
- Release package manifest records `linux/amd64` image architecture.

## Risk Assessment

- Risk: shell runner executes untrusted code. Mitigation: protected runner + protected refs only.
- Risk: wrong tag deploys to wrong environment. Mitigation: explicit tags and environment-specific variables.

## Security Considerations

- Use masked/protected variables.
- Do not use SSH credentials for local server deploy jobs.
- Prefer local runner config files and read-only GitLab deploy tokens over plaintext passwords.
- No tokens in repo or release package.

## Next Steps

- Phase 02 updates branch deploy pipeline once runner routing is fixed.
