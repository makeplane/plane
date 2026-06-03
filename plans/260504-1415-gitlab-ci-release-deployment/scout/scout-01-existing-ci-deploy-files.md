# Existing CI/Deploy Files Scout

## Scope

Identify existing CI/CD and deploy assets relevant to GitLab Runner and release-package plan.

## Findings

- `.gitlab-ci.yml`
  - Existing stages: `lint`, `test`, `build`, `deploy`, `release`.
  - Branch behavior already targets `develop` and `preview`.
  - Air-gapped shell executor path uses local Docker daemon and exports image tarballs.
  - Deploy jobs SCP `dist/*.tar.gz`, `.shb-version`, and `scripts/ci-deploy.sh` to servers.
  - Release jobs create Git tag + GitLab Release, but currently do not upload/attach binary package assets.
- `scripts/ci-deploy.sh`
  - Runs on target server.
  - Loads `/tmp/plane-deploy/*.tar.gz`.
  - Persists images under `${PLANE_DIR}/dist`.
  - Generates `docker-compose.ci.yml`.
  - Runs migrator and deploys `web`, `admin`, `api`, `worker`, `beat-worker`.
- `scripts/build-shb-images.sh`
  - Builds linux/amd64 Docker images and saves tarballs under `dist/`.
  - Writes `dist/.shb-version`.
  - Generates `docker-compose.shb.yml`.
  - Current `IMAGES` list appears reduced to backend only; commented entries show prior full package intent.
- `scripts/prepare-deploy-package.sh`
  - Assembles `deploy/` package with `docker-compose.shb.yml`, deploy script, and six image tarballs.
  - Preflight expects frontend, admin, space, live, backend, proxy tarballs.

## Implications

- Keep current CI artifact/SCP flow for dev deployment.
- Add new release-package path rather than replacing existing deploy flow.
- Reconcile `build-shb-images.sh` image list with `prepare-deploy-package.sh` expectations before relying on manual releases.
- Add package publish and package pull scripts instead of putting long shell logic directly in `.gitlab-ci.yml`.

## Unresolved Questions

- Which services are dynamic after initial deploy: 3 services only, or all 6 images for release package?
