# LLM Helper Notes — making the codebase friendly for automated agents

Purpose
-------
This short guide helps LLM coding agents and contributors quickly find context, craft safe diffs, and produce maintainable changes.

Primary anchors (high-signal files)
- Backend entry: `apps/api/manage.py`, `apps/api/plane/settings/*.py`, `apps/api/requirements.txt`, `apps/api/pyproject.toml`.
- API tests and config: `apps/api/pytest.ini`, `apps/api/plane/tests/`.
- Frontend entry: `apps/web/`, `apps/admin/` (`vite.config.ts`, `tsconfig.json`, `package.json`).
- Monorepo orchestrator: root `package.json`, `turbo.json`, `pnpm-workspace.yaml`.
- Docker / deployment: `docker-compose.yml`, `docker-compose-local.yml`, `.github/workflows/`.

How to provide context to an LLM
- Always include: target file path(s), 8–20 line snippets around the edit location, the goal, and any failing tests or errors.
- If the change spans multiple files, include a short dependency summary: which modules import which packages.
- When changing data models: include migration files or the exact Django model class block.

Recommended prompts (examples)
- "Add an optional `archived_at: DateTime` field to the `Issue` model in `apps/api/plane/models/issue.py`. Show the model diff, the migration steps, and a pytest to cover serialization." 
- "Refactor `packages/utils` function `foo()` to be async-compatible. Provide a targeted unit test and list all packages that import `foo`." 
- "Add a new API endpoint `POST /internal/notify` in `apps/api/plane/urls.py` and `views.py` that accepts JSON `{type, payload}`. Show view, URL, serializer, unit test, and minimal docs change." 

Safety & verification checklist for agents
- Run linters relevant to the language changed (`ruff` for Python, `eslint`/`prettier` for JS/TS).
- Add or update tests. Prefer unit tests over large integration tests for incremental PRs.
- Avoid large refactors across many packages in a single PR — break changes into small, reviewable PRs.

Useful search queries for the repo (copyable)
- Find Django models: `repo:./ apps/api/**/models.py` (or search `class .*models.Model`).
- Find package exports: `packages/**/src` and `packages/**/package.json`.

How to produce diffs
- Provide a single unified diff with file path context (3–8 lines) per file.
- When adding migrations, include the migration file and the command used to generate it.

Context window strategy
- Prefer: (1) the target file (full), (2) immediate imports and their files (first 200 lines), (3) tests touching the target.
