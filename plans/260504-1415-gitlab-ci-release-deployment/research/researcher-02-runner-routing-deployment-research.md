# GitLab Runner Routing + Deployment Research

## Scope

Research branch-to-server deployment with separate runners on development and production servers.

## Findings

- GitLab runner tags select which runner can run a job. A runner must have all tags listed by the job.
- Protected runners can be limited to protected branches and protected tags.
- Use runner tags to bind jobs to the intended host:
  `dev-shell`, `prod-shell`, maybe `docker-build`.
- Keep `develop` and `preview` protected because deploy jobs hold credentials and can run shell commands on target infrastructure.
- For this repo, current `.gitlab-ci.yml` already has branch rules:
  `develop` builds/deploys test and `preview` builds/manual-deploys production.
- Current deploy strategy uses CI artifacts and SCP with `sshpass` to target server. Since runners are installed on dev/prod servers, this is unnecessary for internal deploys and forces server credentials into GitLab.
- For production hardware limits, production should avoid `docker build`; it should only retrieve the internal package, `docker load`, migrate, and compose up.
- Development server should be the only normal build runner because it matches target `linux/amd64` architecture.
- Shell executor on deployment servers is practical but high trust. Lock runners to project, tags, protected refs, and avoid untagged jobs.
- Dynamic runner selection via CI variable is possible, but explicit job tags are easier to audit.
- Because all machines are offline, runner jobs must not use container images from public registries. Shell executor with preinstalled tools is preferred, or internal GitLab Container Registry images must be preloaded/mirrored.
- Existing `image: node:22-alpine`, `python:3.12-slim`, `docker:latest`, `postgres:15-alpine`, and `valkey/*` references are unsafe offline unless mirrored internally and referenced by internal registry path.
- Safer internal deploy model: GitLab schedules job to tagged runner on target server; job runs local deploy script. No SSH user/password in GitLab.

## Recommended SHB Runner Model

- Development server runner:
  tags: `shb-dev`, `shell`, `docker`
  protected: yes
  run untagged: no
  purpose: build + publish dev/prod release packages; optionally deploy dev from release package.
- Production server runner:
  tags: `shb-prod`, `shell`, `deploy-only`
  protected: yes
  run untagged: no
  purpose: deploy from internal GitLab release package only; no build and no public network calls.
- Optional manual development-server release job:
  tags: `shb-dev`, `shell`, `docker`
  purpose: publish package + GitLab Release when a release variable is set.

## Sources

- GitLab runner configuration: https://docs.gitlab.com/ci/runners/configure_runners/
- GitLab pipelines and protected branch runner behavior: https://docs.gitlab.com/ci/pipelines/
- GitLab CI artifacts: https://docs.gitlab.com/ci/jobs/job_artifacts/

## Unresolved Questions

- Should preview merge auto-deploy production, or remain manual approval?
- Are development and production servers allowed to call internal GitLab API directly over LAN?
- Are public CI images mirrored internally, or should all jobs move to shell executor?
- Should tag format use `dev/*` and `prod/*`, or flat `shb-dev-*` and `shb-prod-*`?
- Should deploy package read token be stored as local server config instead of GitLab variable?
