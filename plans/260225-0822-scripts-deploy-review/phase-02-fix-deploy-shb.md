# Phase 2: Fix deploy-shb.sh

## Context Links

- Script: `scripts/deploy-shb.sh`
- Server directory: `/path/to/plane-selfhost/plane-app/` (has `docker-compose.yaml` + `plane.env`)
- Phase 1: `phase-01-fix-prepare-deploy-package.md` (deploy package no longer ships base compose)

## Overview

- **Priority**: P1
- **Status**: Pending
- **Description**: Fix 3 bugs in the production deploy script

## Key Insights

1. plane-selfhost uses `docker-compose.yaml` (`.yaml` extension), not `.yml`. The current default `BASE_COMPOSE="docker-compose.yml"` will fail the preflight check on server.
2. `docker inspect --format='...' plane-migrator` hardcodes container name. After Phase 1, deploy package no longer ships the source repo compose that defines `container_name: plane-migrator`. Server's compose uses auto-generated names (`<project>-migrator-1`).
3. The `docker compose wait migrator` command already returns non-zero on failure, making the subsequent `docker inspect` check redundant.
4. Step counter says `[1/4]` then `[2/5]...[5/5]` -- should be `[1/5]` through `[5/5]`.

## Requirements

### Functional

- Change `BASE_COMPOSE` default from `docker-compose.yml` to `docker-compose.yaml`
- Remove the redundant `docker inspect` block for migrator (lines 132-138); rely on `docker compose wait` exit code
- Fix step counter from `[1/4]` to `[1/5]`

### Non-functional

- Accept `BASE_COMPOSE` as 3rd positional arg for flexibility
- Keep existing error messages informative

## Architecture

### Deploy command chain:

```
deploy-shb.sh
  [1/5] docker load < dist/*.tar.gz
  [2/5] Stop conflicting Plane deployments
  [3/5] docker compose ... up -d migrator --force-recreate --no-build
        docker compose ... wait migrator  <-- exit code = migration result
  [4/5] docker compose ... up -d --no-build --force-recreate
  [5/5] docker compose ... ps
```

### Compose command after fix:

```bash
COMPOSE_CMD="docker compose --env-file ${ENV_FILE} -f ${BASE_COMPOSE} -f ${OVERRIDE_COMPOSE}"
# Resolves to:
# docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml ...
```

## Related Code Files

- **Modify**: `scripts/deploy-shb.sh`

## Implementation Steps

### Step 1: Change BASE_COMPOSE default (line 24)

**Current**:

```bash
BASE_COMPOSE="docker-compose.yml"
```

**New**:

```bash
BASE_COMPOSE="${3:-docker-compose.yaml}"
```

This makes it a positional arg with sensible default. Usage becomes:

```
./scripts/deploy-shb.sh [dist-dir] [env-file] [base-compose]
```

### Step 2: Update Usage comment in header (lines 6-10)

**Current**:

```bash
# Usage: ./scripts/deploy-shb.sh [dist-dir]
#
# Arguments:
#   dist-dir   Path to the dist/ folder (default: dist)
```

**New**:

```bash
# Usage: ./scripts/deploy-shb.sh [dist-dir] [env-file] [base-compose]
#
# Arguments:
#   dist-dir      Path to the dist/ folder (default: dist)
#   env-file      Path to environment file (default: plane.env)
#   base-compose  Base docker-compose file (default: docker-compose.yaml)
```

### Step 3: Fix step counter (line 56)

**Current**:

```bash
echo "[1/4] Loading Docker images ..."
```

**New**:

```bash
echo "[1/5] Loading Docker images ..."
```

### Step 4: Remove redundant docker inspect block (lines 132-138)

**Current** (lines 132-138):

```bash
# Verify migrator exited successfully (exit code 0)
MIGRATOR_EXIT=$(docker inspect --format='{{.State.ExitCode}}' plane-migrator 2>/dev/null || echo "unknown")
if [ "${MIGRATOR_EXIT}" != "0" ]; then
  echo "ERROR: Migrator exited with code ${MIGRATOR_EXIT}. Aborting deploy."
  echo "       Check logs: ${COMPOSE_CMD} logs migrator"
  exit 1
fi
```

**Action**: Delete these 7 lines entirely. The `docker compose wait migrator` on line 126 already returns non-zero if migrator fails, and the `if !` block (lines 126-130) already handles that case with an abort + error message.

### Step 5: Update the "Migrations complete" echo

**Current** (line 139):

```bash
echo "  Migrations complete (exit 0)."
```

This line stays as-is (renumbered after deletion). It now directly follows the `fi` on line 130.

### Step 6: Update header prerequisites comment (lines 14-15)

**Current**:

```bash
#   - docker-compose.shb.yml override file at repo root
#   - docker-compose.yml base file at repo root
```

**New**:

```bash
#   - docker-compose.shb.yml override file in working directory
#   - docker-compose.yaml base file (plane-selfhost default)
```

## Todo List

- [ ] Change `BASE_COMPOSE` to `"${3:-docker-compose.yaml}"` (line 24)
- [ ] Update header comment: Usage, Arguments, Prerequisites (lines 6-15)
- [ ] Fix `[1/4]` to `[1/5]` (line 56)
- [ ] Delete docker inspect block (lines 132-138)
- [ ] Verify `docker compose wait` handles failure correctly (manual test)

## Success Criteria

1. Script finds `docker-compose.yaml` on server without manual override
2. Migration check works regardless of container naming convention
3. Step counter reads `[1/5]` through `[5/5]` consistently
4. Script exits non-zero if migrator fails (via `docker compose wait` exit code)

## Risk Assessment

| Risk                                               | Likelihood | Impact                    | Mitigation                                                                           |
| -------------------------------------------------- | ---------- | ------------------------- | ------------------------------------------------------------------------------------ |
| Server has `.yml` not `.yaml`                      | Low        | Script fails at preflight | 3rd arg override: `./scripts/deploy-shb.sh dist plane.env docker-compose.yml`        |
| `docker compose wait` not available (compose <2.1) | Low        | Script fails              | Preflight already checks `docker compose version`; add version check if needed       |
| Removing inspect loses exit code visibility        | None       | N/A                       | `docker compose wait` prints exit info; error message in `if !` block is descriptive |

## Security Considerations

- Script runs as whatever user invokes it; no privilege escalation
- `--env-file plane.env` keeps secrets out of command line
- No new secrets handling introduced

## Next Steps

- Phase 3: End-to-end validation of the complete workflow
