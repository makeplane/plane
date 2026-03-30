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
- Run a script in all packages: `pnpm -r run <script>`

## Monorepo Tooling

We use **Turbo** for build system orchestration.

- Configuration: `turbo.json`

## Project Structure

- `apps/`: Contains application services (admin, api, live, proxy, space, web).
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
- Production/Staging uses `docker-compose.yml`.

### Docker Compose Profiles

The local compose file supports profiles for selective service startup:

| Profile    | Services                                         | Command                                                            |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `all`      | All services                                     | `docker compose -f docker-compose-local.yml --profile all up`      |
| `services` | External only (postgres, redis, rabbitmq, minio) | `docker compose -f docker-compose-local.yml --profile services up` |
| `api`      | External + api, worker, beat-worker, migrator    | `docker compose -f docker-compose-local.yml --profile api up`      |

To set a default profile, add `COMPOSE_PROFILES=all` to your `.env` file.
