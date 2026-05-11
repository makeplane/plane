---
title: "GitLab CI Release Deployment"
description: "Plan offline GitLab runner deploys plus internal-release production deployment for hardware-limited servers."
status: completed
priority: P1
effort: 14h
branch: ngoc-feat/categories
tags: [gitlab-ci, deployment, release, docker, shb]
created: 2026-05-04
completed: 2026-05-04
---

# GitLab CI Release Deployment Plan

## Goal

Support one build path and two deploy paths in a fully offline environment:

- Build path: development server is the only CI/build machine and produces `linux/amd64` release zip/tar packages.
- Dev deploy path: development server can deploy directly after build, or deploy from an internal GitLab Release package for parity testing.
- Prod deploy path: production server only retrieves an internal GitLab Release package and deploys; no build on production.

Assumption: PC storing code, development server, and production server have no internet access. Only internal LAN services are available.
Assumption: development server and production server are `linux/amd64`; local Mac is ARM and should not be the release build source unless explicitly cross-building and verifying `amd64`.

## Key Decisions

- Use runner tags and protected runners for environment routing.
- Use internal GitLab Generic Package Registry for binary storage, GitLab Release for versioned release entry.
- Development server builds release packages; production server deploys release packages only.
- Keep direct dev deployment optional; also support dev deployment from release package to validate the same artifact used by production.
- Use deploy token/project token for production package retrieval, not personal token.
- Do not store server SSH users or passwords in GitLab. Dev/prod deploy jobs run locally on their server runners; no SSH/SCP needed for internal deploy.
- Store internal GitLab package read token on the target server filesystem if needed, not in GitLab CI variables for deploy jobs.
- No CI job may install from public npm, PyPI, Docker Hub, Alpine, Debian, or GitLab.com.
- Offline dependency sources must be pre-seeded: pnpm store, Python wheelhouse, OS packages, Docker base images, and deploy scripts.
- Tag releases by target environment:
  - `dev/shb_vX.Y.Z-build.N` for dev validation releases.
  - `prod/shb_vX.Y.Z` for production-approved releases.
    Alternative if slash tags are inconvenient: `shb-dev-vX.Y.Z-build.N` and `shb-prod-vX.Y.Z`.

## Phases

| Phase                         | Status    | Progress | File                                                                                               |
| ----------------------------- | --------- | -------: | -------------------------------------------------------------------------------------------------- |
| 01 Runner topology            | Completed |     100% | [phase-01-runner-topology-and-branch-routing.md](./phase-01-runner-topology-and-branch-routing.md) |
| 02 Branch deploy pipeline     | Completed |     100% | [phase-02-branch-deploy-pipeline.md](./phase-02-branch-deploy-pipeline.md)                         |
| 03 Release package publishing | Completed |     100% | [phase-03-release-package-publishing.md](./phase-03-release-package-publishing.md)                 |
| 04 Release package deployment | Completed |     100% | [phase-04-production-pull-deployment.md](./phase-04-production-pull-deployment.md)                 |
| 05 Validation and rollback    | Completed |     100% | [phase-05-validation-and-rollback.md](./phase-05-validation-and-rollback.md)                       |

## Dependencies

- Internal GitLab version supports Generic Package Registry and Releases API.
- PC, development server, and production server can reach internal GitLab over LAN.
- Protected branches/tags configured for `develop`, `preview`, and `shb_v*`.
- CI variables/tokens provisioned with least privilege.
- Offline dependency cache exists and is maintained for Node, Python, Docker, and OS packages.
- Development server has Docker Buildx/build tooling and local `linux/amd64` base images.
- Each runner host has local deployment config, e.g. `/etc/plane-release-deploy.env`, readable only by the runner user/root.

## Red Team Review

### Session — 2026-05-04

**Findings:** 15 (15 accepted, 0 rejected)  
**Severity breakdown:** 6 Critical, 9 High, 0 Medium

| #   | Finding                                                                     | Severity | Disposition | Applied To   |
| --- | --------------------------------------------------------------------------- | -------- | ----------- | ------------ |
| 1   | Token file: no permissions, provisioning, or rotation spec                  | Critical | Accept      | Phase 04     |
| 2   | SHA256 checksum from same untrusted source — no integrity anchor            | Critical | Accept      | Phase 03, 04 |
| 3   | No tag-creation role restriction on `prod/*`                                | Critical | Accept      | Phase 01     |
| 4   | Five unresolved questions are plan-blocking, not footnotes                  | Critical | Accept      | plan.md      |
| 5   | Offline dependency cache unspecified — blocks Phase 03                      | Critical | Accept      | Phase 03     |
| 6   | Package extraction non-atomic — mixed-version state possible                | Critical | Accept      | Phase 04     |
| 7   | Publish token uses `api` scope — overprivileged                             | High     | Accept      | Phase 03     |
| 8   | Architecture verification mentioned 3× but never defined                    | High     | Accept      | Phase 01, 03 |
| 9   | Migration abort ≠ rollback — no recovery procedure                          | High     | Accept      | Phase 02     |
| 10  | Rollback N undefined — no rollback script or steps                          | High     | Accept      | Phase 04     |
| 11  | `latest dev` fallback can fire on prod if `TARGET_ENV` unset                | High     | Accept      | Phase 04     |
| 12  | No audit trail for production deploys                                       | High     | Accept      | Phase 04     |
| 13  | SSH/SCP → local runner: runner user, sudo rules, file ownership unspecified | High     | Accept      | Phase 02     |
| 14  | GitLab registry size limit unresolved — can block Phase 03                  | High     | Accept      | Phase 03     |
| 15  | Idempotent publish: 409 error handling unspecified                          | High     | Accept      | Phase 03     |

## Research

- [GitLab Release + Package Research](./research/researcher-01-gitlab-release-package-research.md)
- [Runner Routing + Deployment Research](./research/researcher-02-runner-routing-deployment-research.md)
- [Existing CI/Deploy Files Scout](./scout/scout-01-existing-ci-deploy-files.md)

## Blocking Prerequisites (must resolve before implementation)

These are architectural decisions that gate Phase 02+. They are NOT optional footnotes — implementation must not begin until each has a named owner and explicit answer.

| Decision                                                      | Gates                         | Status        | Answer                                  |
| ------------------------------------------------------------- | ----------------------------- | ------------- | --------------------------------------- |
| `preview` → `prod/*` release: auto or manual promotion?       | Phase 02 step 1               | ✅ Resolved   | Manual tag creation by Maintainer+      |
| Package image count: 3-image dynamic or 6-image full offline? | Phase 03 step 2, archive size | ✅ Resolved   | 3-image dynamic (app, worker, beat)     |
| GitLab package registry upload size limit?                    | Phase 03 publish              | ⚠️ Unresolved | Admin must confirm before first publish |
| Offline dependency cache location and maintenance owner?      | All build phases              | ✅ Resolved   | Dev server local path, ops team owns    |
| Package token type: deploy token or project access token?     | Phase 04 deploy               | ✅ Resolved   | Deploy token (`read_package_registry`)  |

## Validation Log

### Session 1 — 2026-05-04

**Trigger:** Pre-implementation validation interview after red-team review
**Questions asked:** 7

#### Questions & Answers

1. **[Tradeoffs]** How should a validated dev release be promoted to a prod/\* release tag?
   - Options: Manual tag creation | Manual pipeline trigger | Auto-promotion on preview merge
   - **Answer:** Manual tag creation
   - **Rationale:** Explicit human sign-off required before any prod deploy; Maintainer+ creates `prod/shb_vX.Y.Z` from UI/CLI. Simplest audit trail.

2. **[Architecture]** Which Docker image set should be bundled in the release package?
   - Options: 3-image dynamic | 6-image full offline | Configurable via flag
   - **Answer:** 3-image dynamic (plane-app, plane-worker, plane-beat)
   - **Rationale:** Smaller archive (est. 1-2 GB); DB/proxy images pre-loaded on servers. Confirms Phase 03 script scope.

3. **[Architecture]** What credential type should the production server use to download packages?
   - Options: Deploy token | Project access token | CI job token
   - **Answer:** Deploy token with `read_package_registry` scope
   - **Rationale:** Least privilege; revocable per project; stored on server filesystem, not in GitLab CI variables.

4. **[Risks]** Has your GitLab admin confirmed the maximum single-file upload size in the Generic Package Registry?
   - Options: Not confirmed yet | Confirmed ≥ 5 GB | Confirmed < 2 GB
   - **Answer:** Not confirmed yet
   - **Rationale:** 3-image bundle should be well under 2 GB, but must confirm before first publish to avoid pipeline failure.

5. **[Assumptions]** Where does the offline dependency cache live, and who owns its maintenance?
   - Options: Dev server local path, ops team | Shared NFS/SMB mount | Not yet decided
   - **Answer:** Dev server local path, ops team owns it
   - **Rationale:** Cache path must be documented in Phase 02/03 build job config; ops seeds/updates it.

6. **[Risks]** How should SHA256 checksum integrity be anchored to prevent co-located substitution?
   - Options: Record hash in GitLab Release description | GPG sign + verify | Accept co-located, document risk
   - **Answer:** Record expected hash in GitLab Release description
   - **Rationale:** Release description is a separate API endpoint from the package registry; deploy script reads Release API and compares — two independent storage locations.

7. **[Architecture]** Who can create prod/\* tags and how is it enforced?
   - Options: Maintainer+ via protected tags | Named-user allowlist | Ops checklist only | CI job rule only
   - **Answer:** Maintainer+ only via GitLab protected tags (`prod/*` pattern)
   - **Rationale:** Hard enforcement at GitLab level; developers cannot accidentally create prod tags.

#### Confirmed Decisions

- Prod promotion: manual Maintainer+ tag creation — no automation, explicit human gate
- Image set: 3-image dynamic — app/worker/beat only bundled in release zip
- Package auth: deploy token with `read_package_registry` — stored on server filesystem
- Dependency cache: dev server local path, maintained by ops team
- Checksum anchor: SHA256 recorded in GitLab Release description — two independent locations
- Prod tag guard: protected tags `prod/*` = Maintainer+ create only

#### Action Items

- [ ] Ops team must confirm GitLab admin max upload size before Phase 03 first publish
- [ ] Ops team must document offline cache path (e.g. `/opt/plane-cache/`) and seed procedure
- [ ] Admin must configure GitLab protected tag rule: `prod/*` → Maintainer+ create only
- [ ] Provision deploy token for production server with `read_package_registry` scope
- [ ] Store deploy token in server-local file (e.g. `/etc/plane-release-deploy.env`), not in GitLab CI variables

#### Impact on Phases

- Phase 01: Add protected tag `prod/*` = Maintainer+ as explicit config step
- Phase 02: Prod pipeline trigger = manual tag creation (not pipeline job); document offline cache path
- Phase 03: Lock image list to 3 (app, worker, beat); add Release description hash write; mark registry size check as prerequisite gate
- Phase 04: Use deploy token from server filesystem; checksum verification reads Release API description hash
