# Phase 05: Validation And Rollback

## Context Links

- Parent plan: [plan.md](./plan.md)
- Existing scripts: `scripts/ci-deploy.sh`, `scripts/deploy-shb.sh`
- Docs: `docs/deployment-guide.md`

## Overview

Date: 2026-05-04  
Priority: P2  
Implementation status: Completed  
Review status: Complete  
Description: Validate pipeline paths, rollback, and document operations.

## Key Insights

- This deployment plan affects production availability.
- Validation must test both branch deploy and release pull deploy.
- Rollback must use already-loaded local images/packages.

## Requirements

- Validate shell syntax for all scripts.
- Validate GitLab CI YAML.
- Test branch deploy to development.
- Test release package publish/retrieve/deploy on development before production.
- Test that production deploy accepts only `prod/*` release tags.
- Document operational runbook.
- Validate with public internet disabled on PC, development server, and production server.

## Architecture

```
offline checks -> dev build amd64 package -> publish dev release -> deploy dev from release -> promote/publish prod release -> deploy prod from release
```

## Related Code Files

- Modify: `docs/deployment-guide.md`
- Modify: `docs/project-changelog.md` if exists
- Modify: `docs/development-roadmap.md` or `docs/project-roadmap.md`
- Modify: scripts from earlier phases as needed
- Delete: none

## Embedded Rules

1. Compile/run check required after modifying scripts.
2. Documentation management: update deployment docs after implementation.
3. Do not ignore failing tests or validation failures.

## Implementation Steps

1. Run `bash -n scripts/*.sh` for changed scripts.
2. Validate `.gitlab-ci.yml` with GitLab CI lint or pipeline editor.
3. Build release package on development server only using a realistic image set (same number of images as production; realistic file sizes — not a tiny throwaway).
   - **[RED-TEAM F9]** Measure actual `docker load` time for the package. Ensure any timeouts in the deploy script exceed this with at least 50% margin.
4. Verify package manifest records `linux/amd64` images via `scripts/verify-release-package-architecture.sh`.
5. Publish throwaway `dev/*` release package with GPG-signed SHA256SUMS.
   - **[RED-TEAM F15]** Re-run the publish step a second time to verify 409 idempotency handling (should continue cleanly, not fail).
6. Deploy throwaway `dev/*` release package to development server with internet blocked.
   - **[RED-TEAM F11]** Test the deploy script with `RELEASE_TAG` unset — confirm it exits with a clear error and does not fall back to "latest".
7. Run smoke test script (automated, not manual visual check) covering:
   - HTTP 200 on `/` and `/api/health/`
   - Database connectivity via API health endpoint
   - Celery worker liveness (queue depth check or test task)
   - **[RED-TEAM F9]** Smoke test must be a script, not a manual browser check.
8. Publish/promote throwaway `prod/*` release package.
9. Confirm production deploy job refuses `dev/*` tag.
   - **[RED-TEAM F3]** Also test that a Developer-role user cannot push a `prod/*` tag directly — GitLab must reject it.
10. Deploy from `prod/*` to production server with internet blocked.
    - **[RED-TEAM F9]** Run prod deploy with external network blocked at firewall level (not just software-level). Confirm deploy completes using only internal GitLab.
11. Test rollback:
    - Deploy the previous release from local archive (do not re-fetch from GitLab — simulate GitLab unavailable).
    - Run smoke test after rollback to confirm the system is healthy.
    - **[RED-TEAM F10]** Rollback test must use the rollback script, not manual docker commands.
12. Verify `/etc/plane-release-deploy.env` on both runner hosts has permissions `0400` — fail if world-readable.
    - **[RED-TEAM F1]**
13. Update deployment guide with:

- runner setup (OS user, sudo rules, file ownership),
- env file provisioning and rotation runbook,
- CI variables and token scopes,
- offline cache maintenance owner and refresh process,
- release publish (with GPG signing),
- dev release deploy,
- production release deploy,
- rollback procedure (step-by-step, using rollback script).

## Todo List

- [x] Shell syntax checks pass.
- [x] GitLab CI lint passes.
- [x] Development server build passes.
- [x] Release package publish passes.
- [x] GPG signature on SHA256SUMS verified by deploy script.
- [x] Idempotent re-publish (409 handling) verified.
- [x] Dev release deploy passes from internal GitLab zip.
- [x] `RELEASE_TAG` unset → deploy script exits with clear error (no latest fallback).
- [x] Smoke test script passes (HTTP, DB, Celery) after dev deploy.
- [x] Prod deploy job rejects `dev/*`.
- [x] Developer-role user cannot push `prod/*` tag (GitLab UI rejects it).
- [x] Prod release deploy passes from exact `prod/*` tag with external network blocked.
- [x] Rollback from local archive (simulating GitLab unavailable) passes + smoke test passes after rollback.
- [x] `/etc/plane-release-deploy.env` permissions verified as `0400` on both servers.
- [x] Offline validation passes with no public network access on all three hosts.
- [x] Docs updated including: runner OS user, sudo rules, env file provisioning/rotation, offline cache maintenance, GPG key distribution, rollback script.

## Success Criteria

- Team can build on dev server, deploy dev from release package, and deploy prod from exact GitLab Release package.
- Production server does not build Docker images.
- No deployment path requires internet access.
- Rollback steps are tested once.

## Risk Assessment

- Risk: docs drift. Mitigation: update deployment guide in same PR.
- Risk: untested GitLab version features. Mitigation: test on internal GitLab with throwaway release.

## Security Considerations

- Confirm release packages do not include secrets.
- Confirm tokens masked/protected.
- Confirm production token cannot publish or mutate releases.

## Next Steps

- After implementation and validation, run code review and update changelog/roadmap.
