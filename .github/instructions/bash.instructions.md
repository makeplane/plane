---
description: Guidelines for bash commands and tooling in the monorepo
applyTo: "**/*.sh"
---

# Bash & Tooling Instructions

This document outlines the standard tools and commands used in this monorepo.

## Package Manager

We use **pnpm** for package management.

- **Do not use `npm` or `yarn`.**
- Lockfile: `pnpm-lock.yaml`
- Workspace configuration: `pnpm-workspace.yaml`

### Common Commands

- Install dependencies: `pnpm install`
- Run a script in a specific package: `pnpm --filter <package_name> run <script>`
- Run a task across the monorepo through Turbo with the root scripts: `pnpm build`, `pnpm dev`, `pnpm check`, `pnpm fix` (or `pnpm turbo run <task> --filter=<package>`), rather than `pnpm -r run <script>`

### Lint & format

- Lint with OxLint: `pnpm check:lint` / `pnpm fix:lint` (config: `.oxlintrc.json`)
- Format with oxfmt: `pnpm check:format` / `pnpm fix:format` (config: `.oxfmtrc.json`)
- `pnpm check` runs format, lint and types; lint-staged runs oxfmt and OxLint on staged files at commit time

## Monorepo Tooling

We use **Turbo** for build system orchestration.

- Configuration: `turbo.json`

## Project Structure

- `apps/`: Contains application services (admin, api, live, proxy, space, web). `apps/api` (Django, managed with uv) and `apps/proxy` (Caddy) are excluded from the pnpm workspace.
- `packages/`: Contains shared packages and libraries.
- `deployments/`: Deployment configurations.

## Running Tests

- To run tests in a specific package (e.g., codemods):
  ```bash
  cd packages/codemods
  pnpm run test
  ```
- Or from root:
  ```bash
  pnpm --filter @plane/codemods run test
  ```

## Docker

- Local development uses `docker-compose-local.yml`.
- `docker-compose.yml` builds every service from the local Dockerfiles (for testing a full build).
- Self-hosting configs for releases live in `deployments/` (`cli`, `aio`, `swarm`, `kubernetes`).
- Backend tests run in `docker-compose-test.yml` (see `apps/api/tests/RUNNING_TESTS.md`).
