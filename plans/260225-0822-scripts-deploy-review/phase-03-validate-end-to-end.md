# Phase 3: Validate End-to-End

## Context Links

- Phase 1: `phase-01-fix-prepare-deploy-package.md`
- Phase 2: `phase-02-fix-deploy-shb.md`
- Build script: `scripts/build-shb-images.sh`
- Package script: `scripts/prepare-deploy-package.sh`
- Deploy script: `scripts/deploy-shb.sh`

## Overview

- **Priority**: P2
- **Status**: Pending
- **Description**: Validate the complete Mac-to-server deploy workflow after bug fixes

## Key Insights

1. Full pipeline test requires Docker running on Mac; deploy test requires the production server
2. `prepare-deploy-package.sh` can be dry-validated by checking output structure without building images
3. `deploy-shb.sh` can be validated by reading the script logic; live test on server is the true validation

## Requirements

### Functional

- Verify `build-shb-images.sh` outputs 6 images (no changes needed, just confirm)
- Verify `prepare-deploy-package.sh` produces correct deploy/ structure (6 images, no base compose)
- Verify `deploy-shb.sh` preflight passes with `docker-compose.yaml` on server
- Verify migration check works end-to-end
- Verify all services come up with SHB images

### Non-functional

- Document the validated workflow for future reference

## Architecture

### Complete workflow:

```
[Mac - build machine]
  1. cd /path/to/plane
  2. ./scripts/build-shb-images.sh
     -> dist/  (6 tar.gz + .shb-version)
     -> docker-compose.shb.yml

  3. ./scripts/prepare-deploy-package.sh
     -> deploy/
          docker-compose.shb.yml
          scripts/deploy-shb.sh
          dist/
            .shb-version
            plane-frontend-shb_v*.tar.gz
            plane-admin-shb_v*.tar.gz
            plane-space-shb_v*.tar.gz
            plane-live-shb_v*.tar.gz
            plane-backend-shb_v*.tar.gz
            plane-proxy-shb_v*.tar.gz

[Transfer]
  4. scp -r deploy/* user@server:/path/to/plane-selfhost/plane-app/

[Server - plane-selfhost/plane-app/]
  (pre-existing: docker-compose.yaml, plane.env)
  5. chmod +x scripts/deploy-shb.sh
  6. ./scripts/deploy-shb.sh
     [1/5] Load 6 Docker images from tar.gz
     [2/5] Stop conflicting Plane deployments
     [3/5] Run Django migrations (force-recreate migrator)
     [4/5] Deploy all services (force-recreate with SHB images)
     [5/5] Show service status
```

## Related Code Files

- **Verify**: `scripts/build-shb-images.sh` (no changes, just confirm 6 images)
- **Verify**: `scripts/prepare-deploy-package.sh` (after Phase 1 fixes)
- **Verify**: `scripts/deploy-shb.sh` (after Phase 2 fixes)

## Implementation Steps

### Step 1: Verify build-shb-images.sh (no changes)

Confirm the IMAGES array has 6 entries:

```bash
grep -c ':' scripts/build-shb-images.sh  # Should list 6 image definitions
```

Expected images: plane-frontend, plane-admin, plane-space, plane-live, plane-backend, plane-proxy.

### Step 2: Validate prepare-deploy-package.sh fixes

After applying Phase 1 changes, run:

```bash
# Requires build-shb-images.sh to have been run first
./scripts/prepare-deploy-package.sh
```

Verify:

- `deploy/docker-compose.yml` does NOT exist
- `deploy/docker-compose.shb.yml` exists
- `deploy/scripts/deploy-shb.sh` exists and is executable
- `deploy/dist/` contains 6 `.tar.gz` files
- `deploy/dist/.shb-version` exists

### Step 3: Validate deploy-shb.sh fixes (static analysis)

Check:

- Line with `BASE_COMPOSE` uses `docker-compose.yaml` default
- No `docker inspect.*plane-migrator` pattern exists
- Step counters are `[1/5]` through `[5/5]`
- Header comments match new argument signature

```bash
grep -n 'BASE_COMPOSE' scripts/deploy-shb.sh
grep -n 'docker inspect' scripts/deploy-shb.sh    # Should return nothing
grep -n '\[1/' scripts/deploy-shb.sh               # Should show [1/5]
```

### Step 4: Live test on server (manual)

1. Transfer deploy package to server
2. Run `./scripts/deploy-shb.sh`
3. Verify all 5 steps complete without error
4. Verify `docker compose ps` shows all services running with SHB images
5. Verify web UI is accessible

### Step 5: Test rollback path

On server:

```bash
docker compose -f docker-compose.yaml up -d
```

Verify services revert to original plane-selfhost images.

## Todo List

- [ ] Confirm build-shb-images.sh builds 6 images (read-only check)
- [ ] Run prepare-deploy-package.sh after Phase 1 fixes, verify deploy/ structure
- [ ] Static analysis of deploy-shb.sh after Phase 2 fixes
- [ ] Live deploy test on production server
- [ ] Verify rollback command works
- [ ] Update deployment docs if needed (`docs/deployment-guide.md`)

## Success Criteria

1. `prepare-deploy-package.sh` exits 0 and deploy/ has correct structure (6 images, no base compose)
2. `deploy-shb.sh` exits 0 on server with plane-selfhost directory
3. All Plane services running with SHB image tag after deploy
4. Web UI accessible post-deploy
5. Rollback to original images works

## Risk Assessment

| Risk                                      | Likelihood | Impact               | Mitigation                                    |
| ----------------------------------------- | ---------- | -------------------- | --------------------------------------------- |
| Build machine doesn't have Docker running | Low        | Can't build images   | Ensure Docker Desktop started                 |
| Server disk full (images are large)       | Medium     | Load fails           | Check disk space before transfer              |
| Migration fails on server                 | Low        | Deploy aborts safely | Script already handles this; check logs       |
| Network timeout during scp                | Low        | Partial transfer     | Re-run scp; deploy script validates all files |

## Security Considerations

- Never transfer `plane.env` or secrets in the deploy package
- Deploy package contains only Docker images (compiled code) + compose override + deploy script
- Server credentials for scp should use SSH keys, not passwords

## Next Steps

- If all validations pass, mark plan as completed
- Update `docs/deployment-guide.md` with corrected workflow if needed
