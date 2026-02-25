# Code Review: scripts/prepare-deploy-package.sh & scripts/deploy-shb.sh

**Date**: 2026-02-25
**Reviewer**: code-reviewer agent
**Scope**: 8 targeted changes to two deploy bash scripts

## Verdict: PASS — Score: 9/10

---

## Scope

- Files: `scripts/prepare-deploy-package.sh`, `scripts/deploy-shb.sh`
- Focus: targeted diff review per plan (260225-0822-scripts-deploy-review)
- Scout: no programmatic callers in repo; invoked only from docs/instructions

---

## Critical Issues

None.

---

## High Priority

**H1 — Pre-existing: empty array expansion under `set -u` (not introduced by these changes)**

`deploy-shb.sh` line 100:

```bash
for sp in "${STOPPED_PROJECTS[@]+"${STOPPED_PROJECTS[@]}"}"; do
```

Correct idiom for empty array under `set -u`, but fragile on older bash. Not touched by this change; noted for awareness.

---

## Medium Priority

**M1 — `docker compose wait` requires v2.1+ (prerequisite documented, not enforced in script)**

The removed `docker inspect` block was replaced by `docker compose wait migrator`. This is correct and idiomatic. The prerequisite (compose v2.1+) is documented in the script header but not runtime-checked. Acceptable given the deployment context.

**M2 — SCP instruction does not explicitly preserve execute bit**

`prepare-deploy-package.sh` line 88: the chmod +x is applied locally before copy, and scp preserves permissions by default. No real risk; not introduced by these changes.

---

## Change-by-Change Assessment

| Change                                              | Correct? | Regression Risk | Notes                                                                                    |
| --------------------------------------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------- |
| Removed `cp docker-compose.yml`                     | YES      | None            | Prevents clobbering server's plane-selfhost base compose                                 |
| Removed preflight check for `docker-compose.yml`    | YES      | None            | File no longer packaged; check was inconsistent                                          |
| Added `plane-proxy` to validation + copy loops      | YES      | None            | Both loops updated in sync                                                               |
| Comment "5 tar.gz" → "6 tar.gz"                     | YES      | None            | Accurate: frontend, admin, space, live, backend, proxy                                   |
| SCP instructions target `plane-selfhost/plane-app/` | YES      | None            | Matches intended server layout                                                           |
| `BASE_COMPOSE="${3:-docker-compose.yaml}"`          | YES      | None            | Additive 3rd arg; callers with 0/1/2 args unaffected                                     |
| Reordered args + updated usage docs                 | YES      | None            | No shift on args 1 and 2                                                                 |
| `[1/4]` → `[1/5]` step counter                      | YES      | None            | Matches 5 actual steps                                                                   |
| Removed `docker inspect` migrator block             | YES      | None            | `docker compose wait` is correct idiomatic replacement; removes hardcoded container name |

---

## Positive Observations

- `docker compose wait` is the right tool: uses compose-native exit code, removes hardcoded container name `plane-migrator`
- `${3:-docker-compose.yaml}` is backward-compatible; matches plane-selfhost naming convention
- `plane-proxy` correctly added to both validation and copy loops (in sync)
- `set -euo pipefail` intact in both files

---

## Score Rationale

-1 for pre-existing `set -u` + empty array idiom risk and absence of runtime `docker compose wait` version check (both outside scope of this diff but present in the reviewed files).

---

## Unresolved Questions

None from this review. Pre-existing question from plan (unrelated to this diff): should `deploy-shb.sh` auto-detect `docker-compose.yaml` location if server path varies?
