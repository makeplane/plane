# GitLab Release + Package Research

## Scope

Research durable release artifact flow for SHB Plane when PC, development server, and production server have no internet access.

## Findings

- GitLab Release is release metadata tied to a Git tag. It can expose asset links, but release records are not the binary storage layer.
- GitLab docs recommend storing release binaries in the Generic Package Registry, then attaching package download links to the release.
- Generic Package Registry supports arbitrary files with versioned URL:
  `PUT /projects/:id/packages/generic/:package_name/:package_version/:file_name`.
- Upload auth options: personal token, project access token, deploy token, or CI job token.
- Download auth options: personal token, project access token, deploy token, or CI job token.
- For production server pulling release packages outside CI, use a read-only deploy token or project access token, not a CI job token.
- GitLab supports permanent latest-release API:
  `GET /projects/:id/releases/permalink/latest`.
- Release asset direct download can use:
  `/projects/:id/releases/:tag_name/downloads/:direct_asset_path`
  when `direct_asset_path` is configured on the release asset link.
- Publishing a single zip/tar package is simpler than uploading each image separately.
- Include checksums in package and verify before deployment. GitLab package responses also expose checksum headers for file downloads.
- In SHB offline setup, GitLab must be internal. Do not depend on GitLab.com, public package registries, Docker Hub, apt/apk repos, npm, or PyPI during CI/deploy.
- Release package must contain all runtime artifacts needed by production: Docker image archives, compose overrides, deploy scripts, manifest, checksums.
- Build environment must be prepared before pipeline: Docker base images loaded locally, pnpm store available offline, Python wheels available offline, OS-level build packages already installed or mirrored internally.

## Recommended SHB Pattern

1. Build offline package on development server with pre-seeded dependency cache:
   `dist/*.tar.gz`, `.shb-version`, `docker-compose.shb.yml`, deploy script, manifest, checksums.
2. Compress package into one file:
   `plane-shb-release-${SHB_VERSION}.zip` or `.tar.gz`.
3. Upload package to Generic Package Registry:
   package name: `plane-shb-release`
   package version: `${SHB_VERSION}`.
4. Create GitLab tag at target commit:
   - `dev/shb_vX.Y.Z-build.N` for development validation packages.
   - `prod/shb_vX.Y.Z` for production-approved packages.
5. Create GitLab Release with asset link pointing to the package registry URL and `direct_asset_path`.
6. Production runner/server retrieves exact release package from internal GitLab by version, verifies checksum, extracts, loads images, runs deploy.

## Offline Dependency Requirements

- Node: maintain `.pnpm-store` or internal npm proxy. CI should use `pnpm install --offline`.
- Python: maintain wheelhouse for `apps/api/requirements*.txt`. CI should use `pip install --no-index --find-links`.
- Docker: pre-load all base images referenced by Dockerfiles; build with local Docker cache only on development server.
- Architecture: package publish must verify every Docker image is `linux/amd64`; ARM Mac builds are not default release source.
- OS packages: avoid `apt-get`, `apk add`, `curl install` in offline jobs unless internal mirrors exist.
- Tools: `curl`, `ssh/scp`, `sshpass` or SSH key tooling, `sha256sum`, `tar/zip`, Docker CLI, compose plugin installed on runners.

## Sources

- GitLab Generic Package Registry: https://docs.gitlab.com/user/packages/generic_packages/
- GitLab Release fields: https://docs.gitlab.com/user/project/releases/release_fields/
- GitLab Release API: https://docs.gitlab.com/api/releases/
- GitLab Release CI/CD examples: https://docs.gitlab.com/user/project/releases/release_cicd_examples/
- GitLab CLI release upload: https://docs.gitlab.com/cli/release/upload/

## Unresolved Questions

- Internal GitLab version unknown; confirm it supports package registry, release assets, and `direct_asset_path`.
- Exact package max size / Nginx upload limit on Shinhan internal GitLab unknown.
- Confirm whether internal dependency mirrors exist or dependency bundles must be imported manually.
- Confirm final tag format: slash tags `dev/*`/`prod/*` or flat tags `shb-dev-*`/`shb-prod-*`.
