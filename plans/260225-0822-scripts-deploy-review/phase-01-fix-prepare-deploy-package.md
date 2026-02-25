# Phase 1: Fix prepare-deploy-package.sh

## Context Links

- Script: `scripts/prepare-deploy-package.sh`
- Build script (reference): `scripts/build-shb-images.sh` (builds 6 images including plane-proxy)
- Source repo compose: `docker-compose.yml` (dev compose with `build:` directives -- NOT for production)

## Overview

- **Priority**: P1
- **Status**: Pending
- **Description**: Fix 2 bugs in the deploy package assembly script

## Key Insights

1. Source repo `docker-compose.yml` is a **dev compose** with `build:` directives and `env_file: ./apps/api/.env`. Shipping it to production breaks `--no-build` deploys.
2. Server already has its own `docker-compose.yaml` (plane-selfhost format with `image:` refs + `plane.env`). Deploy package should slot INTO that directory, not replace it.
3. `build-shb-images.sh` builds 6 images (line 47-54) but `prepare-deploy-package.sh` only validates/copies 5 -- missing `plane-proxy`.

## Requirements

### Functional

- Remove the `cp docker-compose.yml` line (line 62) -- deploy package must NOT contain a base compose
- Remove the preflight check for `docker-compose.yml` (line 27) -- no longer needed
- Add `plane-proxy` to the image validation loop (line 34) and copy loop (line 68)
- Update the header comment to reflect new deploy/ structure (no `docker-compose.yml`)

### Non-functional

- Keep `set -euo pipefail` for safety
- Maintain idempotency (rm -rf deploy/ before assembly)

## Architecture

### Current deploy/ structure (WRONG):

```
deploy/
  docker-compose.yml        <-- DEV compose, WRONG
  docker-compose.shb.yml
  scripts/deploy-shb.sh
  dist/
    .shb-version
    plane-frontend-*.tar.gz
    plane-admin-*.tar.gz
    plane-space-*.tar.gz
    plane-live-*.tar.gz
    plane-backend-*.tar.gz   <-- missing plane-proxy
```

### Fixed deploy/ structure:

```
deploy/
  docker-compose.shb.yml
  scripts/deploy-shb.sh
  dist/
    .shb-version
    plane-frontend-*.tar.gz
    plane-admin-*.tar.gz
    plane-space-*.tar.gz
    plane-live-*.tar.gz
    plane-backend-*.tar.gz
    plane-proxy-*.tar.gz     <-- ADDED
```

## Related Code Files

- **Modify**: `scripts/prepare-deploy-package.sh`

## Implementation Steps

### Step 1: Remove docker-compose.yml preflight check (line 27)

**Current** (line 27):

```bash
[ -f "docker-compose.yml" ]       || { echo "ERROR: docker-compose.yml not found."; exit 1; }
```

**Action**: Delete this line entirely.

### Step 2: Add plane-proxy to validation loop (line 34)

**Current** (line 34):

```bash
for NAME in plane-frontend plane-admin plane-space plane-live plane-backend; do
```

**New**:

```bash
for NAME in plane-frontend plane-admin plane-space plane-live plane-backend plane-proxy; do
```

### Step 3: Update image count comment (line 32)

**Current** (line 32):

```bash
# Check all 5 tar.gz exist and are non-empty
```

**New**:

```bash
# Check all 6 tar.gz exist and are non-empty
```

### Step 4: Remove cp docker-compose.yml (line 62)

**Current** (line 62):

```bash
cp docker-compose.yml          "${DEPLOY_DIR}/docker-compose.yml"
```

**Action**: Delete this line entirely.

### Step 5: Add plane-proxy to copy loop (line 68)

**Current** (line 68):

```bash
for NAME in plane-frontend plane-admin plane-space plane-live plane-backend; do
```

**New**:

```bash
for NAME in plane-frontend plane-admin plane-space plane-live plane-backend plane-proxy; do
```

### Step 6: Update header comment (lines 1-15)

Update the `Produces:` block to remove `docker-compose.yml` from the tree and add `plane-proxy-*.tar.gz`.

### Step 7: Update scp instructions at bottom

Current instructions say `scp -r ${DEPLOY_DIR}/* user@server:/path/to/plane/`. Update to clarify the target is the plane-selfhost `plane-app/` directory.

## Todo List

- [ ] Delete line 27 (docker-compose.yml preflight check)
- [ ] Change `5` to `6` in comment on line 32
- [ ] Add `plane-proxy` to validation loop (line 34)
- [ ] Delete line 62 (cp docker-compose.yml)
- [ ] Add `plane-proxy` to copy loop (line 68)
- [ ] Update header comment block (lines 1-15)
- [ ] Update scp/usage instructions at bottom of script
- [ ] Verify script runs without error on Mac (dry-run after `build-shb-images.sh`)

## Success Criteria

1. `deploy/` folder does NOT contain `docker-compose.yml`
2. `deploy/dist/` contains 6 `.tar.gz` files (including `plane-proxy`)
3. Script exits 0 when all 6 images present in `dist/`
4. Script exits 1 if any of 6 images missing

## Risk Assessment

| Risk                                     | Likelihood | Mitigation                               |
| ---------------------------------------- | ---------- | ---------------------------------------- |
| Forgetting to rebuild after adding proxy | Low        | build-shb-images.sh already builds proxy |
| Breaking existing CI/CD                  | None       | No CI runs these scripts; manual only    |

## Security Considerations

- No secrets handled in this script
- Deploy package contains only Docker images + compose override + deploy script

## Next Steps

- Phase 2: Fix deploy-shb.sh (depends on knowing the correct deploy/ structure from this phase)
