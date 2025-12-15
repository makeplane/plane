# Forking Assessment — plane (snapshot)

Summary
-------
This repo is a monorepo for Plane (open-source project management). It combines a Django API (`apps/api`) with multiple TypeScript/React frontends (`apps/web`, `apps/admin`, `apps/space`, `apps/live`) and shared `packages/*` libraries. The repo uses `pnpm` + `turbo` for workspace orchestration, Docker for containerization, and GitHub Actions for CI.

Key facts
- License: AGPL-3.0 (copyleft — network-accessible modifications may require source distribution under AGPL).
- Monorepo tooling: `pnpm` (workspace), `turbo` (task runner).
- Backend: Django (Python 3.12), tests with `pytest`, linting with `ruff`.
- Frontend: Next.js/Vite-based React apps (Node >=22), linting with `eslint` + Prettier and TypeScript.
- Containers: multiple Dockerfiles and `docker-compose` orchestration files exist for dev and production.
- CI: GitHub Actions workflows for API and web (lint/build/test pipelines).

Important paths (anchors for quick edits)
- `apps/api/` — Django project, `manage.py`, `requirements.txt`, `pyproject.toml`, `pytest.ini`, Dockerfiles
- `apps/web/`, `apps/admin/`, `apps/space/`, `apps/live/` — web frontends
- `packages/` — shared TypeScript packages and utilities
- `docker-compose.yml`, `docker-compose-local.yml` — multi-service orchestration
- `.github/workflows/*` — CI definitions
- `package.json` (root) and `turbo.json` — workspace scripts and orchestration

Assessment & fork considerations
- Licensing: Forking is allowed, but AGPL imposes strong copyleft. If you plan proprietary changes or a closed hosted service, consult legal counsel before using this codebase.
- Scope for fork: Common targets are UI customization, API extensions, and hosting defaults (DB, SMTP). Backend changes may require migration strategy and thorough tests.
- Recommended minimal fork goals:
  - Provide a simplified, documented dev experience (see `DEV_SETUP.md`).
  - Add a CI that runs unit tests and linting for changed packages only.
  - Isolate and document environment/secrets to ease onboarding.

Risks & hotspots
- Database migrations and `manage.py` — migrations are critical when changing models.
- Shared TypeScript packages — changes ripple across frontends; add tests before refactors.
- Large dev environment — Node v22+, Python 3.12, Docker; contributors may need lighter alternatives.

Recommended initial fork tasks
1. Add `DEV_SETUP.md` (provides Windows PowerShell + Docker instructions).
2. Add `LLM_HELP.md` to make the codebase easy for automated agents and contributors to reason about.
3. Create a `fork/initial` branch and run the CI locally to ensure parity.
4. Optionally add `docker-compose.dev.simple.yml` to offer a minimal local dev stack.

Branching & release guidance for the fork
- Keep `preview` aligned to upstream initially; create feature branches named `fork/<area>-<short>`.
- Configure GitHub Actions to avoid running expensive jobs on every branch; run heavy jobs on merges to the fork's main branch.

Next steps
- Run a smoke build: `pnpm install` then `pnpm run dev` (see `DEV_SETUP.md`).
- If desired, I can prepare a small PR that adds a minimal dev compose file and a targeted CI job.
