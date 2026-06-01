# Journal — Fix Outdated pnpm-lock.yaml in Docker Build

**Date:** 2026-06-01
**Plan:** None
**Branch:** `develop`
**Commit:** `7d834dc87`

## Summary

Resolved a Docker build failure (`ERR_PNPM_OUTDATED_LOCKFILE`) in `build-shb-images.sh` caused by a mismatch between `apps/web/package.json` and the root `pnpm-lock.yaml`. The mismatch arose because two Tailwind dependencies (`@tailwindcss/postcss` and `tailwindcss`) were removed from the package file, but the lockfile wasn't regenerated. Running `pnpm install` locally updated and synchronized the lockfile, which successfully restored the Docker image build functionality.

## Root Cause & Investigation

- **Symptom:** Docker build failed at stage `[installer 10/11]` during `pnpm install --offline --frozen-lockfile` with:
  ```
  ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/apps/web/package.json
  Failure reason: specifiers in the lockfile don't match specifiers in package.json: * 2 dependencies were removed: @tailwindcss/postcss@4.1.17, tailwindcss@4.1.17
  ```
- **Diagnostic:** A workspace-wide inspection showed that the tailwind packages were deleted from `apps/web/package.json`, but `pnpm-lock.yaml` still retained them in its `importers` block for `apps/web`.

## Resolution

- Ran `pnpm install` at the project root using pnpm v10.24.0.
- Updated `pnpm-lock.yaml`, cleanly pruning the obsolete tailwind references.
- Verified the fix by executing a standalone Docker build of the frontend service:
  ```bash
  docker buildx build --platform linux/amd64 --load -f apps/web/Dockerfile.web -t makeplane/plane-frontend:shb_v1.2.0 .
  ```
  The build compiled successfully, passing all turborepo caching tasks and exporting the final layers without errors.

---

**Status:** DONE
**Summary:** Resolved the pnpm lockfile mismatch that blocked the SHB Docker image builds.
