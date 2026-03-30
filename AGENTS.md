# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Plane is an open-source project management tool (similar to Jira/Linear). This is the Enterprise Edition repository containing both open-source and commercial features.

## Tech Stack

- **Frontend**: React 18 with React Router 7, TypeScript, MobX, Tailwind CSS
- **Backend**: Django with Django REST Framework, Celery for background tasks
- **Real-time**: Node.js with Socket.IO and Hocuspocus (collaborative editing)
- **Database**: PostgreSQL 15, Redis (Valkey), RabbitMQ
- **Build**: pnpm 10.24.0, Turbo, Vite
- **Node**: 22.18.0+
- **Python**: 3.8+

## Monorepo Structure

```
apps/
  web/          # Main UI (React Router, port 3000)
  admin/        # Admin panel (port 3001)
  api/          # Django REST backend (port 8000)
  live/         # Real-time collaboration server (Socket.IO + Hocuspocus)
  space/        # Public project space portal
  silo/         # Integration system (Slack, GitHub, Jira/Linear imports)
  flux/         # Request routing proxy
  pi/           # Plane Intelligence (AI features)
  monitor/      # Go-based health check service
  email/        # Email processing service

packages/
  propel/       # New Storybook component library (@plane/propel) - actively developed
  ui/           # Legacy component library (@plane/ui) - being replaced by propel
  types/        # Shared TypeScript types (@plane/types)
  shared-state/ # MobX stores (@plane/shared-state)
  services/     # API client services (@plane/services)
  hooks/        # React hooks (@plane/hooks)
  editor/       # Rich text editor (Tiptap/ProseMirror)
  i18n/         # Internationalization
  constants/    # Shared constants
  utils/        # Utility functions
```

## Common Commands

### Monorepo (from root)

```bash
pnpm dev                    # Start all dev servers
pnpm build                  # Build all packages and apps
pnpm check                  # Run format, lint, and type checks
pnpm check:lint             # ESLint only
pnpm check:types            # TypeScript only
pnpm fix                    # Auto-fix format and lint issues
pnpm fix:lint               # Fix lint issues only
pnpm fix:format             # Fix formatting only
pnpm clean                  # Remove node_modules, dist, build folders
```

### Target Specific Package

```bash
pnpm turbo run <command> --filter=<package>
pnpm --filter=@plane/propel storybook   # Start Storybook on port 6006
pnpm --filter=web dev               # Run only web app
```

### Django API (from apps/api)

```bash
# Run with Docker (recommended for local dev)
# Start all services
docker compose -f docker-compose-local.yml --profile all up
# External services only (postgres, redis, rabbitmq, minio)
docker compose -f docker-compose-local.yml --profile services up
# External services + api, worker, beat-worker
docker compose -f docker-compose-local.yml --profile api up

# Run tests
pytest                                          # All tests
pytest -m unit                                  # Unit tests only
pytest -m contract                              # Contract tests only
pytest plane/tests/unit/models/test_*.py        # Specific test file
pytest -k "test_function_name"                  # Specific test by name

# Django commands (inside container or with venv)
python manage.py migrate
python manage.py runserver
```

### Test Markers (pytest)

- `unit` - Unit tests for models, serializers, utilities
- `contract` - Contract tests for API endpoints
- `smoke` - Smoke tests for critical functionality
- `slow` - Tests that may be skipped in CI

## Local Development Setup

1. Clone the repo and run `./setup.sh`
2. Start backend services: `docker compose -f docker-compose-local.yml --profile all up`
   - Use `--profile services` for only external services (postgres, redis, rabbitmq, minio)
   - Use `--profile api` for external services + api, worker, beat-worker, migrator
3. Start frontend: `pnpm dev`
4. Admin setup: http://localhost:3001/god-mode/
5. Main app: http://localhost:3000

**Requirements**: Docker, Node.js 22+, Python 3.8+, 12GB+ RAM recommended

## Copyright Headers

Every source file in this repository contains a copyright/license header. When reading files, **ignore these headers** — they are boilerplate and not relevant to understanding the code logic. Do **not** remove, modify, or omit them when editing existing files. When creating **new** files, include the appropriate header.

**TypeScript / JavaScript / TSX / JSX:**

```ts
/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */
```

**Python:**

```python
# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
```

## Code Style

- **TypeScript**: Strict mode, use `workspace:*` for internal packages, `catalog:` for external deps
- **Formatting**: oxfmt with built-in Tailwind class sorting (runs on commit via Husky)
- **Linting**: ESLint 9 with typed linting from root config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **State**: MobX stores in `@plane/shared-state`
- **Python**: Ruff for linting/formatting, line length 120

## Architecture Notes

### Frontend Data Flow

Components use MobX stores from `@plane/shared-state`. API calls go through services in `@plane/services` which wrap axios. Real-time updates come via Socket.IO from the `live` server.

### Backend Structure (apps/api/plane)

- `api/` - REST API endpoints (DRF ViewSets)
- `app/` - Core application logic
- `bgtasks/` - Celery background tasks
- `authentication/` - Auth providers (OAuth, SAML, LDAP, OIDC)
- `automations/` - Workflow automation engine
- `ee/` - Enterprise Edition features
- `event_stream/` - Event publishing for real-time
- `graphql/` - GraphQL API layer

### Real-time Server (apps/live)

- `socket-io/` - Socket.IO for workspace events
- `hocuspocus.ts` - Collaborative document editing (Yjs)

## Important Files

- `turbo.json` - Turbo build configuration
- `pnpm-workspace.yaml` - Workspace and catalog definitions
- `eslint.config.mjs` - Root ESLint configuration
- `apps/api/pytest.ini` - Python test configuration
- `apps/api/plane/settings/` - Django settings by environment
